import { test } from "node:test";
import assert from "node:assert/strict";
import { matchFood, satisfies } from "../js/normalize.js";
import { zoneFor, renderAppliances } from "../js/fridge.js";
import { makeItem } from "../js/store.js";
import { recommend } from "../js/recommend.js";
import { parseIngredientLine } from "../js/recipeImport.js";

test("seasonings are recognised by their own names", () => {
  assert.equal(matchFood("smoked paprika").name, "paprika");
  assert.equal(matchFood("red pepper flakes").name, "chili flakes");
  assert.equal(matchFood("red pepper").name, "bell pepper");
  assert.equal(matchFood("garlic powder").name, "garlic powder");
  assert.equal(matchFood("garlic").name, "garlic");
  assert.equal(matchFood("cayenne pepper").name, "cayenne");
  assert.equal(matchFood("ground pepper").name, "black pepper");
  assert.equal(matchFood("curry powder").name, "curry powder");
  assert.equal(parseIngredientLine("1 tsp ground cumin").name, "cumin");
});

test("seasonings go on the spice rack, sauces stay in the pantry", () => {
  assert.equal(zoneFor(makeItem({ name: "cumin" })), "rack");
  assert.equal(zoneFor(makeItem({ name: "salt" })), "rack");
  assert.equal(zoneFor(makeItem({ name: "soy sauce" })), "sauces");
  const { rack } = renderAppliances([makeItem({ name: "cumin" }), makeItem({ name: "oregano" })]);
  assert.equal((rack.match(/class="food /g) || []).length, 2);
  assert.match(renderAppliances([]).rack, /No seasonings yet/);
});

test("any seasoning counts for recipes that just say spices", () => {
  assert.ok(satisfies("cumin", "spices"));
  const r = { id: "x", ingredients: [{ name: "egg" }, { name: "spices" }], minutes: 10, servings: 1, tags: [] };
  const inv = [makeItem({ name: "egg" }), makeItem({ name: "paprika" })];
  assert.deepEqual(recommend([r], inv, { assumeStaples: false })[0].missing, []);
  assert.deepEqual(recommend([r], [makeItem({ name: "egg" })], { assumeStaples: false })[0].missing, ["spices"]);
});
