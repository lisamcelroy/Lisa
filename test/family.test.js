import { test } from "node:test";
import assert from "node:assert/strict";
import { familyCheck, familyNotes, familyRequest, prefHits } from "../js/family.js";
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

test("someone not eating today doesn't count", () => {
  const away = [{ ...family[0], home: false }, family[1]];
  assert.equal(familyCheck(byTitle("Creamy Mushroom Pasta"), away).blocked.length, 0);
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
