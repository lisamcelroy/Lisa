import { test } from "node:test";
import assert from "node:assert/strict";
import { buildIdeasPrompt, cleanIdeas } from "../js/ai.js";

test("ideas prompt is stable for the same kitchen", () => {
  const a = buildIdeasPrompt([{ name: "egg" }, { name: "spinach" }, { name: "egg" }]);
  const b = buildIdeasPrompt([{ name: "spinach" }, { name: "egg" }]);
  assert.equal(a, b);
  assert.match(a, /egg, spinach/);
});

test("ideas prompt carries expiring food, mood and exclusions", () => {
  const p = buildIdeasPrompt([{ name: "milk" }], { soon: ["milk"], request: "something warm", exclude: ["Porridge"] });
  assert.match(p, /using up.*milk/);
  assert.match(p, /something warm/);
  assert.match(p, /Porridge/);
});

test("cleanIdeas keeps well-formed recipes and fills defaults", () => {
  const out = cleanIdeas({
    recipes: [
      { title: "Eggy Bread", minutes: "15", servings: 2, ingredients: [{ name: "egg", qty: 2, unit: "count" }, { name: "" }], steps: ["Fry"] },
      { title: "No ingredients", ingredients: [] },
      "junk",
    ],
  });
  assert.equal(out.length, 1);
  assert.equal(out[0].minutes, 15);
  assert.deepEqual(out[0].ingredients, [{ name: "egg", qty: 2, unit: "count", optional: false }]);
  assert.deepEqual(cleanIdeas(null), []);
});
