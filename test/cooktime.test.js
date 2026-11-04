import { test } from "node:test";
import assert from "node:assert/strict";
import { fitsTime, isQuickPrep, isHandsOff, todaysChoice, timeRequest } from "../js/cooktime.js";
import { RECIPES } from "../js/data/recipes.js";

const byId = (id) => RECIPES.find((r) => r.id === id);

test("time limit uses total minutes", () => {
  assert.equal(fitsTime(byId("veggie-omelette"), { max: 15 }), true);
  assert.equal(fitsTime(byId("spaghetti-bolognese"), { max: 30 }), false);
  assert.equal(fitsTime(byId("spaghetti-bolognese"), { max: Infinity }), true);
});

test("quick prep is selective", () => {
  const n = RECIPES.filter(isQuickPrep).length;
  assert.ok(n >= 5 && n <= 14, `quick prep matched ${n}`);
  assert.equal(isQuickPrep(byId("cheese-quesadillas") || RECIPES.find((r) => r.title === "Cheese Quesadillas")), true);
  assert.equal(isQuickPrep(RECIPES.find((r) => r.title === "Minestrone")), false);
});

test("hands-off means the oven, pot or fridge does the work", () => {
  assert.equal(isHandsOff(byId("overnight-oats")), true);
  assert.equal(isHandsOff(byId("banana-pancakes")), false, "baking powder is not baking");
  assert.equal(fitsTime(byId("overnight-oats"), { max: 15, prep: ["handsoff"] }), true);
});

test("the choice only lasts for today", () => {
  const saved = { day: "2026-11-04", time: "30", prep: ["quickprep", "bogus"] };
  assert.deepEqual(todaysChoice(saved, "2026-11-04"), { time: "30", max: 30, label: "30 min", prep: ["quickprep"] });
  assert.equal(todaysChoice(saved, "2026-11-05"), null);
  assert.equal(todaysChoice(null, "2026-11-04"), null);
});

test("Claude is told the time limit", () => {
  assert.match(timeRequest({ max: 30, label: "30 min", prep: [] }), /30 minutes or less/);
  assert.equal(timeRequest({ max: Infinity, label: "No rush", prep: [] }), "");
  assert.equal(timeRequest(null), "");
});
