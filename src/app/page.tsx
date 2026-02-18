import Link from "next/link";
import { getSupabase } from "@/lib/supabase";
import { Recipe } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  let recipes: Pick<Recipe, "id" | "name" | "tags" | "cook_time">[] | null = null;
  let errorMessage: string | null = null;

  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("recipes")
      .select("id, name, tags, cook_time")
      .order("created_at", { ascending: false });

    if (error) {
      errorMessage = error.message;
    } else {
      recipes = data as Pick<Recipe, "id" | "name" | "tags" | "cook_time">[];
    }
  } catch (e) {
    errorMessage = e instanceof Error ? e.message : "Failed to connect to Supabase";
  }

  if (errorMessage) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">Failed to load recipes. Make sure Supabase is configured.</p>
        <p className="text-sm text-zinc-500 mt-2">{errorMessage}</p>
      </div>
    );
  }

  if (!recipes || recipes.length === 0) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-semibold mb-2">No recipes yet</h1>
        <p className="text-zinc-500">
          Add your first recipe through Supabase or the Claude import flow.
        </p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">Recipes</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {recipes.map((recipe) => (
          <Link
            key={recipe.id}
            href={`/recipes/${recipe.id}`}
            className="block rounded-lg border border-zinc-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
          >
            <h2 className="text-lg font-medium mb-2">{recipe.name}</h2>
            {recipe.cook_time && (
              <p className="text-sm text-zinc-500 mb-3">{recipe.cook_time}</p>
            )}
            {recipe.tags && recipe.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {recipe.tags.map((tag: string) => (
                  <span
                    key={tag}
                    className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs text-zinc-600"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
