// Local persistence. Everything stays in this browser's localStorage.
import { foodInfo, canonicalName, tidyName, searchText, SAUCE_WORDS } from "./normalize.js";
import { VARIETY_GROUPS } from "./data/foods.js";
import { normalizeUnit } from "./units.js";
import { isFrozenText, freezerDays } from "./frozen.js";
import { guessFood } from "./data/guess.js";

// Storage name kept from the app's first name so existing kitchens still load.
const KEY = "fridgemate:v1";
const DAY = 24 * 60 * 60 * 1000;

const DEFAULT_STATE = {
  inventory: [],
  shopping: [],
  customRecipes: [],
  plan: {},
  favorites: [],
  family: [],
  settings: { assumeStaples: true, apiKey: "", useClaude: false },
};

function safeParse(raw) {
  try {
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * Items saved as "other" before the app knew better (asparagus, oat milk...)
 * get their proper category, so they move to the right shelf.
 */
export function recategorize(inventory = []) {
  return inventory.map((it) => {
    // A sauce filed as something else ("burger sauce" as burger patties) becomes a sauce.
    const shown = it.label || it.name;
    if (SAUCE_WORDS.test(shown) && !["condiments", "canned"].includes(it.category)) {
      const { label, ...rest } = it;
      return { ...rest, name: tidyName(shown), category: "condiments" };
    }
    const known = foodInfo(it.name) || foodInfo(canonicalName(it.name));
    // A catalog food always uses the catalog's category (fixes earlier wrong guesses).
    if (known && known.category !== it.category) return { ...it, category: known.category };
    if (it.category && it.category !== "other") return it;
    const better = guessFood(it.name)?.category;
    return better ? { ...it, category: better } : it;
  });
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
    state.inventory = recategorize(state.inventory);
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
export function makeItem({ name, qty = 1, unit = "count", location, category, expiresAt, shelfLife, keepName = false }, now = Date.now()) {
  // keepName: use the name exactly as given (e.g. a seasoning the catalog doesn't know, like "za'atar").
  // "Beyond burger", "veggie nuggets": plant-based, so never filed as the meat they imitate.
  const plant = /\b(veggie|plant[- ]based|meatless|vegan|beyond|impossible)\b/i.test(String(name));
  let canonical = keepName ? String(name).trim() : canonicalName(name);
  if (plant && ["meat", "seafood"].includes(foodInfo(canonical)?.category)) canonical = tidyName(name);
  const info = foodInfo(canonical);
  // Not in the catalog: work it out from the name ("purple kohlrabi" is a vegetable).
  const guess = info ? null : guessFood(canonical);
  const cat = category || info?.category || guess?.category || "other";
  // Saying it's frozen ("frozen salmon", receipt "FRZ") puts it in the freezer.
  const loc = location || (isFrozenText(name) ? "freezer" : info?.location || guess?.location || "fridge");
  const days = shelfLife ?? (loc === "freezer" ? freezerDays(canonical, cat) : info?.shelfLife ?? guess?.shelfLife);
  // "oat milk" is stored as plant milk for recipes, but keeps its own name on screen.
  const typed = tidyName(name).replace(/\bfrozen\b/g, "").replace(/\s+/g, " ").trim().replace(/\bbbq\b/g, "BBQ");
  const label = !keepName && info && VARIETY_GROUPS.has(info.name) && typed && searchText(typed) !== searchText(canonical) ? typed : undefined;
  return {
    id: newId(),
    name: canonical,
    ...(label ? { label } : {}),
    qty: Number(qty) || 1,
    unit: normalizeUnit(unit) || "count",
    location: loc,
    category: cat,
    addedAt: now,
    expiresAt: expiresAt ?? (days ? now + days * DAY : null),
  };
}

/** Add items, merging into existing entries with the same name, unit and location. */
export function addToInventory(inventory, items) {
  const next = inventory.map((it) => ({ ...it }));
  for (const item of items) {
    const existing = next.find((it) => it.name === item.name && (it.label || "") === (item.label || "") && it.unit === item.unit && it.location === item.location);
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

// ---------- Account sync helpers ----------

const SYNCED_KEYS = ["inventory", "shopping", "customRecipes", "favorites", "ideas", "plan", "family", "defrostLog", "recipeFeedback"];

/** The part of the state saved to the person's account. The API key never leaves this device. */
export function toSynced(state) {
  const out = { updatedAt: state.updatedAt || 0 };
  for (const k of SYNCED_KEYS) if (state[k] !== undefined) out[k] = state[k];
  const { apiKey, ...settings } = state.settings || {};
  out.settings = settings;
  return out;
}

/** Replace the synced part of `local` with `remote`, keeping device-only settings. */
export function adoptRemote(local, remote) {
  const next = { ...local };
  for (const k of SYNCED_KEYS) if (remote[k] !== undefined) next[k] = remote[k];
  next.settings = { ...local.settings, ...(remote.settings || {}), apiKey: local.settings?.apiKey || "" };
  next.updatedAt = remote.updatedAt || 0;
  next.inventory = recategorize(next.inventory);
  return next;
}

/**
 * First load on a device whose local copy may be stale or empty: start from the
 * saved copy and keep only entries added on this device since `since`
 * (things the person added before the saved copy finished loading).
 */
export function mergeOnLoad(local, remote, since) {
  const next = adoptRemote(local, remote);
  for (const k of ["inventory", "shopping", "customRecipes"]) {
    const have = new Set((next[k] || []).map((x) => x.id));
    const fresh = (local[k] || []).filter((x) => x && !have.has(x.id) && (x.addedAt || 0) >= since);
    if (fresh.length) next[k] = [...(next[k] || []), ...fresh];
  }
  return next;
}
