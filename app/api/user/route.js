import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getPool, sql } from "@/lib/db";

async function ensureAvatarKeyColumn(pool) {
  await pool.request().query(`
    IF NOT EXISTS (
      SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME = 'users' AND COLUMN_NAME = 'avatar_key'
    )
      ALTER TABLE users ADD avatar_key NVARCHAR(50) NULL
  `);
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.dbId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const pool = await getPool();
  try { await ensureAvatarKeyColumn(pool); } catch {}

  const result = await pool
    .request()
    .input("id", sql.UniqueIdentifier, session.user.dbId)
    .query(`
      SELECT u.display_name, u.username, u.personality_type,
             u.avatar_key, e.name AS avatar_name
      FROM users u
      LEFT JOIN emochi_types e ON e.id = u.avatar_emochi_id
      WHERE u.id = @id
    `);

  const row = result.recordset[0];

  const interestsResult = await pool
    .request()
    .input("id", sql.UniqueIdentifier, session.user.dbId)
    .query(`
      SELECT i.name FROM user_interests ui
      JOIN interests i ON i.id = ui.interest_id
      WHERE ui.user_id = @id
    `);

  // Prefer the full avatar_key (includes winner variant), fall back to base emochi type name
  const avatarKey = row?.avatar_key ?? (row?.avatar_name ? row.avatar_name.toLowerCase() : null);

  return NextResponse.json({
    displayName: row?.display_name ?? null,
    username: row?.username ?? null,
    avatar: avatarKey,
    mbti: row?.personality_type ?? null,
    interests: interestsResult.recordset.map(r => r.name),
  });
}

export async function PATCH(req) {
  const session = await auth();
  if (!session?.user?.dbId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { displayName, avatar } = await req.json();
  const pool = await getPool();
  try { await ensureAvatarKeyColumn(pool); } catch {}

  // avatar may be "zen", "zen-winner", etc. Strip suffix for FK lookup.
  let emochiId = null;
  if (avatar) {
    const baseName = avatar.replace(/-winner$/, "");
    const capitalized = baseName.charAt(0).toUpperCase() + baseName.slice(1);
    const emochiResult = await pool
      .request()
      .input("name", sql.NVarChar, capitalized)
      .query("SELECT id FROM emochi_types WHERE name = @name");
    emochiId = emochiResult.recordset[0]?.id ?? null;
  }

  await pool
    .request()
    .input("id", sql.UniqueIdentifier, session.user.dbId)
    .input("display_name", sql.NVarChar, displayName?.trim() || null)
    .input("avatar_emochi_id", sql.Int, emochiId)
    .input("avatar_key", sql.NVarChar, avatar ?? null)
    .query(`
      UPDATE users
      SET display_name = @display_name,
          avatar_emochi_id = @avatar_emochi_id,
          avatar_key = @avatar_key,
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
