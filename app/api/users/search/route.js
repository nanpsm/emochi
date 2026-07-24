import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getPool, sql } from "@/lib/db";

export async function GET(req) {
  const session = await auth();
  if (!session?.user?.dbId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim();
  if (!q || q.length < 2) return NextResponse.json([]);

  const pool = await getPool();
  const result = await pool.request()
    .input("q",       sql.NVarChar, `%${q}%`)
    .input("self_id", sql.UniqueIdentifier, session.user.dbId)
    .query(`
      SELECT TOP 20
        u.id,
        u.display_name,
        u.username,
        e.name AS avatar_emochi
      FROM users u
      LEFT JOIN emochi_types e ON e.id = u.avatar_emochi_id
      WHERE u.id <> @self_id
        AND (
          u.display_name LIKE @q
          OR u.username   LIKE @q
        )
      ORDER BY u.display_name
    `);

  return NextResponse.json(result.recordset);
}
