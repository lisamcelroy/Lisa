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

const BUILT_IN = {
  "veggie-omelette": ["easy", "quick", "healthy", "brunch"],
  "french-toast": ["easy", "quick", "brunch", "kids", "budget"],
  "overnight-oats": ["easy", "quick", "mealprep", "healthy", "budget"],
  "banana-pancakes": ["easy", "brunch", "kids", "leftovers"],
  "spaghetti-bolognese": ["entree", "comfort", "kids", "mealprep", "party"],
  "garlic-butter-pasta": ["easy", "quick", "budget"],
  "creamy-mushroom-pasta": ["entree", "datenight", "comfort"],
  "chicken-stir-fry": ["entree", "onepan", "healthy", "mealprep"],
  "fried-rice": ["easy", "quick", "leftovers", "budget", "onepan"],
  "chicken-curry": ["entree", "comfort", "mealprep", "party"],
  "chickpea-curry": ["entree", "mealprep", "budget", "healthy", "onepan"],
  "black-bean-tacos": ["easy", "quick", "budget", "party", "kids"],
  "beef-tacos": ["party", "kids", "entree"],
  quesadillas: ["easy", "quick", "kids", "party", "budget"],
  "sheet-pan-salmon": ["entree", "onepan", "healthy", "datenight"],
  "lemon-garlic-shrimp": ["entree", "datenight", "quick"],
  "chicken-noodle-soup": ["comfort", "mealprep", "kids"],
  "tomato-soup": ["comfort", "healthy", "budget", "mealprep"],
  minestrone: ["healthy", "mealprep", "budget", "leftovers"],
  "potato-leek-soup": ["comfort", "budget", "mealprep"],
  "greek-salad": ["easy", "quick", "healthy", "party"],
  "chicken-caesar-wrap": ["easy", "quick", "leftovers", "mealprep"],
  "tuna-melt": ["easy", "quick", "budget", "kids"],
  "grilled-cheese": ["easy", "quick", "kids", "budget", "comfort"],
  shakshuka: ["brunch", "onepan", "datenight", "healthy"],
  frittata: ["leftovers", "brunch", "onepan", "easy", "mealprep"],
  "pork-chops-apples": ["entree", "onepan", "datenight"],
  "steak-potatoes": ["entree", "datenight"],
  "sausage-veg-bake": ["onepan", "easy", "kids", "entree"],
  "tofu-noodle-bowl": ["healthy", "mealprep"],
  "sweet-potato-bowl": ["healthy", "mealprep"],
  "turkey-chili": ["mealprep", "party", "comfort", "healthy", "onepan"],
  "yogurt-parfait": ["easy", "quick", "healthy", "kids"],
  "stuffed-peppers": ["entree", "mealprep", "kids", "party"],
};

const MEAT = new Set(["meat", "seafood"]);
const ANIMAL = new Set(["dairy"]);
const ANIMAL_FOODS = new Set(["egg", "honey"]);

/** The keyword ids for a recipe: its own or hand-picked ones, plus ones worked out from it. */
export function keywordsFor(recipe) {
  const set = new Set([...(recipe.keywords || []), ...(BUILT_IN[recipe.id] || [])]);
  if (recipe.minutes && recipe.minutes <= 20) set.add("quick");

  const required = (recipe.ingredients || []).filter((i) => !i.optional);
  const cats = required.map((i) => FOOD_BY_NAME.get(i.name)?.category);
  const known = cats.every(Boolean); // only judge diets when every ingredient is recognised
  if (known && required.length) {
    if (!cats.some((c) => MEAT.has(c))) {
      set.add("vegetarian");
      if (!cats.some((c) => ANIMAL.has(c)) && !required.some((i) => ANIMAL_FOODS.has(i.name))) set.add("vegan");
    }
  }
  // Hand-picked or Claude-picked "vegetarian"/"vegan" is kept even if an ingredient is unknown.
  return KEYWORD_IDS.filter((id) => set.has(id));
}
