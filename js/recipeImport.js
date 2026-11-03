// Turn a pasted recipe ("2 cups flour", "3 eggs, beaten") into a structured recipe.
import { matchFood, canonicalName, cleanText } from "./normalize.js";
import { normalizeUnit, isUnitWord } from "./units.js";

const FRACTIONS = { "½": 0.5, "⅓": 1 / 3, "⅔": 2 / 3, "¼": 0.25, "¾": 0.75, "⅛": 0.125 };
const QTY = /^\s*(\d+\s+\d\/\d|\d+\/\d|\d+(?:[.,]\d+)?|[½⅓⅔¼¾⅛])\s*/;

function parseQty(text) {
  const t = text.trim();
  if (FRACTIONS[t]) return FRACTIONS[t];
  if (/^\d+\s+\d\/\d$/.test(t)) {
    const [whole, frac] = t.split(/\s+/);
    const [n, d] = frac.split("/");
    return +whole + n / d;
  }
  if (/^\d+\/\d$/.test(t)) {
    const [n, d] = t.split("/");
    return n / d;
  }
  return parseFloat(t.replace(",", "."));
}

/** Parse one ingredient line. Returns null for lines that are clearly not ingredients. */
export function parseIngredientLine(line) {
  let text = line.replace(/^[\s\-*•·]+/, "").trim();
  if (!text) return null;

  let qty = 1;
  const q = text.match(QTY);
  if (q) {
    qty = parseQty(q[1]);
    text = text.slice(q[0].length);
  }

  let unit = "count";
  const firstWord = (text.match(/^([a-zA-Z.]+)\s+/) || [])[1];
  if (firstWord && isUnitWord(firstWord)) {
    unit = normalizeUnit(firstWord);
    text = text.slice(firstWord.length).trim();
  }

  const optional = /\b(optional|to taste|for serving|garnish)\b/i.test(text);
  const food = matchFood(text);
  const name = food ? food.name : canonicalName(text.split(",")[0]);
  if (!name) return null;
  return { name, qty, unit, optional, known: Boolean(food), original: line.trim() };
}

/**
 * Split a pasted recipe into title, ingredients and steps.
 * Accepts "Ingredients" / "Directions|Method|Instructions|Steps" headings; without
 * headings, short lines starting with a quantity are treated as ingredients.
 */
export function parseRecipeText(text) {
  const lines = String(text || "").split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  let title = "";
  const ingredientLines = [];
  const steps = [];
  let section = "unknown";

  for (const line of lines) {
    const heading = cleanText(line);
    if (/^ingredients?$/.test(heading)) { section = "ing"; continue; }
    if (/^(directions|method|instructions|steps|preparation)$/.test(heading)) { section = "steps"; continue; }
    if (!title && section === "unknown" && !QTY.test(line)) { title = line; continue; }

    if (section === "ing") ingredientLines.push(line);
    else if (section === "steps") steps.push(line.replace(/^\d+[.)]\s*/, ""));
    else if (QTY.test(line) && line.length < 80) ingredientLines.push(line);
    else steps.push(line.replace(/^\d+[.)]\s*/, ""));
  }

  const ingredients = ingredientLines.map(parseIngredientLine).filter(Boolean);
  return {
    id: "custom-" + Date.now().toString(36),
    title: title || "Imported recipe",
    minutes: 30,
    servings: 2,
    tags: ["mine"],
    ingredients: ingredients.map(({ name, qty, unit, optional }) => ({ name, qty, unit, optional })),
    steps,
    custom: true,
  };
}
