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
