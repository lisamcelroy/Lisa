import { test } from "node:test";
import assert from "node:assert/strict";
import { zoneFor, renderAppliances } from "../js/fridge.js";
import { foodIcon } from "../js/icons.js";
import { FOODS } from "../js/data/foods.js";
import { makeItem } from "../js/store.js";

test("items land on sensible shelves", () => {
  const z = (name, location) => zoneFor(makeItem({ name, location }));
  assert.equal(z("milk"), "top");
  assert.equal(z("chicken breast"), "middle");
  assert.equal(z("spinach"), "crisper");
  assert.equal(z("mustard"), "door");
  assert.equal(z("frozen peas"), "freezer");
  assert.equal(z("rice"), "grains");
  assert.equal(z("black beans"), "cans");
  assert.equal(z("soy sauce"), "sauces");
  assert.equal(z("bread"), "bread");
  assert.equal(z("onion"), "basket");
  assert.equal(z("chicken breast", "freezer"), "freezer");
});

test("every catalog food has an icon", () => {
  for (const f of FOODS) assert.match(foodIcon(f.name, f.category).svg, /^<svg/);
  assert.match(foodIcon("dragon fruit", "unknown").svg, /^<svg/);
});

test("appliances render every item once and escape names", () => {
  const inv = [makeItem({ name: "eggs" }), makeItem({ name: "<b>odd</b>" }), makeItem({ name: "rice" })];
  const { fridge, pantry } = renderAppliances(inv);
  const html = fridge + pantry;
  assert.equal((html.match(/class="food /g) || []).length, 3);
  assert.ok(!html.includes("<b>odd"));
});
