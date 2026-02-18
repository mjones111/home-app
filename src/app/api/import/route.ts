import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

async function fetchUrlContent(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; recipe-importer/1.0)",
    },
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch URL: ${res.status} ${res.statusText}`);
  }
  const html = await res.text();
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function isUrl(input: string): boolean {
  try {
    const url = new URL(input.trim());
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

const EXTRACTION_PROMPT = `Extract the recipe and return it as a JSON object. Return ONLY valid JSON with no markdown, no explanation, no code fences.

The JSON must have exactly these fields:
- name: string (recipe name)
- ingredients: array of objects with:
  - item: string (ingredient name)
  - quantity: string (numeric amount, e.g. "1", "1/2", "20") — use "" if none
  - unit: string (e.g. "cup", "pound", "clove") — use "" if none
  - note: string (any parenthetical explanation or tip about this ingredient) — omit if none
- instructions: array of strings — copy each step EXACTLY as written in the source, preserving the author's voice, emphasis, capitalization, and any tips or asides embedded in the steps. Do not summarize, shorten, or rewrite.
- cook_time: string combining cook time and servings if available (e.g. "Under 30 minutes • Serves 4–6") or null
- tags: array of lowercase strings inferred from the recipe (e.g. ["pasta", "vegetarian", "quick"]) — can be empty
- notes: string capturing ALL additional information from the recipe. Format using these section labels exactly where applicable, each on its own line followed by the content:
  "What to cook when you don't feel like cooking:" — any shortcuts or lazy versions
  "Love your leftovers:" — leftover storage and repurposing tips
  "Must have meat:" — meat add-on suggestions
  "Cooking for kids:" — kid-friendly adaptations
  "Gluten-free:" — gluten-free swaps
  "Dairy-free:" — dairy-free swaps
  "Substitutions:" — ingredient substitution notes. Put each ingredient on its own line in the format "Ingredient: description". Do not join them with pipes or put multiple on one line.
  Only include sections that are present in the source. Use null if there is nothing extra.`;

async function callClaude(content: Anthropic.MessageParam["content"]): Promise<string> {
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 8096,
    messages: [{ role: "user", content }],
  });
  return message.content[0].type === "text" ? message.content[0].text : "";
}

function parseRecipeJson(raw: string) {
  const cleaned = raw.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
  return JSON.parse(cleaned);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { input, pdf } = body;

    if (!input && !pdf) {
      return NextResponse.json({ error: "No input provided" }, { status: 400 });
    }

    let raw: string;
    let sourceUrl: string | null = null;

    if (pdf) {
      // PDF path: send as a document block
      raw = await callClaude([
        {
          type: "document",
          source: { type: "base64", media_type: "application/pdf", data: pdf },
        } as Anthropic.DocumentBlockParam,
        { type: "text", text: EXTRACTION_PROMPT },
      ]);
    } else {
      // Text / URL path
      let recipeText = (input as string).trim();
      if (isUrl(recipeText)) {
        sourceUrl = recipeText;
        recipeText = await fetchUrlContent(recipeText);
      }
      raw = await callClaude([
        { type: "text", text: `${EXTRACTION_PROMPT}\n\nRecipe text:\n${recipeText.slice(0, 12000)}` },
      ]);
    }

    let recipe;
    try {
      recipe = parseRecipeJson(raw);
    } catch {
      return NextResponse.json(
        { error: "Could not extract a recipe from that input. Try pasting the recipe text directly instead of a URL." },
        { status: 422 }
      );
    }

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("recipes")
      .insert({
        name: recipe.name,
        ingredients: recipe.ingredients,
        instructions: recipe.instructions,
        cook_time: recipe.cook_time ?? null,
        tags: recipe.tags ?? [],
        notes: recipe.notes ?? null,
        source_url: sourceUrl,
      })
      .select("id")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ id: data.id });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
