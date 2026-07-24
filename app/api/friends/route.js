import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getPool, sql } from "@/lib/db";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.dbId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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
        JOIN users u ON u.id = CASE WHEN f.user_id = @uid THEN f.friend_id ELSE f.user_id END
        LEFT JOIN emochi_types e ON e.id = u.avatar_emochi_id
        WHERE (f.user_id = @uid OR f.friend_id = @uid) AND f.status = 'accepted'
        ORDER BY u.display_name
      `);

    return NextResponse.json(result.recordset);
  } catch (err) {
    const msg = err?.message ?? err?.toString() ?? "Unknown error";
    console.error("GET /api/friends:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
