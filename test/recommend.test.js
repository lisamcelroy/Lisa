import { test } from "node:test";
import assert from "node:assert/strict";
import { recommend, cookRecipe } from "../js/recommend.js";
import { RECIPES } from "../js/data/recipes.js";
import { FOOD_BY_NAME } from "../js/data/foods.js";
import { makeItem } from "../js/store.js";

const DAY = 86400000;
const now = Date.UTC(2026, 0, 1);

test("every built-in recipe uses catalog ingredients", () => {
  for (const r of RECIPES) {
    for (const ing of r.ingredients) assert.ok(FOOD_BY_NAME.has(ing.name), `${r.id}: ${ing.name}`);
  }
});

test("recipes you can fully make rank first", () => {
  const inv = ["egg", "spinach", "bell pepper", "butter"].map((name) => makeItem({ name, qty: 6 }, now));
  const [top] = recommend(RECIPES, inv, { now });
  assert.equal(top.recipe.id, "veggie-omelette");
  assert.deepEqual(top.missing, []);
});

test("staples are assumed unless turned off", () => {
  const omelette = RECIPES.find((r) => r.id === "veggie-omelette");
  const inv = ["egg", "spinach", "bell pepper", "butter"].map((name) => makeItem({ name }, now));
  assert.deepEqual(recommend([omelette], inv, { now })[0].missing, []);
  assert.deepEqual(recommend([omelette], inv, { now, assumeStaples: false })[0].missing.sort(), ["black pepper", "salt"]);
});

test("recipes that rescue expiring food get a boost", () => {
  const inv = [
    makeItem({ name: "spinach", expiresAt: now + 1 * DAY }, now),
    makeItem({ name: "egg", qty: 12 }, now),
    makeItem({ name: "bread", qty: 10, unit: "slice" }, now),
    makeItem({ name: "milk", qty: 2, unit: "l" }, now),
    makeItem({ name: "butter" }, now),
    makeItem({ name: "bell pepper" }, now),
  ];
  const ranked = recommend(RECIPES, inv, { now });
  const omelette = ranked.find((r) => r.recipe.id === "veggie-omelette");
  assert.deepEqual(omelette.usesSoon, ["spinach"]);
  assert.ok(ranked.indexOf(omelette) < ranked.findIndex((r) => r.recipe.id === "french-toast"));
});

test("cooking subtracts compatible quantities", () => {
  const omelette = RECIPES.find((r) => r.id === "veggie-omelette");
  const inv = [makeItem({ name: "egg", qty: 12 }, now), makeItem({ name: "spinach", qty: 1, unit: "cup" }, now)];
  const { inventory } = cookRecipe(omelette, inv);
  assert.equal(inventory.find((i) => i.name === "egg").qty, 9);
  assert.equal(inventory.find((i) => i.name === "spinach"), undefined);
});
