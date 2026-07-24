import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getPool, sql } from "@/lib/db";

// GET /api/friends/[id]/scores — get a friend's emochi scores (only if friends)
export async function GET(req, { params }) {
  const session = await auth();
  if (!session?.user?.dbId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: friendId } = await params;
  const userId = session.user.dbId;
  const pool = await getPool();

  // Verify friendship
  const check = await pool.request()
    .input("a", sql.UniqueIdentifier, userId)
    .input("b", sql.UniqueIdentifier, friendId)
    .query(`
      SELECT 1 FROM friendships
      WHERE (user_id_1 = @a AND user_id_2 = @b) OR (user_id_1 = @b AND user_id_2 = @a)
    `);
  if (check.recordset.length === 0) return NextResponse.json({ error: "Not friends" }, { status: 403 });

  const result = await pool.request()
    .input("uid", sql.UniqueIdentifier, friendId)
    .query(`
      SELECT e.name AS emochi_name, ues.score
      FROM user_emochi_scores ues
      JOIN emochi_types e ON e.id = ues.emochi_id
      WHERE ues.user_id = @uid
    `);

  const scores = {};
  for (const row of result.recordset) {
    const id = row.emochi_name.toLowerCase();
    scores[id] = { score: row.score, level: Math.min(10, Math.floor(row.score / 10)) };
  }
  return NextResponse.json(scores);
}
