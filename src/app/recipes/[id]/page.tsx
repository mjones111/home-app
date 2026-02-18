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
        <ul className="space-y-1.5">
          {recipe.ingredients.map((ing: Ingredient, i: number) => (
            <li key={i} className="text-zinc-700">
              {ing.quantity} {ing.unit} {ing.item}
            </li>
          ))}
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-medium mb-3">Instructions</h2>
        <ol className="list-decimal list-inside space-y-2">
          {recipe.instructions.map((step: string, i: number) => (
            <li key={i} className="text-zinc-700 leading-relaxed">
              {step}
            </li>
          ))}
        </ol>
      </section>

      {recipe.notes && (
        <section className="mb-8">
          <h2 className="text-xl font-medium mb-3">Notes</h2>
          <p className="text-zinc-600">{recipe.notes}</p>
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
