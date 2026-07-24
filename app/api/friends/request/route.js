import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getPool, sql } from "@/lib/db";
import { ensureFriendTables } from "@/lib/ensure-friend-tables";

export async function POST(req) {
  try {
    const session = await auth();
    if (!session?.user?.dbId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { toUserId } = await req.json();
    if (!toUserId) return NextResponse.json({ error: "Missing toUserId" }, { status: 400 });

    const fromId = session.user.dbId;
    if (fromId === toUserId) return NextResponse.json({ error: "Cannot add yourself" }, { status: 400 });

    try { await ensureFriendTables(); } catch (e) { console.error("ensureFriendTables:", e?.message); }

    const pool = await getPool();

    // Check not already friends
    const existing = await pool.request()
      .input("a", sql.UniqueIdentifier, fromId)
      .input("b", sql.UniqueIdentifier, toUserId)
      .query(`
        SELECT 1 FROM friendships
        WHERE (user_id_1 = @a AND user_id_2 = @b) OR (user_id_1 = @b AND user_id_2 = @a)
      `);
    if (existing.recordset.length > 0) return NextResponse.json({ status: "already_friends" });

    // Insert request (ignore if duplicate)
    await pool.request()
      .input("from_id", sql.UniqueIdentifier, fromId)
      .input("to_id",   sql.UniqueIdentifier, toUserId)
      .query(`
        IF NOT EXISTS (
          SELECT 1 FROM friend_requests
          WHERE from_user_id = @from_id AND to_user_id = @to_id
        )
        INSERT INTO friend_requests (from_user_id, to_user_id, status)
        VALUES (@from_id, @to_id, 'pending')
      `);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("POST /api/friends/request error:", err?.message, err?.stack);
    return NextResponse.json({ error: err?.message ?? "Failed" }, { status: 500 });
  }
}
