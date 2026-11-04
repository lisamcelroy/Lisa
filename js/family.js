// Family food preferences: who loves, tolerates, hates or is allergic to what,
// and what that means for a recipe. Pure functions, tested in test/family.test.js.
import { FOOD_BY_NAME } from "./data/foods.js";

export const LEVELS = [
  { id: "allergic", label: "Allergic", hint: "Never in a meal" },
  { id: "hates", label: "Hates", hint: "Leave it out" },
  { id: "tolerates", label: "Tolerates", hint: "Fine in a meal, not the star" },
  { id: "loves", label: "Loves", hint: "More of this, please" },
];
export const LEVEL_LABEL = Object.fromEntries(LEVELS.map((l) => [l.id, l.label]));

/** Does a preference for `food` apply to the ingredient `ing`? Disliking "cheese" covers cheddar too. */
export function prefHits(food, ing) {
  if (food === ing) return true;
  return FOOD_BY_NAME.get(ing)?.parent === food;
}

/** Members who are eating (everyone unless switched off). */
export const eating = (family = []) => family.filter((m) => m.home !== false);

/**
 * What the people eating think of a recipe.
 * blocked: a required ingredient someone is allergic to or hates, so the recipe is out.
 * leaveOut: an optional ingredient someone hates or is allergic to; cook without it.
 * tolerate: someone tolerates it; keep it small or on the side.
 * loves: someone loves an ingredient in it.
 */
export function familyCheck(recipe, family = []) {
  const out = { blocked: [], leaveOut: [], tolerate: [], loves: [] };
  for (const m of eating(family)) {
    for (const p of m.prefs || []) {
      for (const ing of recipe.ingredients || []) {
        if (!prefHits(p.food, ing.name)) continue;
        const hit = { who: m.name, food: ing.name, level: p.level };
        if (p.level === "allergic" || p.level === "hates") (ing.optional ? out.leaveOut : out.blocked).push(hit);
        else if (p.level === "tolerates") out.tolerate.push(hit);
        else if (p.level === "loves") out.loves.push(hit);
      }
    }
  }
  return out;
}

const names = (list) => (list.length < 2 ? list.join("") : `${list.slice(0, -1).join(", ")} and ${list.at(-1)}`);

/** Short notes for a recipe card or detail, e.g. "Leave out the mushroom for Lisa". */
export function familyNotes(check) {
  const notes = [];
  const byFood = (list) => {
    const m = new Map();
    for (const h of list) m.set(h.food, [...new Set([...(m.get(h.food) || []), h.who])]);
    return [...m];
  };
  for (const [food, who] of byFood(check.blocked)) notes.push({ kind: "blocked", text: `${names(who)} won't eat the ${food}` });
  for (const [food, who] of byFood(check.leaveOut)) notes.push({ kind: "leave", text: `Leave out the ${food} for ${names(who)}` });
  for (const [food, who] of byFood(check.tolerate)) notes.push({ kind: "tolerate", text: `Keep the ${food} small or on the side for ${names(who)}` });
  for (const [food, who] of byFood(check.loves)) notes.push({ kind: "loves", text: `${names(who)} ${who.length > 1 ? "love" : "loves"} the ${food}` });
  return notes;
}

/** A line for Claude so fresh ideas respect everyone at the table. */
export function familyRequest(family = []) {
  const at = eating(family).filter((m) => m.name);
  if (!at.length) return "";
  const group = (level) => {
    const out = [];
    for (const m of at) for (const p of m.prefs || []) if (p.level === level) out.push(`${p.food} (${m.name})`);
    return out;
  };
  const parts = [`I'm cooking for ${names(at.map((m) => m.name))}`];
  const allergic = group("allergic"), hates = group("hates"), tolerates = group("tolerates"), loves = group("loves");
  if (allergic.length) parts.push(`never use these, someone is allergic: ${allergic.join(", ")}`);
  if (hates.length) parts.push(`don't use these, someone hates them: ${hates.join(", ")}`);
  if (tolerates.length) parts.push(`these are fine only in small amounts, not as a main ingredient: ${tolerates.join(", ")}`);
  if (loves.length) parts.push(`favourites worth using: ${loves.join(", ")}`);
  return parts.join("; ") + ".";
}
