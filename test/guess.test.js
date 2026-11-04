import { test } from "node:test";
import assert from "node:assert/strict";
import { guessFood } from "../js/data/guess.js";
import { makeItem, recategorize } from "../js/store.js";
import { zoneFor } from "../js/fridge.js";
import { foodIcon } from "../js/icons.js";

test("asparagus is a vegetable with its own icon", () => {
  const it = makeItem({ name: "asparagus" });
  assert.equal(it.category, "produce");
  assert.equal(zoneFor(it), "veg");
  assert.match(foodIcon("asparagus", "produce").svg, /M7 21L9.2 6.6/, "spears icon");
});

test("everyday groceries land in the right aisle", () => {
  const z = (name) => zoneFor(makeItem({ name }));
  assert.equal(z("green beans"), "veg");
  assert.equal(z("cauliflower"), "veg");
  assert.equal(z("oranges"), "fruit");
  assert.equal(z("grapes"), "fruit");
  assert.equal(z("cod"), "meat");
  assert.equal(z("oat milk"), "dairy");
  assert.equal(z("ketchup"), "door");
  assert.equal(z("orange juice"), "door");
  assert.equal(z("bagels"), "bread");
  assert.equal(z("tortilla chips"), "snacks");
  assert.equal(z("ice cream"), "freezer");
  assert.equal(z("lentils"), "cans");
});

test("foods the app has never heard of are guessed from their name", () => {
  assert.equal(guessFood("purple kohlrabi").category, "produce");
  assert.equal(guessFood("lamb shank").category, "meat");
  assert.equal(guessFood("sweet chili sauce").category, "condiments");
  assert.equal(guessFood("dragon fruit").category, "produce");
  assert.equal(guessFood("swiss chard").category, "produce");
  assert.equal(guessFood("xyzzy"), null);
  const odd = makeItem({ name: "romanesco broccoli" });
  assert.equal(odd.category, "produce");
  assert.equal(zoneFor(makeItem({ name: "starfruit" })), "fruit");
});

test("items saved as other are fixed on load", () => {
  const [a, b] = recategorize([
    { name: "asparagus", category: "other", location: "fridge" },
    { name: "mystery jar", category: "other", location: "pantry" },
  ]);
  assert.equal(a.category, "produce");
  assert.equal(b.category, "other");
});

test("a variety keeps the name you typed but counts as its group", () => {
  const oat = makeItem({ name: "oat milk" });
  assert.equal(oat.name, "plant milk");
  assert.equal(oat.label, "oat milk");
  assert.equal(makeItem({ name: "cod" }).label, "cod");
  assert.equal(makeItem({ name: "oranges" }).label, undefined, "a plural is not a variety");
  assert.equal(makeItem({ name: "asparagus" }).label, undefined);
  assert.equal(makeItem({ name: "frozen blueberries" }).label, "blueberries");
});
