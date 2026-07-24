import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getPool, sql } from "@/lib/db";
import { ensureFriendTables } from "@/lib/ensure-friend-tables";

export async function GET(req) {
  try {
    const session = await auth();
    if (!session?.user?.dbId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q")?.trim();
    if (!q || q.length < 2) return NextResponse.json([]);

    const pool = await getPool();

    // Create tables if missing — fail silently so search still works
    try {
      await ensureFriendTables();
    } catch (tableErr) {
      console.error("ensureFriendTables failed:", tableErr?.message);
    }

    // Try full query with friendship status
    try {
      const result = await pool.request()
        .input("q",       sql.NVarChar, `%${q}%`)
        .input("self_id", sql.UniqueIdentifier, session.user.dbId)
        .query(`
          SELECT TOP 20
            u.id,
            u.display_name,
            u.username,
            e.name AS avatar_emochi,
            CASE
              WHEN EXISTS (
                SELECT 1 FROM friendships
                WHERE (user_id_1 = @self_id AND user_id_2 = u.id)
                   OR (user_id_1 = u.id    AND user_id_2 = @self_id)
              ) THEN 'friends'
              WHEN EXISTS (
                SELECT 1 FROM friend_requests
                WHERE from_user_id = @self_id AND to_user_id = u.id AND status = 'pending'
              ) THEN 'pending_sent'
              WHEN EXISTS (
                SELECT 1 FROM friend_requests
                WHERE from_user_id = u.id AND to_user_id = @self_id AND status = 'pending'
              ) THEN 'pending_received'
              ELSE 'none'
            END AS friend_status
          FROM users u
          LEFT JOIN emochi_types e ON e.id = u.avatar_emochi_id
          WHERE u.id <> @self_id
            AND (u.display_name LIKE @q OR u.username LIKE @q)
          ORDER BY u.display_name
        `);
      return NextResponse.json(result.recordset);
    } catch (queryErr) {
      console.error("Full search query failed, falling back:", queryErr?.message);

      // Fallback: simple search without friendship status
      const result = await pool.request()
        .input("q",       sql.NVarChar, `%${q}%`)
        .input("self_id", sql.UniqueIdentifier, session.user.dbId)
        .query(`
          SELECT TOP 20
            u.id,
            u.display_name,
            u.username,
            e.name AS avatar_emochi,
            'none' AS friend_status
          FROM users u
          LEFT JOIN emochi_types e ON e.id = u.avatar_emochi_id
          WHERE u.id <> @self_id
            AND (u.display_name LIKE @q OR u.username LIKE @q)
          ORDER BY u.display_name
        `);
      return NextResponse.json(result.recordset);
    }
  } catch (err) {
    console.error("Search route error:", err?.message);
    return NextResponse.json({ error: err?.message ?? "Search failed" }, { status: 500 });
  }
}
