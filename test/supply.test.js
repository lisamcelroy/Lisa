import { test } from "node:test";
import assert from "node:assert/strict";
import { groceryOutlook, freshDaysLeft, dayWord } from "../js/supply.js";

const now = new Date(2026, 10, 4, 10); // Wednesday morning
const day = 864e5;
const item = (name, category, days, location = "fridge") => ({ name, category, location, expiresAt: now.getTime() + days * day });

test("a well stocked kitchen isn't short", () => {
  const inv = [item("milk", "dairy", 7), item("egg", "dairy", 20), item("spinach", "produce", 6), item("chicken", "meat", 5), item("carrot", "produce", 14), item("cheese", "dairy", 20)];
  const o = groceryOutlook(inv, { now, readyCount: 6 });
  assert.equal(o.short, false);
  assert.equal(freshDaysLeft(inv, now), 7);
  assert.equal(dayWord(o.shopDay, now), "Tuesday");
});

test("running low suggests shopping soon and a cheat day before it", () => {
  const inv = [item("milk", "dairy", 2), item("egg", "dairy", 20), item("rice", "grains", 300, "pantry")];
  const o = groceryOutlook(inv, { now, readyCount: 1 });
  assert.equal(o.short, true);
  assert.equal(dayWord(o.shopDay, now), "today");
  assert.equal(dayWord(o.cheatDay, now), "today");
  assert.match(o.reasons.join(", "), /only 1 meal/);
});

test("shop the day before a planned meal that needs ingredients", () => {
  const inv = [item("milk", "dairy", 9), item("egg", "dairy", 20), item("spinach", "produce", 9), item("carrot", "produce", 14), item("cheese", "dairy", 20)];
  const o = groceryOutlook(inv, { now, readyCount: 5, missingDays: ["2026-11-07"] });
  assert.equal(dayWord(o.shopDay, now), "Friday");
  assert.equal(o.cheatDay, null, "plenty to cook, no cheat day needed");
});

test("no cheat day when dinner is already planned that night", () => {
  const inv = [item("milk", "dairy", 1)];
  const o = groceryOutlook(inv, { now, readyCount: 0, plannedDinners: ["2026-11-04"] });
  assert.equal(o.cheatDay, null);
});

test("late at night the shopping day moves to tomorrow", () => {
  const late = new Date(2026, 10, 4, 21);
  const o = groceryOutlook([item("milk", "dairy", 0.2)], { now: late, readyCount: 0 });
  assert.equal(dayWord(o.shopDay, late), "tomorrow");
});
