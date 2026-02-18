import { NextResponse } from "next/server";

export async function GET() {
  const key = process.env.ANTHROPIC_API_KEY ?? "NOT SET";
  return NextResponse.json({
    key_length: key.length,
    key_start: key.slice(0, 20),
    key_end: key.slice(-6),
  });
}
