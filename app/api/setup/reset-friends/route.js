import { NextResponse } from "next/server";
import { getPool } from "@/lib/db";

export async function GET() {
  const pool = await getPool();
  await pool.request().query(`DELETE FROM friendships`);
  await pool.request().query(`DELETE FROM friend_requests`);
  return NextResponse.json({ ok: true, message: "Cleared friend_requests and friendships" });
}
