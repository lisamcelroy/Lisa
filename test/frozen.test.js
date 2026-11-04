import { test } from "node:test";
import assert from "node:assert/strict";
import { makeItem } from "../js/store.js";
import { needsDefrost, moveItem, isFrozenText, defrostHint } from "../js/frozen.js";
import { parseReceipt } from "../js/receipt.js";
import { recommend, cookRecipe, daysLeft } from "../js/recommend.js";
import { RECIPES } from "../js/data/recipes.js";

const now = Date.UTC(2026, 10, 4);

test("saying it's frozen puts it in the freezer with a freezer use-by", () => {
  const chicken = makeItem({ name: "frozen chicken breast" }, now);
  assert.equal(chicken.name, "chicken breast");
  assert.equal(chicken.location, "freezer");
  assert.equal(daysLeft(chicken, now), 120);
  assert.ok(needsDefrost(chicken));
  assert.equal(makeItem({ name: "chicken breast" }, now).location, "fridge");
  assert.equal(makeItem({ name: "frozen berries" }, now).location, "freezer");
  assert.ok(isFrozenText("FRZ CHKN BRST"));
  assert.ok(!isFrozenText("fresh salmon"));
});

test("food made to cook from frozen doesn't need defrosting", () => {
  const peas = makeItem({ name: "frozen peas" }, now);
  assert.equal(peas.location, "freezer");
  assert.ok(!needsDefrost(peas));
});

test("defrosting moves it out and shortens the use-by; freezing lengthens it", () => {
  const salmon = makeItem({ name: "frozen salmon" }, now);
  const thawed = moveItem(salmon, "fridge", now);
  assert.equal(thawed.location, "fridge");
  assert.equal(daysLeft(thawed, now), 2);
  assert.equal(thawed.defrostedAt, now);
  assert.ok(!needsDefrost(thawed));
  const refrozen = moveItem(makeItem({ name: "steak" }, now), "freezer", now);
  assert.equal(daysLeft(refrozen, now), 120);
  assert.equal(defrostHint(salmon), "overnight in the fridge");
});

test("receipt lines marked frozen are flagged for the freezer", () => {
  const items = parseReceipt("FRZ CHKN BRST 12.99\nCHKN BRST 9.99\nFROZEN BERRIES 4.99");
  const chicken = items.filter((i) => i.name === "chicken breast");
  assert.equal(chicken.length, 2, "frozen and fresh stay separate");
  assert.deepEqual(chicken.map((c) => c.frozen).sort(), [false, true]);
  assert.ok(items.find((i) => i.name === "berries").frozen);
});

test("recipes say what needs defrosting, and cooking uses unfrozen food first", () => {
  const curry = RECIPES.find((r) => r.id === "chicken-curry");
  const frozenOnly = [makeItem({ name: "frozen chicken thigh" }, now), makeItem({ name: "coconut milk" }, now)];
  const [r] = recommend([curry], frozenOnly, { now });
  assert.deepEqual(r.frozen, ["chicken"]);
  assert.ok(!r.missing.includes("chicken"));
  const both = [...frozenOnly, makeItem({ name: "chicken thigh", qty: 1000, unit: "g" }, now)];
  assert.deepEqual(recommend([curry], both, { now })[0].frozen, []);
  const after = cookRecipe(curry, both).inventory;
  assert.ok(after.some((i) => i.location === "freezer" && i.name === "chicken thigh"), "frozen pack untouched");
});
