import { test } from "node:test";
import assert from "node:assert/strict";
import { estimateCalories, gramsOf, KNOWN_NUTRITION } from "../js/nutrition.js";
import { weekDays, isoDay, dayCalories, prunePlan, plannedRecipeIds } from "../js/plan.js";
import { RECIPES } from "../js/data/recipes.js";
import { FOODS } from "../js/data/foods.js";

test("every catalog food has nutrition data", () => {
  const missing = FOODS.map((f) => f.name).filter((n) => !KNOWN_NUTRITION.includes(n));
  assert.deepEqual(missing, []);
});

test("unit conversions", () => {
  assert.equal(gramsOf("egg", 3, "count"), 150);
  assert.equal(gramsOf("butter", 1, "tbsp"), 15 * 0.95);
  assert.equal(gramsOf("pasta", 0.5, "kg"), 500);
  assert.equal(gramsOf("black beans", 1, "can"), 260);
});

test("calorie estimates are per serving, skip optional extras and stay sensible", () => {
  const omelette = RECIPES.find((r) => r.id === "veggie-omelette");
  assert.equal(estimateCalories(omelette).perServing, 340);
  const doubled = { ...omelette, servings: 2 };
  assert.equal(estimateCalories(doubled).perServing, 170);
  for (const r of RECIPES) {
    const { perServing, guessed } = estimateCalories(r);
    assert.ok(perServing >= 50 && perServing <= 1200, `${r.title}: ${perServing}`);
    assert.deepEqual(guessed, [], r.title);
  }
  const custom = { servings: 1, ingredients: [{ name: "dragon fruit", qty: 1, unit: "count" }] };
  assert.deepEqual(estimateCalories(custom).guessed, ["dragon fruit"]);
});

test("weeks start on Monday and use local dates", () => {
  const days = weekDays(0, new Date(2026, 10, 4)); // Wednesday 4 Nov 2026
  assert.equal(isoDay(days[0]), "2026-11-02");
  assert.equal(isoDay(days[6]), "2026-11-08");
  assert.equal(isoDay(weekDays(1, new Date(2026, 10, 4))[0]), "2026-11-09");
  assert.equal(isoDay(weekDays(0, new Date(2026, 10, 8))[0]), "2026-11-02"); // Sunday stays in the same week
});

test("day totals, pruning and planned recipes", () => {
  const plan = {
    "2026-11-04": { breakfast: { recipeId: "a", kcal: 300 }, dinner: { text: "Eating out", kcal: null } },
    "2026-08-01": { lunch: { recipeId: "old", kcal: 500 } },
  };
  assert.deepEqual(dayCalories(plan["2026-11-04"]), { total: 300, known: false, meals: 2 });
  assert.deepEqual(Object.keys(prunePlan(plan, new Date(2026, 10, 4))), ["2026-11-04"]);
  const week = weekDays(0, new Date(2026, 10, 4));
  assert.deepEqual(plannedRecipeIds(plan, week), ["a"]);
  assert.deepEqual(plannedRecipeIds(plan, week, "2026-11-05"), []);
});
