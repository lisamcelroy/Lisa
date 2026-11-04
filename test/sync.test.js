import { test } from "node:test";
import assert from "node:assert/strict";
import { toSynced, adoptRemote, mergeOnLoad } from "../js/store.js";

const base = (over = {}) => ({
  inventory: [], shopping: [], customRecipes: [], favorites: [], ideas: { key: "", recipes: [] },
  settings: { assumeStaples: true, apiKey: "sk-secret", useClaude: true }, updatedAt: 0, ...over,
});

test("the API key is never part of the saved copy", () => {
  const out = toSynced(base({ updatedAt: 5 }));
  assert.equal(out.settings.apiKey, undefined);
  assert.equal(out.updatedAt, 5);
});

test("adopting a saved copy keeps this device's API key", () => {
  const next = adoptRemote(base(), { inventory: [{ id: "a", name: "egg" }], settings: { assumeStaples: false }, updatedAt: 9 });
  assert.equal(next.inventory[0].name, "egg");
  assert.equal(next.settings.apiKey, "sk-secret");
  assert.equal(next.settings.assumeStaples, false);
  assert.equal(next.updatedAt, 9);
});

test("first load restores the saved kitchen and keeps only items added since opening", () => {
  const local = base({
    inventory: [
      { id: "old", name: "stale milk", addedAt: 100 },
      { id: "new", name: "spinach", addedAt: 2000 },
    ],
    updatedAt: 2000,
  });
  const remote = { inventory: [{ id: "r1", name: "egg", addedAt: 50 }], shopping: [], customRecipes: [], updatedAt: 1500 };
  const merged = mergeOnLoad(local, remote, 1000);
  assert.deepEqual(merged.inventory.map((i) => i.id), ["r1", "new"]);
});

import { toKitchen, adoptKitchen, toPersonal, adoptSettings, newHouseholdCode, cleanCode, showCode } from "../js/store.js";

test("a shared kitchen shares the kitchen but each person keeps their own name", () => {
  const lisa = { updatedAt: 5, inventory: [{ name: "milk", category: "dairy" }], plan: { "2026-11-04": {} }, family: [{ name: "Lisa" }], settings: { name: "Lisa", nameAsked: true, apiKey: "secret", mealTimes: { weekday: {} }, assumeStaples: true } };
  const kitchen = toKitchen(lisa);
  assert.equal(kitchen.settings, undefined, "no personal settings in the shared copy");
  assert.deepEqual(kitchen.shared, { mealTimes: { weekday: {} }, assumeStaples: true });
  const andrey = { updatedAt: 1, inventory: [], settings: { name: "Andrey", nameAsked: true, apiKey: "" } };
  const joined = adoptKitchen(andrey, kitchen);
  assert.equal(joined.settings.name, "Andrey");
  assert.equal(joined.inventory[0].name, "milk");
  assert.deepEqual(joined.settings.mealTimes, { weekday: {} });
  const mine = toPersonal(lisa);
  assert.equal(mine.inventory, undefined);
  assert.equal(mine.settings.apiKey, undefined, "API key never leaves the device");
  assert.equal(adoptSettings(andrey, { settings: { name: "Andy" } }).settings.name, "Andy");
});

test("share codes are easy to read and type", () => {
  const code = newHouseholdCode();
  assert.match(code, /^[A-HJ-NP-Z2-9]{8}$/);
  assert.equal(cleanCode("k7qm - 2xpd"), "K7QM2XPD");
  assert.equal(showCode("K7QM2XPD"), "K7QM-2XPD");
});
