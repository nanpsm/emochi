import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getPool, sql } from "@/lib/db";

export async function GET(req) {
  const session = await auth();
  if (!session?.user?.dbId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date"); // YYYY-MM-DD
  if (!date) return NextResponse.json([]);

  const pool = await getPool();
  const result = await pool.request()
    .input("user_id", sql.UniqueIdentifier, session.user.dbId)
    .input("date",    sql.Date,             new Date(date))
    .query(`
      SELECT e.name AS emochi_name, latest.score
      FROM (
        SELECT emochi_id, score,
               ROW_NUMBER() OVER (PARTITION BY emochi_id ORDER BY recorded_at DESC) AS rn
        FROM daily_score_history
        WHERE user_id = @user_id
          AND CAST(recorded_at AS DATE) = CAST(@date AS DATE)
      ) AS latest
      JOIN emochi_types e ON e.id = latest.emochi_id
      WHERE latest.rn = 1
      ORDER BY latest.score DESC
    `);

  return NextResponse.json(result.recordset);
}
