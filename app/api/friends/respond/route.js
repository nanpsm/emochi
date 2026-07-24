import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getPool, sql } from "@/lib/db";
import { ensureFriendTables } from "@/lib/ensure-friend-tables";

export async function POST(req) {
  const session = await auth();
  if (!session?.user?.dbId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { requestId, action } = await req.json();
  if (!requestId || !["accept", "decline"].includes(action)) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  await ensureFriendTables();
  const userId = session.user.dbId;
  const pool = await getPool();

  const req_row = await pool.request()
    .input("id",  sql.Int, requestId)
    .input("uid", sql.UniqueIdentifier, userId)
    .query(`SELECT from_user_id FROM friend_requests WHERE id = @id AND to_user_id = @uid AND status = 'pending'`);

  if (req_row.recordset.length === 0) {
    return NextResponse.json({ error: "Request not found" }, { status: 404 });
  }

  const fromId = req_row.recordset[0].from_user_id;

  await pool.request()
    .input("id",     sql.Int, requestId)
    .input("status", sql.NVarChar, action === "accept" ? "accepted" : "declined")
    .query(`UPDATE friend_requests SET status = @status WHERE id = @id`);

  if (action === "accept") {
    const [id1, id2] = [fromId, userId].sort();
    await pool.request()
      .input("id1", sql.UniqueIdentifier, id1)
      .input("id2", sql.UniqueIdentifier, id2)
      .query(`
        IF NOT EXISTS (SELECT 1 FROM friendships WHERE user_id_1 = @id1 AND user_id_2 = @id2)
          INSERT INTO friendships (user_id_1, user_id_2) VALUES (@id1, @id2)
      `);
  }

  return NextResponse.json({ ok: true });
}
