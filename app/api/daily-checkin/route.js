import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getPool, sql } from "@/lib/db";

// Map option indices to representative hour values
const SLEEP_HOURS = [4.0, 5.5, 8.0, 10.0];  // <5h, 5-6h, 7-9h, >9h
const WORK_HOURS  = [1.5, 5.5, 9.0, 11.0];  // 0-3h, 4-7h, 8-10h, >10h

export async function GET(req) {
  const session = await auth();
  if (!session?.user?.dbId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date"); // YYYY-MM-DD

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

  const sleepHours = sleepIdx != null ? SLEEP_HOURS[sleepIdx] : null;
  const workHours  = workIdx  != null ? WORK_HOURS[workIdx]   : null;

  await pool.request()
    .input("user_id",      sql.UniqueIdentifier, session.user.dbId)
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

  return NextResponse.json({ ok: true });
}
