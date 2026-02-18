import { NextResponse } from "next/server";

export async function GET() {
  const key = process.env.ANTHROPIC_API_KEY ?? "";

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 10,
      messages: [{ role: "user", content: "hi" }],
    }),
  });

  const body = await res.text();

  return NextResponse.json({
    key_length: key.length,
    key_start: key.slice(0, 20),
    key_end: key.slice(-6),
    anthropic_status: res.status,
    anthropic_response: body.slice(0, 200),
  });
}
