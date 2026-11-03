// Small unit helper so cooking a recipe can subtract from what is in stock.

const UNIT_ALIASES = {
  "": "count", ea: "count", each: "count", pc: "count", pcs: "count", piece: "count", pieces: "count",
  ct: "count", whole: "count", clove: "count", cloves: "count", count: "count",
  g: "g", gram: "g", grams: "g", gr: "g",
  kg: "kg", kilo: "kg", kilos: "kg", kilogram: "kg", kilograms: "kg",
  lb: "lb", lbs: "lb", pound: "lb", pounds: "lb",
  oz: "oz", ounce: "oz", ounces: "oz",
  ml: "ml", milliliter: "ml", milliliters: "ml", millilitre: "ml", millilitres: "ml",
  l: "l", liter: "l", liters: "l", litre: "l", litres: "l", lt: "l", ltr: "l",
  cup: "cup", cups: "cup", c: "cup",
  tbsp: "tbsp", tablespoon: "tbsp", tablespoons: "tbsp", tbs: "tbsp",
  tsp: "tsp", teaspoon: "tsp", teaspoons: "tsp",
  can: "can", cans: "can", tin: "can",
  pkg: "pkg", pack: "pkg", package: "pkg", packages: "pkg", bag: "pkg", box: "pkg",
  bunch: "bunch", bunches: "bunch", head: "head", heads: "head",
  dozen: "dozen", dz: "dozen", doz: "dozen",
  slice: "slice", slices: "slice",
};

// Base unit and factor for each family.
const FAMILY = {
  count: ["count", 1], dozen: ["count", 12],
  g: ["g", 1], kg: ["g", 1000], lb: ["g", 453.6], oz: ["g", 28.35],
  ml: ["ml", 1], l: ["ml", 1000], cup: ["ml", 240], tbsp: ["ml", 15], tsp: ["ml", 5],
};

export function normalizeUnit(unit) {
  const key = String(unit || "").toLowerCase().replace(/\./g, "").trim();
  return UNIT_ALIASES[key] || key;
}

export function isUnitWord(word) {
  const key = String(word || "").toLowerCase().replace(/\./g, "").trim();
  return key !== "" && key in UNIT_ALIASES;
}

export const UNIT_CHOICES = ["count", "g", "kg", "lb", "oz", "ml", "l", "cup", "tbsp", "tsp", "can", "pkg", "bunch", "head", "slice"];

/**
 * Subtract `amount useUnit` from `stock stockUnit`.
 * Returns the remaining amount in the stock unit, or null when the units can't be compared.
 */
export function subtract(stock, stockUnit, amount, useUnit) {
  const su = normalizeUnit(stockUnit);
  const uu = normalizeUnit(useUnit);
  if (su === uu) return round(stock - amount);
  const a = FAMILY[su];
  const b = FAMILY[uu];
  if (!a || !b || a[0] !== b[0]) return null;
  return round((stock * a[1] - amount * b[1]) / a[1]);
}

function round(n) {
  return Math.round(n * 100) / 100;
}

export function formatQty(qty, unit) {
  const u = normalizeUnit(unit);
  const q = Number.isFinite(qty) ? +qty.toFixed(2) : "";
  if (u === "count") return `${q}`;
  return `${q} ${u}`;
}
