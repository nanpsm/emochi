import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getPool, sql } from "@/lib/db";

export async function POST(req) {
  const session = await auth();
  if (!session?.user?.dbId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { scores, personalityType } = await req.json();
  // scores: { Cheer: 60, Fear: 45, Buzzy: 70, Tear: 55, Zen: 65, Bubble: 50, Dozy: 40 }

  const pool = await getPool();
  const userId = session.user.dbId;

  // Look up all emochi_types in one query
  const emochiRows = await pool.request()
    .query("SELECT id, name FROM emochi_types");
  const nameToId = Object.fromEntries(
    emochiRows.recordset.map(r => [r.name.toLowerCase(), r.id])
  );

  // Upsert each score into current scores + daily history (one row per emochi per day)
  for (const [emochiName, score] of Object.entries(scores)) {
    const emochiId = nameToId[emochiName.toLowerCase()];
    if (!emochiId) continue;

    // 1. Upsert current score
    await pool.request()
      .input("user_id",   sql.UniqueIdentifier, userId)
      .input("emochi_id", sql.Int,              emochiId)
      .input("score",     sql.Int,              score)
      .query(`
        MERGE user_emochi_scores AS t
        USING (SELECT @user_id AS user_id, @emochi_id AS emochi_id) AS s
          ON t.user_id = s.user_id AND t.emochi_id = s.emochi_id
        WHEN MATCHED THEN
          UPDATE SET score = @score, updated_at = SYSDATETIMEOFFSET()
        WHEN NOT MATCHED THEN
          INSERT (id, user_id, emochi_id, score, updated_at)
          VALUES (NEWID(), @user_id, @emochi_id, @score, SYSDATETIMEOFFSET());
      `);

    // 2. Upsert today's daily history — one row per (user, emochi, calendar day)
    //    Day boundary is midnight; scores submitted after 11:59 PM still count for that calendar day.
    await pool.request()
      .input("user_id",   sql.UniqueIdentifier, userId)
      .input("emochi_id", sql.Int,              emochiId)
      .input("score",     sql.Int,              score)
      .query(`
        MERGE daily_score_history AS t
        USING (SELECT @user_id AS user_id, @emochi_id AS emochi_id) AS s
          ON t.user_id   = s.user_id
         AND t.emochi_id = s.emochi_id
         AND CAST(t.recorded_at AS DATE) = CAST(SYSDATETIMEOFFSET() AS DATE)
        WHEN MATCHED THEN
          UPDATE SET score = @score, recorded_at = SYSDATETIMEOFFSET()
        WHEN NOT MATCHED THEN
          INSERT (id, user_id, emochi_id, score, recorded_at)
          VALUES (NEWID(), @user_id, @emochi_id, @score, SYSDATETIMEOFFSET());
      `);
  }

  // Save personality type on the user row
  if (personalityType) {
    await pool.request()
      .input("id",               sql.UniqueIdentifier, userId)
      .input("personality_type", sql.NVarChar,         personalityType)
      .query(`
        UPDATE users
        SET personality_type = @personality_type, updated_at = SYSDATETIMEOFFSET()
        WHERE id = @id
      `);
  }

  return NextResponse.json({ ok: true });
}
