import { test } from "node:test";
import assert from "node:assert/strict";
import { keywordsFor, KEYWORD_IDS } from "../js/data/keywords.js";
import { RECIPES } from "../js/data/recipes.js";
import { cleanIdeas } from "../js/ai.js";

test("keywords are selective, not on every recipe", () => {
  const occasion = KEYWORD_IDS.filter((k) => !["quick", "vegetarian", "vegan"].includes(k));
  for (const k of occasion) {
    const n = RECIPES.filter((r) => keywordsFor(r).includes(k)).length;
    assert.ok(n >= 2 && n <= 10, `${k} is on ${n} of ${RECIPES.length} recipes`);
  }
  for (const r of RECIPES) {
    const n = keywordsFor(r).filter((k) => occasion.includes(k)).length;
    assert.ok(n <= 3, `${r.title} has ${n} occasion keywords`);
  }
});

test("diet keywords only where they are true", () => {
  const kw = (id) => keywordsFor(RECIPES.find((r) => r.id === id));
  assert.ok(!kw("tuna-melt").includes("vegetarian"), "tuna is fish");
  assert.ok(!kw("minestrone").includes("vegan"), "broth may be chicken broth");
  assert.ok(!kw("spaghetti-bolognese").includes("vegetarian"));
  assert.ok(kw("chickpea-curry").includes("vegan"));
  assert.ok(kw("garlic-butter-pasta").includes("vegetarian") && !kw("garlic-butter-pasta").includes("vegan"));
});

test("quick and diet keywords are worked out for any recipe", () => {
  const veg = { minutes: 15, ingredients: [{ name: "pasta" }, { name: "butter" }, { name: "chicken", optional: true }] };
  assert.deepEqual(keywordsFor(veg), ["quick", "vegetarian"]);
  const vegan = { minutes: 40, ingredients: [{ name: "chickpeas" }, { name: "spinach" }] };
  assert.deepEqual(keywordsFor(vegan), ["vegetarian", "vegan"]);
  const meat = { minutes: 40, ingredients: [{ name: "steak" }] };
  assert.deepEqual(keywordsFor(meat), []);
  const unknown = { minutes: 40, ingredients: [{ name: "mystery meat" }] };
  assert.deepEqual(keywordsFor(unknown), []); // no diet guess when an ingredient isn't recognised
  assert.deepEqual(keywordsFor({ ...meat, keywords: ["party", "made-up"] }), ["party"]);
});

test("Claude's keywords are kept only when they are known ids", () => {
  const [r] = cleanIdeas({ recipes: [{ title: "Dip", ingredients: [{ name: "salsa" }], keywords: ["party", "spicy"] }] });
  assert.deepEqual(r.keywords, ["party"]);
  const [many] = cleanIdeas({ recipes: [{ title: "All", ingredients: [{ name: "salsa" }], keywords: ["easy", "party", "kids", "budget", "comfort"] }] });
  assert.equal(many.keywords.length, 3);
});

test("recipes saved with lots of keywords only show three", () => {
  const old = { minutes: 45, ingredients: [{ name: "steak" }], keywords: ["easy", "party", "kids", "budget", "comfort", "entree"] };
  assert.deepEqual(keywordsFor(old), ["easy", "party", "kids"]);
});

test("a wrong vegetarian label is overruled by the ingredients", () => {
  assert.ok(!keywordsFor({ minutes: 30, ingredients: [{ name: "bacon" }], keywords: ["vegetarian"] }).includes("vegetarian"));
  assert.ok(keywordsFor({ minutes: 30, ingredients: [{ name: "seitan" }], keywords: ["vegan"] }).includes("vegan"));
});
