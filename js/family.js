// Family food preferences: who loves, tolerates, hates or is allergic to what,
// and what that means for a recipe. Pure functions, tested in test/family.test.js.
import { FOOD_BY_NAME } from "./data/foods.js";
import { ALLERGENS, DIETS, ALLERGEN_BY_ID, DIET_BY_ID } from "./data/diets.js";

export { ALLERGENS, DIETS };

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

// Days out are stored as "2026-11-06" (out all day) or "2026-11-06:dinner" (out for one meal).
const MEALS3 = ["breakfast", "lunch", "dinner"];
const dayOf = (entry) => entry.slice(0, 10);

/**
 * Is this person out on `day`? With a `meal`, true when they're out for that meal
 * (or all day); without one, only when they're out all day.
 */
export const isOut = (m, day, meal) => Boolean(day && ((m.away || []).includes(day) || (meal && (m.away || []).includes(`${day}:${meal}`))));

/** "all" when out all day, otherwise the meals they're out for that day (maybe none). */
export function outMeals(m, day) {
  const away = m.away || [];
  if (away.includes(day)) return "all";
  return MEALS3.filter((meal) => away.includes(`${day}:${meal}`));
}

/** "all day", "dinner", "lunch and dinner" */
export function outLabel(m, day) {
  const meals = outMeals(m, day);
  if (meals === "all") return "all day";
  return meals.length < 2 ? meals.join("") : `${meals.slice(0, -1).join(", ")} and ${meals.at(-1)}`;
}

/**
 * Tap a day in the calendar: `choice` is "all" or a meal.
 * All day toggles the whole day; a meal toggles just that meal (all three make all day).
 */
export function toggleAway(away = [], day, choice) {
  const others = away.filter((e) => dayOf(e) !== day);
  const now = outMeals({ away }, day);
  if (choice === "all") return now === "all" ? others : [...others, day].sort();
  let meals = now === "all" ? [...MEALS3] : now;
  meals = meals.includes(choice) ? meals.filter((x) => x !== choice) : [...meals, choice];
  if (meals.length === MEALS3.length) return [...others, day].sort();
  return [...others, ...meals.map((x) => `${day}:${x}`)].sort();
}

/** Members eating at home on `day` (for `meal`, if given). */
export const eating = (family = [], day, meal) => family.filter((m) => !isOut(m, day, meal));

/** Forget days out that are already over. */
export const pruneAway = (away = [], today) => away.filter((d) => dayOf(d) >= today).sort();

/** The days (today on) someone is out at least partly, in order. */
export const awayDays = (m, today) => [...new Set((m.away || []).map(dayOf))].filter((d) => d >= today).sort();

/**
 * What the people eating think of a recipe.
 * blocked: a required ingredient someone is allergic to or hates, so the recipe is out.
 * leaveOut: an optional ingredient someone hates or is allergic to; cook without it.
 * tolerate: someone tolerates it; keep it small or on the side.
 * loves: someone loves an ingredient in it.
 */
export function familyCheck(recipe, family = [], day, meal) {
  const out = { blocked: [], leaveOut: [], tolerate: [], loves: [], advice: [] };
  for (const m of eating(family, day, meal)) {
    // Allergies and diets rule ingredients out, like "allergic" and "hates" do.
    const rules = [
      ...(m.allergies || []).map((id) => ALLERGEN_BY_ID[id] && { test: ALLERGEN_BY_ID[id].test, level: "allergic", why: `${ALLERGEN_BY_ID[id].label.toLowerCase()} allergy` }),
      ...(m.diets || []).map((id) => DIET_BY_ID[id]?.rule === "avoid" && { test: DIET_BY_ID[id].test, level: "diet", why: DIET_BY_ID[id].label.toLowerCase() }),
    ].filter(Boolean);
    for (const rule of rules) {
      for (const ing of recipe.ingredients || []) {
        if (!rule.test(ing.name)) continue;
        (ing.optional ? out.leaveOut : out.blocked).push({ who: m.name, food: ing.name, level: rule.level, why: rule.why });
      }
    }
    if ((m.diets || []).includes("lowsalt")) {
      const salty = (recipe.ingredients || []).filter((i) => DIET_BY_ID.lowsalt.test(i.name)).map((i) => i.name);
      out.advice.push({ who: m.name, kind: "lowsalt", foods: salty });
    }
    if ((m.diets || []).includes("highsalt")) out.advice.push({ who: m.name, kind: "highsalt", foods: [] });
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
  const whyOf = (list, food) => [...new Set(list.filter((h) => h.food === food && h.why).map((h) => h.why))];
  for (const [food, who] of byFood(check.blocked)) {
    const why = whyOf(check.blocked, food);
    notes.push({ kind: "blocked", text: why.length ? `${names(who)} can't have the ${food} (${why.join(", ")})` : `${names(who)} won't eat the ${food}` });
  }
  for (const [food, who] of byFood(check.leaveOut)) {
    const why = whyOf(check.leaveOut, food);
    notes.push({ kind: "leave", text: `Leave out the ${food} for ${names(who)}${why.length ? ` (${why.join(", ")})` : ""}` });
  }
  for (const [food, who] of byFood(check.tolerate)) notes.push({ kind: "tolerate", text: `Keep the ${food} small or on the side for ${names(who)}` });
  for (const [food, who] of byFood(check.loves)) notes.push({ kind: "loves", text: `${names(who)} ${who.length > 1 ? "love" : "loves"} the ${food}` });
  for (const a of check.advice || []) {
    if (a.kind === "lowsalt") notes.push({ kind: "tolerate", text: a.foods.length
      ? `Low salt for ${a.who}: skip added salt${a.foods.filter((f) => f !== "salt").length ? ` and use low-sodium ${a.foods.filter((f) => f !== "salt").join(", ")}` : ""}`
      : `Low salt for ${a.who}: season with herbs and lemon instead of salt` });
    if (a.kind === "highsalt") notes.push({ kind: "loves", text: `High salt for ${a.who}: salt their portion well` });
  }
  return notes;
}

/** A line for Claude so fresh ideas respect everyone at the table. */
export function familyRequest(family = [], day, meal) {
  const at = eating(family, day, meal).filter((m) => m.name);
  if (!at.length) return "";
  const group = (level) => {
    const out = [];
    for (const m of at) for (const p of m.prefs || []) if (p.level === level) out.push(`${p.food} (${m.name})`);
    return out;
  };
  const parts = [`I'm cooking for ${names(at.map((m) => m.name))}`];
  for (const m of at) {
    const allergies = (m.allergies || []).map((id) => ALLERGEN_BY_ID[id]?.label.toLowerCase()).filter(Boolean);
    if (allergies.length) parts.push(`${m.name} is allergic to ${names(allergies)}, so never include any`);
    const diets = (m.diets || []).map((id) => DIET_BY_ID[id]).filter(Boolean);
    if (diets.length) parts.push(`${m.name} eats ${diets.map((d) => `${d.label.toLowerCase()} (${d.hint})`).join(", ")}`);
  }
  const allergic = group("allergic"), hates = group("hates"), tolerates = group("tolerates"), loves = group("loves");
  if (allergic.length) parts.push(`never use these, someone is allergic: ${allergic.join(", ")}`);
  if (hates.length) parts.push(`don't use these, someone hates them: ${hates.join(", ")}`);
  if (tolerates.length) parts.push(`these are fine only in small amounts, not as a main ingredient: ${tolerates.join(", ")}`);
  if (loves.length) parts.push(`favourites worth using: ${loves.join(", ")}`);
  return parts.join("; ") + ".";
}
