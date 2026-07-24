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
          fr.id AS request_id,
          u.id,
          u.display_name,
          u.username,
          e.name AS avatar_emochi,
          fr.created_at
        FROM friend_requests fr
        JOIN users u ON u.id = fr.from_user_id
        LEFT JOIN emochi_types e ON e.id = u.avatar_emochi_id
        WHERE fr.to_user_id = @uid AND fr.status = 'pending'
        ORDER BY fr.created_at DESC
      `);

    return NextResponse.json(result.recordset);
  } catch (err) {
    const msg = err?.message ?? err?.toString() ?? "Unknown error";
    console.error("GET /api/friends/requests:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
