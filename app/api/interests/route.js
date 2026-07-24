import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getPool, sql } from "@/lib/db";

export async function GET() {
  try {
    const pool = await getPool();
    const result = await pool.request().query("SELECT id, name FROM interests ORDER BY name ASC");
    return NextResponse.json(result.recordset);
  } catch (error) {
    console.error("Failed to fetch interests:", error);
    return NextResponse.json({ error: error?.message ?? String(error), code: error?.code, hasDbUrl: !!process.env.DATABASE_URL }, { status: 500 });
  }
}

export async function POST(req) {
  const session = await auth();
  if (!session?.user?.dbId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { interests } = await req.json();
  if (!Array.isArray(interests)) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const pool = await getPool();
  const userId = session.user.dbId;

  // Allow clearing all interests
  if (interests.length === 0) {
    await pool.request()
      .input("user_id", sql.UniqueIdentifier, userId)
      .query("DELETE FROM user_interests WHERE user_id = @user_id");
    return NextResponse.json({ ok: true });
  }

  // Look up interest ids by name
  const nameList = interests.map(n => `N'${n.replace(/'/g, "''")}'`).join(",");
  const rows = await pool.request()
    .query(`SELECT id, name FROM interests WHERE name IN (${nameList})`);

  const ids = rows.recordset.map(r => r.id);
  if (ids.length === 0) return NextResponse.json({ ok: true });

  // Replace existing selections: delete then insert
  await pool.request()
    .input("user_id", sql.UniqueIdentifier, userId)
    .query("DELETE FROM user_interests WHERE user_id = @user_id");

  for (const interestId of ids) {
    await pool.request()
      .input("user_id",     sql.UniqueIdentifier, userId)
      .input("interest_id", sql.Int,              interestId)
      .query("INSERT INTO user_interests (user_id, interest_id) VALUES (@user_id, @interest_id)");
  }

  return NextResponse.json({ ok: true });
}
