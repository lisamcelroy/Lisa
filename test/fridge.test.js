import { test } from "node:test";
import assert from "node:assert/strict";
import { zoneFor, renderAppliances } from "../js/fridge.js";
import { foodIcon } from "../js/icons.js";
import { FOODS } from "../js/data/foods.js";
import { makeItem } from "../js/store.js";

test("items land on sensible shelves", () => {
  const z = (name, location) => zoneFor(makeItem({ name, location }));
  assert.equal(z("milk"), "dairy");
  assert.equal(z("eggs"), "dairy");
  assert.equal(z("chicken breast"), "meat");
  assert.equal(z("tofu"), "meat");
  assert.equal(z("spinach"), "veg");
  assert.equal(z("tomato", "fridge"), "veg");
  assert.equal(z("apple"), "fruit");
  assert.equal(z("lemon"), "fruit");
  assert.equal(zoneFor({ name: "mango", category: "produce", location: "fridge" }), "fruit");
  assert.equal(zoneFor({ name: "leftover curry", category: "other", location: "fridge" }), "other");
  assert.equal(z("mustard"), "door");
  assert.equal(z("flour"), "baking");
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

import { makeLeftover, recategorize } from "../js/store.js";
import { formatQty } from "../js/units.js";

test("leftovers go on their own shelf and stay leftovers", () => {
  const lo = makeLeftover({ id: "chicken-curry", title: "Teriyaki Glaze Chicken", servings: 4 }, 2, 450);
  assert.equal(lo.label, "Leftover Teriyaki Glaze Chicken");
  assert.equal(zoneFor(lo), "leftovers");
  assert.equal(zoneFor({ ...lo, location: "freezer" }), "freezer");
  assert.equal(recategorize([lo])[0].category, "leftovers", "the word glaze doesn't make it a sauce");
  assert.equal(formatQty(2, "serving"), "2 servings");
  assert.equal(formatQty(1, "servings"), "1 serving");
  const { fridge } = renderAppliances([lo]);
  assert.match(fridge, /Leftovers/);
  assert.doesNotMatch(renderAppliances([]).fridge, />Leftovers</, "shelf only shows when there are some");
});
