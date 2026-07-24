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

    // Find the request addressed to this user
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

    // Coerce to plain string in case mssql returns an object
    const fromId = String(rows.recordset[0].from_user_id);

    // Update request status
    await pool.request()
      .input("id",     sql.Int, requestId)
      .input("status", sql.NVarChar, action === "accept" ? "accepted" : "declined")
      .query(`UPDATE friend_requests SET status = @status WHERE id = @id`);

    if (action === "accept") {
      console.log("Inserting friendship:", fromId, "<->", userId);

      // Use MERGE so it checks both orderings and never duplicates
      await pool.request()
        .input("a", sql.UniqueIdentifier, fromId)
        .input("b", sql.UniqueIdentifier, userId)
        .query(`
          MERGE friendships AS target
          USING (SELECT @a AS a, @b AS b) AS src
          ON (target.user_id_1 = src.a AND target.user_id_2 = src.b)
          OR (target.user_id_1 = src.b AND target.user_id_2 = src.a)
          WHEN NOT MATCHED THEN
            INSERT (user_id_1, user_id_2) VALUES (@a, @b);
        `);

      console.log("Friendship inserted OK");
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    const msg = err?.message ?? err?.toString() ?? "Unknown error";
    console.error("POST /api/friends/respond:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
