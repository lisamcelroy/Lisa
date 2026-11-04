import { test } from "node:test";
import assert from "node:assert/strict";
import { mealsFor, mealNow } from "../js/data/meals.js";
import { RECIPES } from "../js/data/recipes.js";

test("every built-in recipe has meals", () => {
  for (const r of RECIPES) assert.ok(mealsFor(r).length, r.id);
});

test("no heavy dinners for breakfast", () => {
  for (const id of ["turkey-chili", "steak-potatoes", "spaghetti-bolognese", "chicken-curry"]) {
    assert.equal(mealsFor(RECIPES.find((r) => r.id === id)).includes("breakfast"), false, id);
  }
  assert.ok(mealsFor(RECIPES.find((r) => r.id === "overnight-oats")).includes("breakfast"));
});

test("ideas and custom recipes", () => {
  assert.deepEqual(mealsFor({ meals: ["dinner", "breakfast", "nonsense"] }), ["breakfast", "dinner"]);
  assert.deepEqual(mealsFor({ tags: ["soup"] }), ["lunch", "dinner"]);
  assert.deepEqual(mealsFor({ tags: [] }), ["lunch", "dinner"]);
});

test("meal by time of day", () => {
  const at = (h) => new Date(2026, 10, 4, h);
  assert.equal(mealNow(at(8)), "breakfast");
  assert.equal(mealNow(at(13)), "lunch");
  assert.equal(mealNow(at(19)), "dinner");
});
