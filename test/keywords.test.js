import { test } from "node:test";
import assert from "node:assert/strict";
import { keywordsFor, KEYWORD_IDS } from "../js/data/keywords.js";
import { RECIPES } from "../js/data/recipes.js";
import { cleanIdeas } from "../js/ai.js";

test("every built-in recipe has at least two keywords, all valid", () => {
  for (const r of RECIPES) {
    const ks = keywordsFor(r);
    assert.ok(ks.length >= 2, `${r.title}: ${ks}`);
    for (const k of ks) assert.ok(KEYWORD_IDS.includes(k));
  }
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
});
