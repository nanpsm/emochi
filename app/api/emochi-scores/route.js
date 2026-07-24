import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getPool, sql } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user?.dbId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const pool = await getPool();
  const result = await pool.request()
    .input("user_id", sql.UniqueIdentifier, session.user.dbId)
    .query(`
      SELECT e.name AS emochi_name, ues.score
      FROM user_emochi_scores ues
      JOIN emochi_types e ON e.id = ues.emochi_id
      WHERE ues.user_id = @user_id
    `);

  // Return as { cheer: { score, level }, fear: { score, level }, ... }
  const scores = {};
  for (const row of result.recordset) {
    const id = row.emochi_name.toLowerCase();
    const level = Math.min(10, Math.floor(row.score / 10));
    scores[id] = { score: row.score, level };
  }
  return NextResponse.json(scores);
}
