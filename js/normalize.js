// Turn free text ("ORG BNNA", "2 cups baby spinach") into a catalog food.
import { FOODS, FOOD_BY_NAME } from "./data/foods.js";

// Common grocery receipt abbreviations, expanded before matching.
const ABBREVIATIONS = {
  org: "", orgnc: "", organic: "", bnls: "boneless", sknls: "skinless", bls: "boneless", skls: "skinless",
  chkn: "chicken", chk: "chicken", brst: "breast", bst: "breast", thgh: "thigh", thghs: "thighs",
  grd: "ground", gr: "ground", bf: "beef", trky: "turkey",
  grn: "green", rd: "red", ylw: "yellow", wht: "white", blk: "black",
  lrg: "large", lg: "large", med: "medium", sm: "small",
  frz: "frozen", frzn: "frozen", fz: "frozen", veg: "vegetables", vegs: "vegetables",
  pnut: "peanut", crm: "cream", sr: "sour", chs: "cheese", mozz: "mozzarella",
  tom: "tomato", toms: "tomatoes", pot: "potato", pots: "potatoes",
  swt: "sweet", btr: "butter", brd: "bread", mlk: "milk",
  cocnt: "coconut", bns: "beans", bn: "bean",
};

// Words that describe packaging or quality, never the food itself.
const NOISE = new Set([
  "fresh", "pkg", "pk", "pack", "bag", "btl", "bottle", "can", "cans", "jar", "box", "ea", "each",
  "lb", "lbs", "kg", "g", "gr", "oz", "ml", "l", "ct", "dz", "doz", "dozen", "bunch", "value", "brand",
  "family", "size", "club", "store", "pc", "pcs", "lt", "ltr", "x", "and", "of", "the",
  "free", "range", "natural", "grade", "a", "aa", "no", "name", "kirkland", "great", "selection",
]);

export function cleanText(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/[^a-z0-9%\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function expand(text) {
  return cleanText(text)
    .split(" ")
    .map((w) => (w in ABBREVIATIONS ? ABBREVIATIONS[w] : w))
    .filter((w) => w && !NOISE.has(w) && !/^\d+(\.\d+)?$/.test(w))
    .join(" ");
}

function singular(word) {
  if (word.length > 4 && word.endsWith("ies")) return word.slice(0, -3) + "y";
  if (word.length > 4 && word.endsWith("oes")) return word.slice(0, -2);
  if (word.length > 3 && word.endsWith("s") && !word.endsWith("ss")) return word.slice(0, -1);
  return word;
}

function singularPhrase(text) {
  return text.split(" ").map(singular).join(" ");
}

// Every phrase we can match on, longest first so "sweet potato" beats "potato"
// and "red pepper" beats "pepper".
const PHRASES = FOODS.flatMap((food) =>
  [food.name, ...food.aliases].map((p) => ({ phrase: singularPhrase(cleanText(p)), food }))
).sort((a, b) => b.phrase.length - a.phrase.length);

function containsPhrase(haystack, phrase) {
  return ` ${haystack} `.includes(` ${phrase} `);
}

/** Find the catalog food mentioned in `text`, or null if none is recognised. */
export function matchFood(text) {
  const raw = singularPhrase(cleanText(text));
  const expanded = singularPhrase(expand(text));
  if (!raw && !expanded) return null;
  for (const { phrase, food } of PHRASES) {
    if (containsPhrase(expanded, phrase) || containsPhrase(raw, phrase)) return food;
  }
  return null;
}

/** The typed text, tidied (lower case, receipt shorthand expanded, packaging words dropped). */
export function tidyName(text) {
  return expand(text) || cleanText(text);
}

/** Lower case, punctuation-free and singular, for forgiving searches ("Wings" finds "chicken wing"). */
export function searchText(text) {
  return singularPhrase(cleanText(text));
}

// Words that describe how a food is prepared or sized, not what it is.
const DESCRIPTORS = new Set([
  "boneless", "skinless", "large", "small", "medium", "chopped", "diced", "sliced", "minced", "grated",
  "shredded", "ripe", "raw", "cooked", "whole", "baby", "fresh", "frozen", "peeled", "crushed", "finely",
  "roughly", "thinly", "about", "cup", "cups", "clove", "cloves", "piece", "pieces",
]);

/**
 * Name for an ingredient someone typed on purpose (the recipe editor): the catalog
 * name when the text means exactly that food, otherwise their own words, so
 * "chicken wings" never quietly turns into "chicken".
 */
export function typedName(text) {
  const food = matchFood(text);
  const words = singularPhrase(expand(text)).split(" ").filter((w) => w && !DESCRIPTORS.has(w));
  if (!food) return expand(text) || cleanText(text);
  const known = new Set([food.name, ...food.aliases].flatMap((p) => singularPhrase(cleanText(p)).split(" ")));
  return words.every((w) => known.has(w)) ? food.name : words.join(" ");
}

/** Canonical name for anything typed by the user, falling back to a tidy version of their text. */
export function canonicalName(text) {
  const food = matchFood(text);
  if (food) return food.name;
  return expand(text) || cleanText(text);
}

export function foodInfo(name) {
  return FOOD_BY_NAME.get(name) || null;
}

/** Does an inventory item called `have` satisfy a recipe ingredient called `need`? */
export function satisfies(have, need) {
  if (have === need) return true;
  const info = FOOD_BY_NAME.get(have);
  return Boolean(info && info.parent === need);
}

export function titleCase(text) {
  return String(text).replace(/\b[a-z]/g, (c) => c.toUpperCase());
}
