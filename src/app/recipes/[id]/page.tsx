import Link from "next/link";
import { notFound } from "next/navigation";
import { getSupabase } from "@/lib/supabase";
import { Recipe, Ingredient } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function RecipePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let recipe: Recipe | null = null;

  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("recipes")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) {
      notFound();
    }
    recipe = data as Recipe;
  } catch {
    notFound();
  }

  return (
    <div className="max-w-2xl">
      <Link
        href="/"
        className="text-sm text-zinc-500 hover:text-zinc-700 mb-4 inline-block"
      >
        &larr; Back to recipes
      </Link>

      <h1 className="text-3xl font-semibold mb-2">{recipe.name}</h1>

      {recipe.cook_time && (
        <p className="text-zinc-500 mb-4">{recipe.cook_time}</p>
      )}

      {recipe.tags && recipe.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-6">
          {recipe.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs text-zinc-600"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      <section className="mb-8">
        <h2 className="text-xl font-medium mb-3">Ingredients</h2>
        <ul className="space-y-3">
          {recipe.ingredients.map((ing: Ingredient, i: number) => (
            <li key={i}>
              <span className="text-zinc-700">
                {[ing.quantity, ing.unit, ing.item].filter(Boolean).join(" ")}
              </span>
              {ing.note && (
                <p className="text-sm text-zinc-400 mt-0.5">{ing.note}</p>
              )}
            </li>
          ))}
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-medium mb-3">Instructions</h2>
        <ol className="space-y-4">
          {recipe.instructions.map((step: string, i: number) => (
            <li key={i} className="flex gap-3">
              <span className="text-zinc-400 font-medium text-sm mt-0.5 shrink-0 w-5 text-right">
                {i + 1}.
              </span>
              <span className="text-zinc-700 leading-relaxed">{step}</span>
            </li>
          ))}
        </ol>
      </section>

      {recipe.notes && (
        <section className="mb-8">
          <h2 className="text-xl font-medium mb-4">Notes</h2>
          <div className="space-y-1">
            {(() => {
              const lines = recipe.notes!.split("\n");
              let inSubstitutions = false;
              const elements: React.ReactNode[] = [];
              const subs: string[] = [];

              function flushSubs() {
                if (subs.length > 0) {
                  elements.push(
                    <ul key={`subs-${elements.length}`} className="space-y-2 mt-1">
                      {subs.map((sub, j) => {
                        const colonIdx = sub.indexOf(":");
                        const ingredient = colonIdx > -1 ? sub.slice(0, colonIdx) : sub;
                        const description = colonIdx > -1 ? sub.slice(colonIdx + 1).trim() : "";
                        return (
                          <li key={j} className="flex gap-2 text-sm text-zinc-600">
                            <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-zinc-400 shrink-0" />
                            <span>
                              <span className="font-medium text-zinc-700">{ingredient}:</span>
                              {description && ` ${description}`}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  );
                  subs.length = 0;
                }
              }

              lines.forEach((line, i) => {
                const trimmed = line.trim();
                if (trimmed === "") {
                  if (inSubstitutions) flushSubs();
                  elements.push(<div key={i} className="h-2" />);
                  return;
                }

                // Check if this line is or starts with "Substitutions:"
                const subMatch = trimmed.match(/^substitutions:\s*/i);
                if (subMatch) {
                  flushSubs();
                  inSubstitutions = true;
                  elements.push(
                    <p key={i} className="font-medium text-zinc-800 text-sm pt-3">
                      Substitutions:
                    </p>
                  );
                  // Handle inline substitutions on the same line (pipe-separated or single)
                  const inline = trimmed.slice(subMatch[0].length).trim();
                  if (inline) {
                    const parts = inline.split(/\s*\|\s*/);
                    parts.forEach((p) => { if (p.trim()) subs.push(p.trim()); });
                  }
                  return;
                }

                if (trimmed.endsWith(":")) {
                  flushSubs();
                  inSubstitutions = false;
                  elements.push(
                    <p key={i} className="font-medium text-zinc-800 text-sm pt-3">
                      {line}
                    </p>
                  );
                  return;
                }

                if (inSubstitutions) {
                  // Each line may be pipe-separated or a single item
                  const parts = trimmed.split(/\s*\|\s*/);
                  parts.forEach((p) => { if (p.trim()) subs.push(p.trim()); });
                } else {
                  elements.push(
                    <p key={i} className="text-zinc-600 text-sm leading-relaxed">
                      {line}
                    </p>
                  );
                }
              });

              flushSubs();
              return elements;
            })()}
          </div>
        </section>
      )}

      {recipe.source_url && (
        <p className="text-sm text-zinc-400">
          Source:{" "}
          <a
            href={recipe.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-zinc-600"
          >
            {recipe.source_url}
          </a>
        </p>
      )}
    </div>
  );
}
