import { test } from "node:test";
import assert from "node:assert/strict";
import { matchFood, canonicalName, satisfies } from "../js/normalize.js";

test("matches plain and plural names", () => {
  assert.equal(matchFood("eggs").name, "egg");
  assert.equal(matchFood("Tomatoes").name, "tomato");
  assert.equal(matchFood("baby spinach").name, "spinach");
});

test("expands receipt abbreviations", () => {
  assert.equal(matchFood("ORG BNNA").name, "banana");
  assert.equal(matchFood("CHKN BRST BNLS").name, "chicken breast");
  assert.equal(matchFood("GRD BEEF LEAN").name, "ground beef");
  assert.equal(matchFood("MLK 2% 4L").name, "milk");
});

test("prefers the longest match", () => {
  assert.equal(matchFood("sweet potatoes").name, "sweet potato");
  assert.equal(matchFood("red pepper").name, "bell pepper");
  assert.equal(matchFood("ground pepper").name, "black pepper");
  assert.equal(matchFood("cream cheese").name, "cream cheese");
});

test("unknown text falls back to a tidy name", () => {
  assert.equal(matchFood("paper towels"), null);
  assert.equal(canonicalName("Paper Towels 6pk"), "paper towels 6pk");
});

test("specific foods satisfy generic ingredients", () => {
  assert.ok(satisfies("cheddar", "cheese"));
  assert.ok(satisfies("chicken thigh", "chicken"));
  assert.ok(!satisfies("cheese", "cheddar"));
});

import { typedName, searchText } from "../js/normalize.js";

test("typed ingredient names are kept when they're more specific", () => {
  assert.equal(typedName("chicken wings"), "chicken wing");
  assert.equal(typedName("Chicken Drumsticks"), "chicken drumstick");
  assert.equal(typedName("2 boneless skinless chicken breasts"), "chicken breast");
  assert.equal(typedName("chicken"), "chicken");
  assert.equal(typedName("smoked chicken sausage"), "smoked chicken sausage");
  assert.equal(typedName("dragon fruit"), "dragon fruit");
});

test("search text is forgiving", () => {
  assert.equal(searchText("Wings!"), "wing");
  assert.ok(searchText("Crispy Chicken Wings").includes(searchText("wings")));
});
