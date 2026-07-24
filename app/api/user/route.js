import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getPool, sql } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user?.dbId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const pool = await getPool();
  const result = await pool
    .request()
    .input("id", sql.UniqueIdentifier, session.user.dbId)
    .query(`
      SELECT u.display_name, e.name AS avatar_name
      FROM users u
      LEFT JOIN emochi_types e ON e.id = u.avatar_emochi_id
      WHERE u.id = @id
    `);

  const row = result.recordset[0];
  return NextResponse.json({
    displayName: row?.display_name ?? null,
    avatar: row?.avatar_name ? row.avatar_name.toLowerCase() : null,
  });
}

export async function PATCH(req) {
  const session = await auth();
  if (!session?.user?.dbId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { displayName, avatar } = await req.json();
  const pool = await getPool();

  // Resolve avatar name to emochi_types id
  let emochiId = null;
  if (avatar) {
    const emochiResult = await pool
      .request()
      .input("name", sql.NVarChar, avatar.charAt(0).toUpperCase() + avatar.slice(1))
      .query("SELECT id FROM emochi_types WHERE name = @name");
    emochiId = emochiResult.recordset[0]?.id ?? null;
  }

  await pool
    .request()
    .input("id", sql.UniqueIdentifier, session.user.dbId)
    .input("display_name", sql.NVarChar, displayName?.trim() || null)
    .input("avatar_emochi_id", sql.Int, emochiId)
    .query(`
      UPDATE users
      SET display_name = @display_name,
          avatar_emochi_id = @avatar_emochi_id,
          updated_at = SYSDATETIMEOFFSET()
      WHERE id = @id
    `);

  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  const session = await auth();
  if (!session?.user?.dbId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const pool = await getPool();
  await pool
    .request()
    .input("id", sql.UniqueIdentifier, session.user.dbId)
    .query("DELETE FROM users WHERE id = @id");

  return NextResponse.json({ ok: true });
}
