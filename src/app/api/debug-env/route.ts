import { NextResponse } from "next/server";

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "NOT SET";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "NOT SET";

  // Test Supabase with a direct fetch, bypassing the SDK
  const res = await fetch(`${url}/rest/v1/recipes?select=id&limit=1`, {
    headers: {
      "apikey": key,
      "Authorization": `Bearer ${key}`,
    },
  });

  const body = await res.text();

  return NextResponse.json({
    supabase_url: url,
    key_length: key.length,
    key_end: key.slice(-6),
    supabase_status: res.status,
    supabase_response: body.slice(0, 200),
  });
}
