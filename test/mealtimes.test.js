import { test } from "node:test";
import assert from "node:assert/strict";
import { timesFor, mealStart, currentMeal } from "../js/mealtimes.js";
import { defrostHours, takeOutBy } from "../js/frozen.js";

const wed = new Date(2026, 10, 4, 10, 0); // a Wednesday
const sat = new Date(2026, 10, 7, 10, 0);

test("weekday and weekend times differ, and a single day can be changed", () => {
  assert.deepEqual(timesFor(undefined, wed).breakfast, ["07:00", "08:30"]);
  assert.deepEqual(timesFor(undefined, sat).breakfast, ["09:00", "10:30"]);
  const saved = { days: { 6: { breakfast: ["10:00", "11:30"] } } };
  assert.deepEqual(timesFor(saved, sat).breakfast, ["10:00", "11:30"]);
  assert.deepEqual(timesFor(saved, sat).dinner, ["18:00", "19:30"], "other meals keep weekend times");
});

test("the current meal follows your times", () => {
  assert.equal(currentMeal(undefined, wed), "lunch", "10am on a weekday is after breakfast");
  assert.equal(currentMeal(undefined, sat), "breakfast", "10am on Saturday is still breakfast");
  assert.equal(currentMeal(undefined, new Date(2026, 10, 4, 21)), "dinner");
});

test("take frozen food out in time for the meal", () => {
  assert.equal(defrostHours({ name: "chicken breast", category: "meat" }), 24);
  assert.equal(defrostHours({ name: "shrimp", category: "seafood" }), 8);
  assert.equal(defrostHours({ name: "bread", category: "bakery" }), 2);
  const dinner = mealStart(undefined, "2026-11-05", "dinner"); // Thursday 6pm
  const t = takeOutBy([{ name: "chicken breast", category: "meat" }], dinner, wed);
  assert.equal(t.by.getDate(), 4);
  assert.equal(t.by.getHours(), 18, "6pm the day before");
  assert.equal(t.late, false);
  assert.equal(takeOutBy([{ name: "chicken breast", category: "meat" }], mealStart(undefined, "2026-11-04", "dinner"), wed).late, true);
});
