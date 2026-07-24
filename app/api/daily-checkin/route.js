import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getPool, sql } from "@/lib/db";

const SLEEP_HOURS = [4.0, 5.5, 8.0, 10.0];
const WORK_HOURS  = [1.5, 5.5, 9.0, 11.0];

// Delta tables — must match the ones in app/home/page.js
// Delta tables — names match emochi_types.name in DB (display names)
const FEELINGS = [
  { deltas: { Cheer: 3, Tear: -3 } },            // Happy
  { deltas: { Cheer: 3, Dozy: -2 } },            // Excited
  { deltas: { Cheer: 3, Zen: 2, Fear: -2 } },    // Hopeful
  { deltas: { Zen: 3, Buzzy: -3 } },              // Calm
  { deltas: { Buzzy: 3, Zen: -3 } },              // Stressed
  { deltas: { Fear: 3, Buzzy: 2, Zen: -2 } },    // Anxious
  { deltas: { Fear: 3, Cheer: -2 } },             // Worried
  { deltas: { Tear: 3, Cheer: -3 } },             // Sad
  { deltas: { Dozy: 3, Cheer: -2 } },             // Tired
  { deltas: { Tear: 2, Bubble: 3, Cheer: -2 } }, // Lonely
];

const SLEEP_DELTAS = [
  { Dozy: 3, Buzzy: 2, Zen: -2 },  // <5h
  { Dozy: 2 },                       // 5-6h
  { Zen: 3, Cheer: 2, Buzzy: -2 },  // 7-9h
  { Dozy: 2 },                       // >9h
];

const WORK_DELTAS = [
  { Dozy: 2, Buzzy: -2 },           // 0-3h
  {},                                 // 4-7h
  { Buzzy: 3, Zen: -2 },            // 8-10h
  { Buzzy: 3, Dozy: 2, Cheer: -2 }, // >10h
];

function calcDeltas(feelingIdxs, sleepIdx, workIdx) {
  const total = {};
  const apply = (d) => Object.entries(d).forEach(([k, v]) => { total[k] = (total[k] || 0) + v; });
  (feelingIdxs ?? []).forEach(i => { if (FEELINGS[i]) apply(FEELINGS[i].deltas); });
  if (sleepIdx != null && SLEEP_DELTAS[sleepIdx]) apply(SLEEP_DELTAS[sleepIdx]);
  if (workIdx  != null && WORK_DELTAS[workIdx])  apply(WORK_DELTAS[workIdx]);
  return total;
}

export async function GET(req) {
  const session = await auth();
  if (!session?.user?.dbId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date");
  if (!date) return NextResponse.json(null);

  const pool = await getPool();
  const result = await pool.request()
    .input("user_id",      sql.UniqueIdentifier, session.user.dbId)
    .input("checkin_date", sql.Date,             new Date(date))
    .query(`
      SELECT sleep_hours, work_hours, mood_score, feelings
      FROM daily_checkin
      WHERE user_id = @user_id AND CAST(checkin_date AS DATE) = CAST(@checkin_date AS DATE)
    `);

  return NextResponse.json(result.recordset[0] ?? null);
}

export async function POST(req) {
  const session = await auth();
  if (!session?.user?.dbId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { date, sleepIdx, workIdx, feelingIdxs, moodScore } = await req.json();
  const pool = await getPool();
  const userId = session.user.dbId;

  const sleepHours = sleepIdx != null ? SLEEP_HOURS[sleepIdx] : null;
  const workHours  = workIdx  != null ? WORK_HOURS[workIdx]   : null;

  // 1. Save check-in row
  await pool.request()
    .input("user_id",      sql.UniqueIdentifier, userId)
    .input("checkin_date", sql.Date,             new Date(date))
    .input("sleep_hours",  sql.Decimal(4, 1),    sleepHours)
    .input("work_hours",   sql.Decimal(4, 1),    workHours)
    .input("mood_score",   sql.Int,              moodScore ?? null)
    .input("feelings",     sql.NVarChar,         feelingIdxs?.join(",") ?? null)
    .query(`
      MERGE daily_checkin AS t
      USING (SELECT @user_id AS user_id) AS s ON t.user_id = s.user_id
        AND CAST(t.checkin_date AS DATE) = CAST(@checkin_date AS DATE)
      WHEN MATCHED THEN UPDATE SET
        sleep_hours  = @sleep_hours,
        work_hours   = @work_hours,
        mood_score   = @mood_score,
        feelings     = @feelings,
        updated_at   = SYSDATETIMEOFFSET()
      WHEN NOT MATCHED THEN INSERT
        (user_id, checkin_date, sleep_hours, work_hours, mood_score, feelings, updated_at)
        VALUES
        (@user_id, @checkin_date, @sleep_hours, @work_hours, @mood_score, @feelings, SYSDATETIMEOFFSET());
    `);

  // 2. Compute deltas and update scores
  const deltas = calcDeltas(feelingIdxs, sleepIdx, workIdx);
  if (Object.keys(deltas).length > 0) {
    // Fetch current base scores
    const scoresResult = await pool.request()
      .input("user_id", sql.UniqueIdentifier, userId)
      .query(`
        SELECT e.name AS emochi_name, ues.score
        FROM user_emochi_scores ues
        JOIN emochi_types e ON e.id = ues.emochi_id
        WHERE ues.user_id = @user_id
      `);

    // Fetch emochi_types for id lookup
    const typesResult = await pool.request()
      .query("SELECT id, name FROM emochi_types");
    const nameToId = Object.fromEntries(typesResult.recordset.map(r => [r.name.toLowerCase(), r.id]));

    const baseScores = Object.fromEntries(scoresResult.recordset.map(r => [r.emochi_name, r.score]));

    for (const [emochiName, delta] of Object.entries(deltas)) {
      const emochiId = nameToId[emochiName.toLowerCase()];
      if (!emochiId) continue;
      const base  = baseScores[emochiName] ?? 50;
      const newScore = Math.max(0, Math.min(100, base + delta));

      // Update current score
      await pool.request()
        .input("user_id",   sql.UniqueIdentifier, userId)
        .input("emochi_id", sql.Int,              emochiId)
        .input("score",     sql.Int,              newScore)
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

      // Upsert today's history
      await pool.request()
        .input("user_id",   sql.UniqueIdentifier, userId)
        .input("emochi_id", sql.Int,              emochiId)
        .input("score",     sql.Int,              newScore)
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
  }

  return NextResponse.json({ ok: true });
}
