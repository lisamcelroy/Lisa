// Rank recipes by how well they fit what is in the fridge and pantry.
import { FOOD_BY_NAME } from "./data/foods.js";
import { satisfies } from "./normalize.js";
import { subtract } from "./units.js";
import { needsDefrost } from "./frozen.js";

const DAY = 24 * 60 * 60 * 1000;
export const SOON_DAYS = 3;

export function daysLeft(item, now = Date.now()) {
  if (!item.expiresAt) return Infinity;
  return Math.ceil((item.expiresAt - now) / DAY);
}

function isStaple(name) {
  const food = FOOD_BY_NAME.get(name);
  return Boolean(food && food.staple);
}

/**
 * @param {Array} recipes
 * @param {Array} inventory  items with {name, qty, unit, expiresAt}
 * @param {object} opts      {assumeStaples=true, now}
 * @returns sorted array of {recipe, have, missing, optionalHave, usesSoon, coverage, score}
 */
export function recommend(recipes, inventory, { assumeStaples = true, now = Date.now() } = {}) {
  const stocked = inventory.filter((it) => !(it.qty <= 0));

  const results = recipes.map((recipe) => {
    const have = [];
    const missing = [];
    const optionalHave = [];
    const usesSoon = new Set();
    const frozen = []; // required ingredients we only have frozen

    for (const ing of recipe.ingredients) {
      const matches = stocked.filter((it) => satisfies(it.name, ing.name));
      const staple = isStaple(ing.name);
      if (matches.length) {
        (ing.optional ? optionalHave : have).push(ing.name);
        for (const m of matches) if (daysLeft(m, now) <= SOON_DAYS && !needsDefrost(m)) usesSoon.add(m.name);
        if (!ing.optional && matches.every(needsDefrost)) frozen.push(ing.name);
      } else if (staple && assumeStaples) {
        // treated as on hand; not counted either way
      } else if (!ing.optional) {
        missing.push(ing.name);
      }
    }

    const needed = have.length + missing.length;
    const coverage = needed ? have.length / needed : 0;
    // Fewer missing items first, then recipes that rescue food about to spoil,
    // then overall coverage, with a small nudge for optional extras on hand.
    const score =
      coverage * 100 - missing.length * 15 + usesSoon.size * 12 + optionalHave.length * 2 - frozen.length * 4 + (have.length ? 0 : -100);

    return { recipe, have, missing, optionalHave, usesSoon: [...usesSoon], frozen, coverage, score };
  });

  return results.sort((a, b) => b.score - a.score || a.recipe.minutes - b.recipe.minutes);
}

/**
 * Remove a recipe's ingredients from the inventory.
 * Returns {inventory, unchanged} where unchanged lists names whose units could not be compared.
 */
export function cookRecipe(recipe, inventory, servingsFactor = 1) {
  const next = inventory.map((it) => ({ ...it }));
  const unchanged = [];

  for (const ing of recipe.ingredients) {
    if (isStaple(ing.name)) continue;
    // Prefer the item that expires first.
    const candidates = next
      .filter((it) => satisfies(it.name, ing.name) && it.qty > 0)
      .sort((a, b) => needsDefrost(a) - needsDefrost(b) || (a.expiresAt || Infinity) - (b.expiresAt || Infinity));
    if (!candidates.length) continue;
    const item = candidates[0];
    const left = subtract(item.qty, item.unit, ing.qty * servingsFactor, ing.unit);
    if (left === null) unchanged.push(item.name);
    else item.qty = Math.max(0, left);
  }

  return { inventory: next.filter((it) => it.qty > 0), unchanged };
}
