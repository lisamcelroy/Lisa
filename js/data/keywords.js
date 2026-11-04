// Scenario keywords for filtering recipes ("easy to cook", "great for parties"...).
// Built-in recipes are tagged by hand below; a few keywords are also worked out
// from the recipe itself (time, ingredients), so your own recipes and Claude's
// ideas get them too.
import { FOOD_BY_NAME } from "./foods.js";

export const KEYWORDS = [
  { id: "easy", label: "Easy to cook" },
  { id: "quick", label: "Ready in 20 min" },
  { id: "party", label: "Great for parties" },
  { id: "entree", label: "The perfect entree" },
  { id: "comfort", label: "Cozy comfort food" },
  { id: "healthy", label: "Light and healthy" },
  { id: "mealprep", label: "Meal prep friendly" },
  { id: "kids", label: "Kid friendly" },
  { id: "budget", label: "Budget friendly" },
  { id: "brunch", label: "Weekend brunch" },
  { id: "datenight", label: "Date night" },
  { id: "onepan", label: "One pan" },
  { id: "leftovers", label: "Uses up leftovers" },
  { id: "vegetarian", label: "Vegetarian" },
  { id: "vegan", label: "Vegan" },
];

export const KEYWORD_IDS = KEYWORDS.map((k) => k.id);
export const KEYWORD_LABEL = Object.fromEntries(KEYWORDS.map((k) => [k.id, k.label]));

// Hand-picked and deliberately selective: a keyword goes on a recipe only when it
// is a genuinely good pick for that occasion, so each one narrows the list
// (roughly 3 to 9 recipes per keyword, at most 3 per recipe). "Ready in 20 min",
// "Vegetarian" and "Vegan" are worked out from the recipe itself below.
const BUILT_IN = {
  "veggie-omelette": ["brunch"],
  "french-toast": ["brunch", "kids"],
  "overnight-oats": ["easy", "mealprep", "healthy"],
  "banana-pancakes": ["brunch", "kids"],
  "spaghetti-bolognese": ["entree", "comfort", "kids"],
  "garlic-butter-pasta": ["easy", "budget"],
  "creamy-mushroom-pasta": ["entree", "datenight", "comfort"],
  "chicken-stir-fry": ["entree"],
  "fried-rice": ["leftovers", "budget", "onepan"],
  "chicken-curry": ["entree", "party", "mealprep"],
  "chickpea-curry": ["healthy", "mealprep"],
  "black-bean-tacos": ["easy", "party", "budget"],
  "beef-tacos": ["party"],
  quesadillas: ["easy", "kids", "party"],
  "sheet-pan-salmon": ["entree", "onepan", "healthy"],
  "lemon-garlic-shrimp": ["entree", "datenight"],
  "chicken-noodle-soup": ["comfort"],
  "tomato-soup": ["comfort", "budget"],
  minestrone: ["healthy", "budget", "mealprep"],
  "potato-leek-soup": ["comfort", "budget"],
  "greek-salad": ["easy", "healthy", "party"],
  "chicken-caesar-wrap": ["leftovers"],
  "tuna-melt": ["easy"],
  "grilled-cheese": ["easy", "kids", "comfort"],
  shakshuka: ["brunch", "onepan"],
  frittata: ["brunch", "onepan", "leftovers"],
  "pork-chops-apples": ["entree", "datenight"],
  "steak-potatoes": ["entree", "datenight"],
  "sausage-veg-bake": ["onepan", "kids"],
  "tofu-noodle-bowl": [],
  "sweet-potato-bowl": ["healthy", "mealprep"],
  "turkey-chili": ["party", "mealprep", "onepan"],
  "yogurt-parfait": ["easy", "healthy"],
  "stuffed-peppers": ["entree", "party"],
};

// Diet checks look at what is actually in the recipe. Fish that the catalog
// files under "canned" still counts as fish, and broth is left undecided
// because it is often chicken or beef broth.
const MEAT_CATEGORIES = new Set(["meat", "seafood"]);
const MEAT_FOODS = new Set(["tuna"]);
const ANIMAL_FOODS = new Set(["egg", "honey"]);
const UNSURE_FOODS = new Set(["broth"]);

/** The keyword ids for a recipe: its own or hand-picked ones, plus ones worked out from it. */
export function keywordsFor(recipe) {
  // Keywords stored on a recipe (yours or Claude's) are capped at three, like the hand-picked ones.
  const DERIVED = ["quick", "vegetarian", "vegan"];
  const own = (recipe.keywords || []).filter((k) => KEYWORD_IDS.includes(k) && !DERIVED.includes(k)).slice(0, 3);
  const set = new Set([...own, ...(BUILT_IN[recipe.id] || [])]);
  if (recipe.minutes && recipe.minutes <= 20) set.add("quick");

  const required = (recipe.ingredients || []).filter((i) => !i.optional);
  const names = required.map((i) => i.name);
  const cats = names.map((n) => FOOD_BY_NAME.get(n)?.category);
  // Only judge diets when every ingredient is recognised and none is ambiguous.
  const sure = required.length && cats.every(Boolean) && !names.some((n) => UNSURE_FOODS.has(n));
  if (sure && !cats.some((c) => MEAT_CATEGORIES.has(c)) && !names.some((n) => MEAT_FOODS.has(n))) {
    set.add("vegetarian");
    if (!cats.includes("dairy") && !names.some((n) => ANIMAL_FOODS.has(n))) set.add("vegan");
  }
  // When an ingredient isn't recognised, fall back to a vegetarian/vegan label the recipe already carries.
  if (!sure) for (const k of ["vegetarian", "vegan"]) if ((recipe.keywords || []).includes(k)) set.add(k);
  return KEYWORD_IDS.filter((id) => set.has(id));
}
