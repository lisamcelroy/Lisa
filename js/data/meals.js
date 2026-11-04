// Which meals a recipe suits: nobody wants turkey chili for breakfast.
// Built-in recipes are assigned by hand; Claude's ideas say their own; anything
// else is worked out from its tags.

export const MEAL_TYPES = [
  { id: "breakfast", label: "Breakfast" },
  { id: "lunch", label: "Lunch" },
  { id: "dinner", label: "Dinner" },
  { id: "snack", label: "Snack" },
];
export const MEAL_TYPE_IDS = MEAL_TYPES.map((m) => m.id);
export const MEAL_TYPE_LABEL = Object.fromEntries(MEAL_TYPES.map((m) => [m.id, m.label]));

const BUILT_IN = {
  "veggie-omelette": ["breakfast", "lunch"],
  "french-toast": ["breakfast"],
  "overnight-oats": ["breakfast"],
  "banana-pancakes": ["breakfast"],
  "spaghetti-bolognese": ["dinner"],
  "garlic-butter-pasta": ["lunch", "dinner"],
  "creamy-mushroom-pasta": ["dinner"],
  "chicken-stir-fry": ["dinner"],
  "fried-rice": ["lunch", "dinner"],
  "chicken-curry": ["dinner"],
  "chickpea-curry": ["dinner"],
  "black-bean-tacos": ["lunch", "dinner"],
  "beef-tacos": ["dinner"],
  "quesadillas": ["lunch", "snack"],
  "sheet-pan-salmon": ["dinner"],
  "lemon-garlic-shrimp": ["dinner"],
  "chicken-noodle-soup": ["lunch", "dinner"],
  "tomato-soup": ["lunch"],
  "minestrone": ["lunch", "dinner"],
  "potato-leek-soup": ["lunch", "dinner"],
  "greek-salad": ["lunch"],
  "chicken-caesar-wrap": ["lunch"],
  "tuna-melt": ["lunch"],
  "grilled-cheese": ["lunch"],
  "shakshuka": ["breakfast", "lunch"],
  "frittata": ["breakfast", "lunch"],
  "pork-chops-apples": ["dinner"],
  "steak-potatoes": ["dinner"],
  "sausage-veg-bake": ["dinner"],
  "tofu-noodle-bowl": ["lunch", "dinner"],
  "sweet-potato-bowl": ["lunch", "dinner"],
  "turkey-chili": ["dinner"],
  "yogurt-parfait": ["breakfast", "snack"],
  "stuffed-peppers": ["dinner"],
};

const FROM_TAG = { breakfast: ["breakfast"], brunch: ["breakfast", "lunch"], lunch: ["lunch"], dinner: ["dinner"], soup: ["lunch", "dinner"], salad: ["lunch"], snack: ["snack"] };

/** The meals a recipe is suggested for, in breakfast, lunch, dinner, snack order. */
export function mealsFor(recipe) {
  let out = [];
  if (Array.isArray(recipe.meals) && recipe.meals.length) out = recipe.meals;
  else if (BUILT_IN[recipe.id]) out = BUILT_IN[recipe.id];
  else out = (recipe.tags || []).flatMap((t) => FROM_TAG[t] || []);
  out = MEAL_TYPE_IDS.filter((m) => out.includes(m));
  return out.length ? out : ["lunch", "dinner"];
}

/** The meal for this time of day: breakfast until 11, lunch until 4pm, then dinner. */
export function mealNow(date = new Date()) {
  const h = date.getHours();
  return h < 11 ? "breakfast" : h < 16 ? "lunch" : "dinner";
}
