export interface Ingredient {
  item: string;
  quantity: string;
  unit: string;
}

export interface Recipe {
  id: string;
  name: string;
  ingredients: Ingredient[];
  instructions: string[];
  cook_time: string;
  tags: string[];
  source_url: string | null;
  notes: string | null;
  created_at: string;
}
