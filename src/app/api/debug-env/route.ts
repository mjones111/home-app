import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export async function GET() {
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

  let supabaseResult = "untested";
  try {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from("recipes").select("id").limit(1);
    supabaseResult = error ? `error: ${error.message}` : "ok";
  } catch (e) {
    supabaseResult = `exception: ${e instanceof Error ? e.message : String(e)}`;
  }

  return NextResponse.json({
    supabase_key_length: supabaseKey.length,
    supabase_key_end: supabaseKey.slice(-6),
    supabase_result: supabaseResult,
  });
}
