import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getPool, sql } from "@/lib/db";

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
