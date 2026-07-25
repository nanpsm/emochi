import { NextResponse } from "next/server";
import { getPool } from "@/lib/db";

// GET /api/setup/friends-tables — one-time table creation (safe to re-run)
export async function GET() {
  const pool = await getPool();

  await pool.request().query(`
    IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='friend_requests' AND xtype='U')
    CREATE TABLE friend_requests (
      id            INT IDENTITY PRIMARY KEY,
      from_user_id  UNIQUEIDENTIFIER NOT NULL REFERENCES users(id) ON DELETE NO ACTION,
      to_user_id    UNIQUEIDENTIFIER NOT NULL REFERENCES users(id) ON DELETE NO ACTION,
      status        NVARCHAR(20) NOT NULL DEFAULT 'pending',
      created_at    DATETIMEOFFSET NOT NULL DEFAULT SYSDATETIMEOFFSET(),
      CONSTRAINT uq_friend_request UNIQUE (from_user_id, to_user_id)
    )
  `);

  await pool.request().query(`
    IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='friendships' AND xtype='U')
    CREATE TABLE friendships (
      id          INT IDENTITY PRIMARY KEY,
      user_id_1   UNIQUEIDENTIFIER NOT NULL REFERENCES users(id) ON DELETE NO ACTION,
      user_id_2   UNIQUEIDENTIFIER NOT NULL REFERENCES users(id) ON DELETE NO ACTION,
      created_at  DATETIMEOFFSET NOT NULL DEFAULT SYSDATETIMEOFFSET(),
      CONSTRAINT uq_friendship UNIQUE (user_id_1, user_id_2)
    )
  `);

  return NextResponse.json({ ok: true, message: "Tables created (or already exist)" });
}
