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
  assert.equal(z("orange juice"), "drinks");
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

test("sauces and drinks are kept apart, and the owner's examples are right", () => {
  const z = (name) => zoneFor(makeItem({ name }));
  assert.equal(z("broccolini"), "veg");
  assert.equal(z("diet coke"), "drinks");
  assert.equal(makeItem({ name: "diet coke" }).label, "diet coke");
  assert.equal(z("orange juice"), "drinks");
  assert.equal(z("ketchup"), "door");
  assert.equal(z("bbq rub"), "rack");
  assert.equal(z("steak rub"), "rack");
  assert.equal(z("coffee"), "pantry-drinks");
  assert.equal(guessFood("cherry cola").category, "drinks");
  assert.equal(guessFood("smoky chipotle rub").category, "spices");
  assert.equal(guessFood("purple sprouting broccoli").category, "produce");
});

test("items the catalog now knows are re-sorted even if guessed before", () => {
  const [a] = recategorize([{ name: "diet coke", category: "other", location: "fridge" }]);
  assert.equal(a.category, "drinks");
});

test("kotleti and other patties are meat", () => {
  const z = (name) => zoneFor(makeItem({ name }));
  assert.equal(z("kotleti"), "meat");
  assert.equal(z("chicken patties"), "meat");
  assert.equal(makeItem({ name: "chicken patties" }).label, "chicken patties");
  assert.equal(z("beef patties"), "meat");
  assert.equal(guessFood("turkey kotletki").category, "meat");
  assert.equal(guessFood("veggie patties").category, "protein", "plant-based, not meat");
  const [k] = recategorize([{ name: "kotleti", category: "other", location: "fridge" }]);
  assert.equal(k.category, "meat");
});

test("anything called a sauce is a sauce", () => {
  const z = (name) => { const it = makeItem({ name }); return `${it.name}|${it.category}|${zoneFor(it)}`; };
  assert.equal(z("burger sauce"), "burger sauce|condiments|door");
  assert.equal(z("garlic sauce"), "garlic sauce|condiments|door");
  assert.equal(z("chicken sauce"), "chicken sauce|condiments|door");
  assert.equal(z("mushroom gravy"), "mushroom gravy|condiments|door");
  assert.equal(z("beef marinade"), "beef marinade|condiments|door");
  assert.equal(makeItem({ name: "pasta sauce" }).category, "canned", "known sauces keep their aisle");
  assert.equal(makeItem({ name: "fish sauce" }).name, "fish sauce");
  const [fixed] = recategorize([{ name: "burger patties", label: "burger sauce", category: "meat", location: "fridge" }]);
  assert.equal(fixed.name, "burger sauce");
  assert.equal(fixed.category, "condiments");
});
