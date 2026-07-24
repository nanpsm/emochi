import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getPool, sql } from "@/lib/db";

export async function POST(req) {
  try {
    const session = await auth();
    if (!session?.user?.dbId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { toUserId } = body;
    if (!toUserId) return NextResponse.json({ error: "Missing toUserId" }, { status: 400 });

    const fromId = session.user.dbId;
    if (fromId === toUserId) return NextResponse.json({ error: "Cannot add yourself" }, { status: 400 });

    const pool = await getPool();

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
    const msg = err?.message ?? err?.toString() ?? "Unknown error";
    console.error("POST /api/friends/request:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
