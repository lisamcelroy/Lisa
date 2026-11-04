// Rough calorie estimates from a recipe's ingredients.
//
// For each catalog food: kcal per 100 g, plus what one "unit" weighs so
// recipe amounts like "2 count", "1 cup", "1 can" or "3 slice" can be turned
// into grams. Values are typical figures for home cooking (dry pasta and rice,
// drained canned beans, raw meat) and are meant as estimates, not labels.
import { normalizeUnit } from "./units.js";

// kcal: per 100 g | each: g per piece | density: g per ml | can/pkg/slice/bunch: g each
const N = {
  apple: { kcal: 52, each: 180 }, avocado: { kcal: 160, each: 150 }, banana: { kcal: 89, each: 118 },
  basil: { kcal: 23, each: 5, bunch: 30, density: 0.1 }, "bell pepper": { kcal: 26, each: 120 },
  berries: { kcal: 50, each: 150, density: 0.6 }, broccoli: { kcal: 34, each: 300, density: 0.4 },
  cabbage: { kcal: 25, each: 900, density: 0.4 }, carrot: { kcal: 41, each: 60, density: 0.55 },
  celery: { kcal: 16, each: 40, density: 0.5 }, cilantro: { kcal: 23, each: 30, bunch: 30, density: 0.1 },
  cucumber: { kcal: 15, each: 300, density: 0.55 }, garlic: { kcal: 149, each: 5 }, ginger: { kcal: 80, each: 15 },
  "green onion": { kcal: 32, each: 15 }, kale: { kcal: 49, each: 100, density: 0.28 }, lemon: { kcal: 29, each: 60 },
  lettuce: { kcal: 15, each: 300, density: 0.2 }, lime: { kcal: 30, each: 50 }, mushroom: { kcal: 22, each: 18, density: 0.3 },
  onion: { kcal: 40, each: 110, density: 0.6 }, potato: { kcal: 77, each: 200 }, spinach: { kcal: 23, each: 30, pkg: 140, density: 0.13 },
  "sweet potato": { kcal: 86, each: 200 }, tomato: { kcal: 18, each: 120, density: 0.75 }, zucchini: { kcal: 17, each: 200 },

  butter: { kcal: 717, each: 14, density: 0.95 }, cheese: { kcal: 400, each: 30, slice: 20, density: 0.45 },
  cheddar: { kcal: 403, each: 30, slice: 20, density: 0.45 }, feta: { kcal: 264, each: 30, density: 0.6 },
  mozzarella: { kcal: 280, each: 30, density: 0.45 }, parmesan: { kcal: 431, each: 20, density: 0.4 },
  cream: { kcal: 340, density: 1 }, "cream cheese": { kcal: 342, density: 0.95, pkg: 225 }, egg: { kcal: 143, each: 50 },
  milk: { kcal: 50, density: 1.03 }, "sour cream": { kcal: 198, density: 1 }, yogurt: { kcal: 75, each: 170, density: 1.03 },

  bacon: { kcal: 400, slice: 20, each: 20 }, "chicken breast": { kcal: 165, each: 200 }, "chicken thigh": { kcal: 209, each: 120 }, "chicken wing": { kcal: 203, each: 35 }, "chicken drumstick": { kcal: 172, each: 75 },
  chicken: { kcal: 190, each: 150 }, "ground beef": { kcal: 250, pkg: 450 }, "ground turkey": { kcal: 170, pkg: 450 },
  ham: { kcal: 145, slice: 15, each: 15 }, "pork chop": { kcal: 231, each: 180 }, salmon: { kcal: 208, each: 170 },
  sausage: { kcal: 300, each: 75 }, shrimp: { kcal: 99, each: 15, pkg: 400 }, steak: { kcal: 250, each: 250 },
  tofu: { kcal: 145, pkg: 400, each: 100 },

  bread: { kcal: 265, slice: 30, each: 30 }, tortilla: { kcal: 300, each: 45 },
  "frozen peas": { kcal: 81, density: 0.6, pkg: 500 }, "frozen corn": { kcal: 86, density: 0.6, pkg: 500 },
  "frozen mixed vegetables": { kcal: 65, density: 0.55, pkg: 500 },

  "black beans": { kcal: 130, can: 260, density: 0.75 }, chickpeas: { kcal: 139, can: 260, density: 0.7 },
  "coconut milk": { kcal: 200, can: 400, density: 1 }, "canned tomatoes": { kcal: 20, can: 400, density: 1 },
  "tomato paste": { kcal: 82, density: 1.1, can: 156 }, broth: { kcal: 5, density: 1 }, tuna: { kcal: 116, can: 140 },
  pasta: { kcal: 371, density: 0.45, pkg: 450 }, spaghetti: { kcal: 371, density: 0.45, pkg: 450 },
  rice: { kcal: 360, density: 0.8 }, noodles: { kcal: 360, density: 0.4, pkg: 400 }, oats: { kcal: 389, density: 0.38 },
  quinoa: { kcal: 368, density: 0.72 }, flour: { kcal: 364, density: 0.53 }, sugar: { kcal: 387, density: 0.85 },
  "baking powder": { kcal: 53, density: 0.9 }, honey: { kcal: 304, density: 1.42 }, "maple syrup": { kcal: 260, density: 1.32 },
  "peanut butter": { kcal: 588, density: 1.1 }, "soy sauce": { kcal: 53, density: 1.1 }, salsa: { kcal: 36, density: 1 },
  mayonnaise: { kcal: 680, density: 0.92 }, mustard: { kcal: 66, density: 1.05 }, "curry paste": { kcal: 150, density: 1 },
  vinegar: { kcal: 18, density: 1, each: 15 },

  salt: { kcal: 0, each: 2 }, "black pepper": { kcal: 0, each: 1 }, water: { kcal: 0, density: 1 },
  // A recipe that just says "oil" uses about a tablespoon; "spices" a couple of grams.
  oil: { kcal: 884, each: 14, density: 0.92 }, spices: { kcal: 300, each: 2 },
  "cumin": { kcal: 300, each: 2, density: 0.5 }, "paprika": { kcal: 300, each: 2, density: 0.5 }, "chili powder": { kcal: 300, each: 2, density: 0.5 }, "cayenne": { kcal: 300, each: 2, density: 0.5 }, "chili flakes": { kcal: 300, each: 2, density: 0.5 }, "oregano": { kcal: 300, each: 2, density: 0.5 }, "thyme": { kcal: 300, each: 2, density: 0.5 }, "rosemary": { kcal: 300, each: 2, density: 0.5 }, "dried basil": { kcal: 300, each: 2, density: 0.5 }, "italian seasoning": { kcal: 300, each: 2, density: 0.5 }, "bay leaves": { kcal: 300, each: 2, density: 0.5 }, "cinnamon": { kcal: 300, each: 2, density: 0.5 }, "nutmeg": { kcal: 300, each: 2, density: 0.5 }, "turmeric": { kcal: 300, each: 2, density: 0.5 }, "curry powder": { kcal: 300, each: 2, density: 0.5 }, "garlic powder": { kcal: 300, each: 2, density: 0.5 }, "onion powder": { kcal: 300, each: 2, density: 0.5 }, "ground ginger": { kcal: 300, each: 2, density: 0.5 },
  vanilla: { kcal: 288, each: 5, density: 0.9 },
  broccolini: { kcal: 35, each: 20, bunch: 200, density: 0.4 },
  soda: { kcal: 40, density: 1.04, can: 355, each: 355 },
  "spice rub": { kcal: 300, each: 2, density: 0.5 },
  "asparagus": { kcal: 20, each: 16, bunch: 450, density: 0.5 },
  "green beans": { kcal: 31, each: 5, density: 0.45 },
  "snap peas": { kcal: 42, each: 4, density: 0.4 },
  "corn on the cob": { kcal: 86, each: 150 },
  "cauliflower": { kcal: 25, each: 600, density: 0.45 },
  "brussels sprouts": { kcal: 43, each: 20, density: 0.4 },
  "eggplant": { kcal: 25, each: 450 },
  "butternut squash": { kcal: 45, each: 1000, density: 0.6 },
  "pumpkin": { kcal: 26, each: 2000, density: 0.5 },
  "beet": { kcal: 43, each: 120 },
  "radish": { kcal: 16, each: 10, bunch: 200 },
  "leek": { kcal: 61, each: 90 },
  "shallot": { kcal: 72, each: 30 },
  "jalapeno": { kcal: 29, each: 15 },
  "arugula": { kcal: 25, pkg: 140, density: 0.1 },
  "bok choy": { kcal: 13, each: 100 },
  "artichoke": { kcal: 47, each: 120 },
  "parsnip": { kcal: 75, each: 100 },
  "fennel": { kcal: 31, each: 230 },
  "bean sprouts": { kcal: 30, density: 0.4 },
  "parsley": { kcal: 36, each: 5, bunch: 60, density: 0.1 },
  "dill": { kcal: 43, each: 3, bunch: 30, density: 0.1 },
  "mint": { kcal: 70, each: 2, bunch: 30, density: 0.1 },
  "orange": { kcal: 47, each: 130 },
  "grapes": { kcal: 69, each: 5, density: 0.6 },
  "mango": { kcal: 60, each: 300 },
  "pineapple": { kcal: 50, each: 900, density: 0.65 },
  "peach": { kcal: 39, each: 150 },
  "pear": { kcal: 57, each: 180 },
  "plum": { kcal: 46, each: 65 },
  "cherries": { kcal: 63, each: 8, density: 0.6 },
  "watermelon": { kcal: 30, each: 4000, density: 0.6 },
  "melon": { kcal: 34, each: 1200, density: 0.6 },
  "kiwi": { kcal: 61, each: 75 },
  "grapefruit": { kcal: 42, each: 250 },
  "pomegranate": { kcal: 83, each: 280 },
  "pork": { kcal: 200, each: 200, pkg: 500 },
  "ground pork": { kcal: 260, pkg: 450 },
  "lamb": { kcal: 250, each: 150 },
  "turkey": { kcal: 135, each: 150, slice: 15 },
  "hot dogs": { kcal: 290, each: 45, pkg: 450 },
  "pepperoni": { kcal: 500, slice: 3, each: 3, pkg: 150 },
  "white fish": { kcal: 90, each: 150 },
  "scallops": { kcal: 110, each: 25 },
  "mussels": { kcal: 86, each: 15, pkg: 900 },
  "crab": { kcal: 97, each: 150, can: 170 },
  "cottage cheese": { kcal: 98, density: 1 },
  "ricotta": { kcal: 174, density: 1 },
  "goat cheese": { kcal: 364, each: 30 },
  "swiss cheese": { kcal: 380, slice: 20, each: 30 },
  "provolone": { kcal: 350, slice: 20, each: 30 },
  "brie": { kcal: 334, each: 30 },
  "plant milk": { kcal: 40, density: 1.03 },
  "buttermilk": { kcal: 40, density: 1.03 },
  "bagel": { kcal: 250, each: 100 },
  "buns": { kcal: 280, each: 50 },
  "pita": { kcal: 275, each: 60 },
  "naan": { kcal: 290, each: 90 },
  "english muffin": { kcal: 230, each: 60 },
  "croissant": { kcal: 406, each: 60 },
  "couscous": { kcal: 376, density: 0.7 },
  "breadcrumbs": { kcal: 395, density: 0.45 },
  "cereal": { kcal: 380, density: 0.15 },
  "kidney beans": { kcal: 127, can: 260, density: 0.75 },
  "lentils": { kcal: 116, can: 260, density: 0.8 },
  "refried beans": { kcal: 90, can: 450, density: 1 },
  "pasta sauce": { kcal: 50, density: 1, pkg: 680 },
  "ketchup": { kcal: 112, density: 1.15 },
  "hot sauce": { kcal: 12, density: 1 },
  "bbq sauce": { kcal: 170, density: 1.2 },
  "jam": { kcal: 250, density: 1.3 },
  "hummus": { kcal: 166, density: 1, pkg: 280 },
  "pesto": { kcal: 450, density: 1, pkg: 190 },
  "salad dressing": { kcal: 400, density: 1 },
  "worcestershire sauce": { kcal: 78, density: 1.1 },
  "fish sauce": { kcal: 35, density: 1.2 },
  "teriyaki sauce": { kcal: 90, density: 1.1 },
  "frozen berries": { kcal: 50, density: 0.6, pkg: 600 },
  "ice cream": { kcal: 207, density: 0.55 },
  "frozen pizza": { kcal: 266, each: 450 },
  "french fries": { kcal: 150, pkg: 900, density: 0.4 },
  "baking soda": { kcal: 0, density: 1 },
  "chocolate chips": { kcal: 480, density: 0.7 },
  "cocoa powder": { kcal: 228, density: 0.4 },
  "yeast": { kcal: 325, density: 0.6, pkg: 7 },
  "cornstarch": { kcal: 381, density: 0.6 },
  "orange juice": { kcal: 45, density: 1.04 },
  "coffee": { kcal: 2, density: 0.4 },
  "tea": { kcal: 1, each: 2 },
  "chips": { kcal: 536, pkg: 200, density: 0.1 },
  "tortilla chips": { kcal: 489, pkg: 300, density: 0.1 },
  "crackers": { kcal: 480, each: 4, pkg: 200 },
  "nuts": { kcal: 600, density: 0.55 },
  "peanuts": { kcal: 567, density: 0.6 },
  "popcorn": { kcal: 380, density: 0.05 },
  "chocolate": { kcal: 546, each: 100 },
};

const UNKNOWN = { kcal: 150, each: 100 }; // fallback for foods not in the table

const MASS = { g: 1, kg: 1000, lb: 453.6, oz: 28.35 };
const VOLUME_ML = { ml: 1, l: 1000, cup: 240, tbsp: 15, tsp: 5 };

/** Grams for an amount of a food, or null if the unit can't be converted. */
export function gramsOf(name, qty, unit) {
  const f = N[name] || UNKNOWN;
  const u = normalizeUnit(unit);
  const q = Number(qty) || 0;
  if (MASS[u]) return q * MASS[u];
  if (VOLUME_ML[u]) return q * VOLUME_ML[u] * (f.density ?? 1);
  if (u === "count") return q * (f.each ?? 100);
  if (u === "dozen") return q * 12 * (f.each ?? 50);
  if (u === "can") return q * (f.can ?? 400);
  if (u === "pkg") return q * (f.pkg ?? 300);
  if (u === "slice") return q * (f.slice ?? f.each ?? 25);
  if (u === "bunch") return q * (f.bunch ?? 100);
  if (u === "head") return q * (f.each ?? 500);
  return null;
}

/**
 * Estimated calories for a recipe.
 * Optional ingredients are left out, so the figure is for the recipe as written
 * without extras. Returns per-serving and total kcal, rounded to the nearest 10.
 */
export function estimateCalories(recipe) {
  let total = 0;
  const guessed = [];
  for (const ing of recipe.ingredients || []) {
    if (ing.optional) continue;
    if (!N[ing.name]) guessed.push(ing.name);
    const grams = gramsOf(ing.name, ing.qty, ing.unit);
    if (grams === null) {
      guessed.push(ing.name);
      continue;
    }
    total += (grams * (N[ing.name] || UNKNOWN).kcal) / 100;
  }
  const servings = Math.max(1, Number(recipe.servings) || 1);
  const round10 = (n) => Math.round(n / 10) * 10;
  return { perServing: round10(total / servings), total: round10(total), guessed };
}

export const KNOWN_NUTRITION = Object.keys(N);
