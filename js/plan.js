// Meal plan: breakfast, lunch and dinner for each day, keyed by local date.
//
// state.plan = { "2026-11-04": { breakfast: Entry, lunch: Entry, dinner: Entry } }
// Entry = { recipeId, title, kcal } for a recipe, or { text, kcal } for anything else
// ("leftovers", "eating out"). kcal is the per-serving estimate, or null if unknown.

export const MEALS = ["breakfast", "lunch", "dinner"];
export const MEAL_LABEL = { breakfast: "Breakfast", lunch: "Lunch", dinner: "Dinner" };

const DAY_MS = 24 * 60 * 60 * 1000;

/** "YYYY-MM-DD" for a date in local time. */
export function isoDay(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function fromIsoDay(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/** The seven days (Monday first) of the week `offset` weeks from the one containing `today`. */
export function weekDays(offset = 0, today = new Date()) {
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const fromMonday = (start.getDay() + 6) % 7;
  start.setDate(start.getDate() - fromMonday + offset * 7);
  return Array.from({ length: 7 }, (_, i) => new Date(start.getFullYear(), start.getMonth(), start.getDate() + i));
}

/** Total planned calories for one day; `known` is false if any planned meal has no estimate. */
export function dayCalories(day = {}) {
  let total = 0;
  let known = true;
  let meals = 0;
  for (const meal of MEALS) {
    const entry = day[meal];
    if (!entry) continue;
    meals++;
    if (Number.isFinite(entry.kcal)) total += entry.kcal;
    else known = false;
  }
  return { total, known, meals };
}

/** Drop days more than `keepDays` in the past so the saved plan stays small. */
export function prunePlan(plan = {}, today = new Date(), keepDays = 60) {
  const cutoff = isoDay(new Date(today.getTime() - keepDays * DAY_MS));
  const out = {};
  for (const [day, meals] of Object.entries(plan)) {
    if (day >= cutoff && meals && Object.keys(meals).length) out[day] = meals;
  }
  return out;
}

/** Recipe ids planned on the given days (from today on, if `fromDay` is set). */
export function plannedRecipeIds(plan, days, fromDay = "") {
  const ids = [];
  for (const d of days) {
    const key = isoDay(d);
    if (fromDay && key < fromDay) continue;
    for (const meal of MEALS) {
      const id = plan[key]?.[meal]?.recipeId;
      if (id) ids.push(id);
    }
  }
  return ids;
}
