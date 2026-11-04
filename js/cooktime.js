// "How much time do you have to cook today?" Time limits and prep styles for the
// Recipes tab. Pure functions so they can be tested without a browser.

export const TIME_OPTIONS = [
  { id: "15", label: "15 min", max: 15 },
  { id: "30", label: "30 min", max: 30 },
  { id: "45", label: "45 min", max: 45 },
  { id: "60", label: "1 hour", max: 60 },
  { id: "any", label: "No rush", max: Infinity },
];

export const PREP_OPTIONS = [
  { id: "quickprep", label: "Quick prep", hint: "Few ingredients, little chopping" },
  { id: "handsoff", label: "Hands-off", hint: "Mostly simmering, baking or chilling" },
];

// Things you don't prep: they don't count towards chopping and measuring.
const NO_PREP = new Set(["salt", "black pepper", "oil", "olive oil", "water", "spices", "butter", "sugar", "honey", "maple syrup"]);
const WAITING = /\b(bake|baked|roast|roasted|simmer|simmering|slow cook|overnight|refrigerate|chill|marinate|oven|braise)\b/i;

/** Ingredients you actually have to handle (required, not pantry basics). */
export function prepCount(recipe) {
  return (recipe.ingredients || []).filter((i) => !i.optional && !NO_PREP.has(i.name)).length;
}

/** Little hands-on work: at most 3 ingredients to handle and at most 3 steps. */
export function isQuickPrep(recipe) {
  return prepCount(recipe) <= 3 && (recipe.steps || []).length <= 3;
}

/** Most of the time is waiting (oven, pot, fridge), not standing at the board. */
export function isHandsOff(recipe) {
  return (recipe.steps || []).some((s) => WAITING.test(s));
}

/**
 * Does a recipe fit the time chosen for today?
 * Hands-off recipes are still limited by total time: a 2 hour braise doesn't fit 30 minutes.
 */
export function fitsTime(recipe, { max = Infinity, prep = [] } = {}) {
  if ((recipe.minutes || 30) > max) return false;
  if (prep.includes("quickprep") && !isQuickPrep(recipe)) return false;
  if (prep.includes("handsoff") && !isHandsOff(recipe)) return false;
  return true;
}

/** The choice only counts for the day it was made, so the question comes back tomorrow. */
export function todaysChoice(saved, today) {
  if (!saved || saved.day !== today) return null;
  const opt = TIME_OPTIONS.find((o) => o.id === saved.time);
  if (!opt) return null;
  return { time: opt.id, max: opt.max, label: opt.label, prep: (saved.prep || []).filter((p) => PREP_OPTIONS.some((o) => o.id === p)) };
}

/** A line for Claude so fresh ideas respect the time too. */
export function timeRequest(choice) {
  if (!choice) return "";
  const parts = [];
  if (Number.isFinite(choice.max)) parts.push(`I only have ${choice.label} to cook today, so every recipe must take ${choice.max} minutes or less in total`);
  if (choice.prep.includes("quickprep")) parts.push("keep prep minimal: at most 3 main ingredients to handle and 3 short steps");
  if (choice.prep.includes("handsoff")) parts.push("prefer hands-off cooking where the oven, a simmering pot or the fridge does most of the work");
  return parts.length ? parts.join("; ") + "." : "";
}
