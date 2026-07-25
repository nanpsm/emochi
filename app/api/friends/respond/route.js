import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getPool, sql } from "@/lib/db";

export async function POST(req) {
  try {
    const session = await auth();
    if (!session?.user?.dbId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { requestId, action } = await req.json();
    if (!requestId || !["accept", "decline"].includes(action)) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const userId = session.user.dbId;
    const pool = await getPool();

    const rows = await pool.request()
      .input("id",  sql.Int, requestId)
      .input("uid", sql.UniqueIdentifier, userId)
      .query(`
        SELECT from_user_id FROM friend_requests
        WHERE id = @id AND to_user_id = @uid AND status = 'pending'
      `);

    if (rows.recordset.length === 0) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    const fromId = String(rows.recordset[0].from_user_id);

    await pool.request()
      .input("id",     sql.Int, requestId)
      .input("status", sql.NVarChar, action === "accept" ? "accepted" : "declined")
      .query(`UPDATE friend_requests SET status = @status WHERE id = @id`);

    if (action === "accept") {
      try {
        await pool.request()
          .input("a", sql.UniqueIdentifier, fromId)
          .input("b", sql.UniqueIdentifier, userId)
          .query(`
            INSERT INTO friendships (user_id, friend_id, status)
            VALUES (@a, @b, 'accepted')
          `);
        return NextResponse.json({ ok: true });
      } catch (insertErr) {
        const msg = insertErr?.message ?? String(insertErr);
        console.error("Friendship INSERT failed:", msg, "fromId:", fromId, "userId:", userId);
        return NextResponse.json({ ok: true, insertError: msg });
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    const msg = err?.message ?? err?.toString() ?? "Unknown error";
    console.error("POST /api/friends/respond:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
