import { test } from "node:test";
import assert from "node:assert/strict";
import { parseRecipeText, parseIngredientLine } from "../js/recipeImport.js";

test("parses quantities, fractions and units", () => {
  assert.deepEqual(
    (({ name, qty, unit }) => ({ name, qty, unit }))(parseIngredientLine("1 1/2 cups baby spinach")),
    { name: "spinach", qty: 1.5, unit: "cup" }
  );
  assert.equal(parseIngredientLine("½ lemon, juiced").qty, 0.5);
  assert.equal(parseIngredientLine("3 large eggs").name, "egg");
  assert.equal(parseIngredientLine("Salt, to taste").optional, true);
});

test("splits a pasted recipe into parts", () => {
  const r = parseRecipeText(`Lemon Chicken
Ingredients
2 chicken breasts
1 lemon
2 cloves garlic
Directions
1. Season the chicken.
2. Roast 25 minutes.`);
  assert.equal(r.title, "Lemon Chicken");
  assert.deepEqual(r.ingredients.map((i) => i.name), ["chicken breast", "lemon", "garlic"]);
  assert.equal(r.steps.length, 2);
  assert.equal(r.steps[0], "Season the chicken.");
});
