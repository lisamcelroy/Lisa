// Local persistence. Everything stays in this browser's localStorage.
import { foodInfo, canonicalName } from "./normalize.js";
import { normalizeUnit } from "./units.js";

const KEY = "fridgemate:v1";
const DAY = 24 * 60 * 60 * 1000;

const DEFAULT_STATE = {
  inventory: [],
  shopping: [],
  customRecipes: [],
  favorites: [],
  settings: { assumeStaples: true, apiKey: "", useClaude: false },
};

function safeParse(raw) {
  try {
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function loadState(storage = globalThis.localStorage) {
  let saved = null;
  try {
    saved = safeParse(storage && storage.getItem(KEY));
  } catch {
    saved = null;
  }
  const state = structuredClone(DEFAULT_STATE);
  if (saved) {
    Object.assign(state, saved);
    state.settings = { ...DEFAULT_STATE.settings, ...(saved.settings || {}) };
  }
  return state;
}

export function saveState(state, storage = globalThis.localStorage) {
  try {
    storage && storage.setItem(KEY, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}

export function newId() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

/**
 * Build an inventory item from loose input. Fills in location, category and
 * an estimated expiry date from the food catalog when the caller doesn't.
 */
export function makeItem({ name, qty = 1, unit = "count", location, category, expiresAt, shelfLife }, now = Date.now()) {
  const canonical = canonicalName(name);
  const info = foodInfo(canonical);
  const days = shelfLife ?? info?.shelfLife;
  return {
    id: newId(),
    name: canonical,
    qty: Number(qty) || 1,
    unit: normalizeUnit(unit) || "count",
    location: location || info?.location || "fridge",
    category: category || info?.category || "other",
    addedAt: now,
    expiresAt: expiresAt ?? (days ? now + days * DAY : null),
  };
}

/** Add items, merging into existing entries with the same name, unit and location. */
export function addToInventory(inventory, items) {
  const next = inventory.map((it) => ({ ...it }));
  for (const item of items) {
    const existing = next.find((it) => it.name === item.name && it.unit === item.unit && it.location === item.location);
    if (existing) {
      existing.qty = Math.round((existing.qty + item.qty) * 100) / 100;
      // A fresh purchase pushes the use-by date out.
      if (item.expiresAt && (!existing.expiresAt || item.expiresAt > existing.expiresAt)) existing.expiresAt = item.expiresAt;
    } else {
      next.push(item);
    }
  }
  return next;
}
