// Frozen food: anything kept in the freezer is frozen, and frozen food has to be
// defrosted before it can be cooked. The exception is food sold to be cooked
// straight from frozen (the catalog's "frozen" category: peas, corn, mixed veg).
import { FOOD_BY_NAME } from "./data/foods.js";

const DAY = 24 * 60 * 60 * 1000;

/** Roughly how long food keeps in the freezer, by category (days). */
export const FREEZER_DAYS = {
  meat: 120, seafood: 90, protein: 120, dairy: 120, bakery: 90, produce: 240,
  grains: 180, canned: 90, condiments: 90, frozen: 240,
};

/** How long food keeps in the fridge once defrosted, by category (days). */
export const DEFROST_DAYS = {
  meat: 2, seafood: 2, protein: 3, dairy: 5, bakery: 4, produce: 3, frozen: 3,
};

/** Does this text say the food is frozen? ("frozen salmon", receipt shorthand "FRZ CHKN") */
export function isFrozenText(text) {
  return /\b(frozen|frzn|frz|fz)\b/i.test(String(text || ""));
}

/** Can this food be cooked straight from frozen? */
export function cooksFromFrozen(name) {
  return FOOD_BY_NAME.get(name)?.category === "frozen";
}

/** Is this inventory item frozen and needing to be defrosted before use? */
export function needsDefrost(item) {
  return item?.location === "freezer" && !cooksFromFrozen(item.name);
}

/** Plain-language advice for defrosting an item. */
export function defrostHint(item) {
  const c = item.category || FOOD_BY_NAME.get(item.name)?.category;
  if (c === "meat" || c === "seafood") return "overnight in the fridge";
  if (c === "bakery") return "about an hour on the counter, or toast from frozen";
  return "a few hours in the fridge";
}

/** Where an item goes once defrosted. */
export function defrostTo(item) {
  const c = item.category || FOOD_BY_NAME.get(item.name)?.category;
  return c === "bakery" ? "pantry" : "fridge";
}

export function freezerDays(name, category) {
  const info = FOOD_BY_NAME.get(name);
  if (info?.location === "freezer") return info.shelfLife;
  return FREEZER_DAYS[category || info?.category] ?? 180;
}

/**
 * Move an item to another place, updating its use-by date:
 * into the freezer it keeps for months; out of the freezer it is defrosted
 * and keeps only a few days.
 */
export function moveItem(item, to, now = Date.now()) {
  if (!item || item.location === to) return item;
  const info = FOOD_BY_NAME.get(item.name);
  const category = item.category || info?.category;
  const next = { ...item, location: to };
  if (to === "freezer") {
    next.expiresAt = now + freezerDays(item.name, category) * DAY;
    delete next.defrostedAt;
  } else if (item.location === "freezer") {
    const days = Math.min(info?.location === "freezer" ? Infinity : info?.shelfLife ?? Infinity, DEFROST_DAYS[category] ?? 3);
    next.expiresAt = now + days * DAY;
    next.defrostedAt = now;
  }
  return next;
}
