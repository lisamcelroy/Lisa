import { test } from "node:test";
import assert from "node:assert/strict";
import { familyCheck, familyNotes, familyRequest, prefHits, pruneAway } from "../js/family.js";
import { RECIPES } from "../js/data/recipes.js";

const family = [
  { id: "a", name: "Lisa", prefs: [{ food: "mushroom", level: "hates" }] },
  { id: "b", name: "Andrey", prefs: [{ food: "bell pepper", level: "tolerates" }] },
];
const byTitle = (t) => RECIPES.find((r) => r.title === t);

test("a hated required ingredient rules the recipe out", () => {
  const c = familyCheck(byTitle("Creamy Mushroom Pasta"), family);
  assert.equal(c.blocked.length, 1);
  assert.equal(c.blocked[0].who, "Lisa");
});

test("a tolerated ingredient keeps the recipe with a note", () => {
  const c = familyCheck(byTitle("Veggie Omelette"), family);
  assert.equal(c.blocked.length, 0);
  assert.deepEqual(familyNotes(c).map((n) => n.text), ["Keep the bell pepper small or on the side for Andrey"]);
});

test("an optional hated ingredient just gets left out", () => {
  const c = familyCheck({ ingredients: [{ name: "egg" }, { name: "mushroom", optional: true }] }, family);
  assert.equal(c.blocked.length, 0);
  assert.equal(familyNotes(c)[0].text, "Leave out the mushroom for Lisa");
});

test("someone out that day doesn't count, but only that day", () => {
  const away = [{ ...family[0], away: ["2026-11-06"] }, family[1]];
  assert.equal(familyCheck(byTitle("Creamy Mushroom Pasta"), away, "2026-11-06").blocked.length, 0);
  assert.equal(familyCheck(byTitle("Creamy Mushroom Pasta"), away, "2026-11-07").blocked.length, 1);
  assert.doesNotMatch(familyRequest(away, "2026-11-06"), /Lisa/);
});

test("past days out are forgotten", () => {
  assert.deepEqual(pruneAway(["2026-11-01", "2026-11-09", "2026-11-04"], "2026-11-04"), ["2026-11-04", "2026-11-09"]);
});

test("disliking a group covers its members", () => {
  assert.equal(prefHits("cheese", "cheddar"), true);
  assert.equal(prefHits("cheddar", "cheese"), false);
});

test("Claude hears about everyone at the table", () => {
  const line = familyRequest(family);
  assert.match(line, /cooking for Lisa and Andrey/);
  assert.match(line, /hates them: mushroom \(Lisa\)/);
  assert.match(line, /small amounts.*bell pepper \(Andrey\)/);
  assert.equal(familyRequest([]), "");
});

test("allergies and diets rule out ingredients, with the reason", () => {
  const shrimp = RECIPES.find((r) => r.id === "lemon-garlic-shrimp");
  const fam = [{ id: "x", name: "Andrey", allergies: ["shellfish"], prefs: [] }];
  const c = familyCheck(shrimp, fam);
  assert.ok(c.blocked.length);
  assert.match(familyNotes(c)[0].text, /Andrey can't have the shrimp \(shellfish allergy\)/);
  const vegan = [{ id: "v", name: "Lisa", diets: ["vegan"], prefs: [] }];
  assert.ok(familyCheck(byTitle("Veggie Omelette"), vegan).blocked.length, "eggs are not vegan");
  assert.equal(familyCheck(RECIPES.find((r) => r.id === "chickpea-curry"), vegan).blocked.length, 0);
  const keto = [{ id: "k", name: "Lisa", diets: ["keto"], prefs: [] }];
  assert.ok(familyCheck(RECIPES.find((r) => r.id === "spaghetti-bolognese"), keto).blocked.length);
  const gf = [{ id: "g", name: "Lisa", diets: ["glutenfree"], prefs: [] }];
  assert.ok(familyCheck({ ingredients: [{ name: "soy sauce" }] }, gf).blocked.length, "soy sauce has wheat");
  assert.ok(familyCheck({ ingredients: [{ name: "sourdough loaf" }] }, gf).blocked.length, "unknown wheat foods too");
});

test("salt diets give advice instead of hiding recipes", () => {
  const low = [{ id: "s", name: "Lisa", diets: ["lowsalt"], prefs: [] }];
  const c = familyCheck(byTitle("Veggie Omelette"), low);
  assert.equal(c.blocked.length, 0);
  assert.match(familyNotes(c).map((n) => n.text).join(" "), /Low salt for Lisa: skip added salt/);
  const high = [{ id: "h", name: "Andrey", diets: ["highsalt"], prefs: [] }];
  assert.match(familyNotes(familyCheck(byTitle("Veggie Omelette"), high)).map((n) => n.text).join(" "), /High salt for Andrey/);
  assert.match(familyRequest([{ id: "x", name: "Andrey", allergies: ["peanuts"], diets: ["keto"], prefs: [] }]), /Andrey is allergic to peanuts.*Andrey eats keto/);
});

import { toggleAway, outMeals, outLabel } from "../js/family.js";

test("days out can be for one meal or the whole day", () => {
  const fam = [{ id: "a", name: "Lisa", prefs: [{ food: "mushroom", level: "hates" }], away: ["2026-11-06:dinner"] }];
  const pasta = byTitle("Creamy Mushroom Pasta");
  assert.equal(familyCheck(pasta, fam, "2026-11-06", "dinner").blocked.length, 0, "out for dinner");
  assert.equal(familyCheck(pasta, fam, "2026-11-06", "lunch").blocked.length, 1, "home for lunch");
  assert.equal(outLabel(fam[0], "2026-11-06"), "dinner");
  let away = toggleAway([], "2026-11-07", "lunch");
  away = toggleAway(away, "2026-11-07", "dinner");
  assert.equal(outLabel({ away }, "2026-11-07"), "lunch and dinner");
  away = toggleAway(away, "2026-11-07", "breakfast");
  assert.equal(outMeals({ away }, "2026-11-07"), "all", "all three meals is all day");
  away = toggleAway(away, "2026-11-07", "dinner");
  assert.deepEqual(outMeals({ away }, "2026-11-07"), ["breakfast", "lunch"], "taking one meal off an all-day");
  away = toggleAway(away, "2026-11-07", "all");
  assert.equal(outMeals({ away }, "2026-11-07"), "all");
  away = toggleAway(away, "2026-11-07", "all");
  assert.deepEqual(away, []);
  assert.deepEqual(pruneAway(["2026-11-01:dinner", "2026-11-09:lunch"], "2026-11-05"), ["2026-11-09:lunch"]);
});
