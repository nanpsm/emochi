import { NextResponse } from "next/server";
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
