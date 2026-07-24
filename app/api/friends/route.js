import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getPool, sql } from "@/lib/db";
import { ensureFriendTables } from "@/lib/ensure-friend-tables";

export async function GET() {
  const session = await auth();
  if (!session?.user?.dbId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await ensureFriendTables();
  const pool = await getPool();

  const result = await pool.request()
    .input("uid", sql.UniqueIdentifier, session.user.dbId)
    .query(`
      SELECT
        u.id,
        u.display_name,
        u.username,
        e.name AS avatar_emochi
      FROM friendships f
      JOIN users u ON u.id = CASE WHEN f.user_id_1 = @uid THEN f.user_id_2 ELSE f.user_id_1 END
      LEFT JOIN emochi_types e ON e.id = u.avatar_emochi_id
      WHERE f.user_id_1 = @uid OR f.user_id_2 = @uid
      ORDER BY u.display_name
    `);

  return NextResponse.json(result.recordset);
}
