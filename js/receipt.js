// Parse grocery receipt text (from OCR or pasted) into pantry items.
import { matchFood, cleanText, titleCase } from "./normalize.js";
import { normalizeUnit } from "./units.js";

// Lines containing any of these are totals, payment or store chatter, not groceries.
const SKIP_WORDS = [
  "subtotal", "sub total", "total", "tax", "hst", "gst", "pst", "vat", "visa", "mastercard", "amex", "debit",
  "credit", "cash", "change", "balance", "tender", "payment", "approved", "auth", "card", "account",
  "thank", "welcome", "store", "receipt", "cashier", "register", "member", "points", "savings", "you saved",
  "discount", "coupon", "rewards", "loyalty", "phone", "tel", "www", "http", ".com", "survey", "return",
  "items sold", "item count", "transaction", "trans", "terminal", "invoice", "date", "time", "ref", "deposit",
  "bottle dep", "eco fee", "env fee", "bag fee", "refund", "manager", "open", "hours",
];

const escapeRe = (w) => w.replace(/[.*+?^$()|[\]\\{}]/g, "\\$&");
const SKIP_PATTERN = new RegExp("(^|[^a-z])(" + SKIP_WORDS.map(escapeRe).join("|") + ")([^a-z]|$)");

const PRICE_AT_END = /(-?\$?\s?\d{1,4}[.,]\d{2})\s*[a-z*]{0,3}\s*$/i;
const MULTI_QTY = /\b(\d{1,3})\s*(?:@|x|for)\s*\$?\d+[.,]\d{2}/i;
const WEIGHT = /(\d+(?:[.,]\d+)?)\s*(kg|lb|lbs|g)\b/i;
const LEADING_QTY = /^(\d{1,2})\s+(?=[a-z])/i;

function isSkippable(line) {
  const lower = line.toLowerCase();
  if (SKIP_PATTERN.test(lower)) return true;
  const letters = (lower.match(/[a-z]/g) || []).length;
  return letters < 3;
}

/**
 * @param {string} text  raw receipt text, one item per line
 * @returns {Array<{raw:string,name:string,qty:number,unit:string,price:number|null,food:object|null}>}
 */
export function parseReceipt(text) {
  const lines = String(text || "").split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const items = [];

  for (let i = 0; i < lines.length; i++) {
    const original = lines[i];
    let line = original;
    if (isSkippable(line)) continue;

    let qty = 1;
    let unit = "count";
    let price = null;

    // A quantity line printed underneath the item ("2 @ 1.99") applies to the previous item.
    const next = lines[i + 1] || "";
    const nextMulti = next.match(MULTI_QTY);
    if (nextMulti && cleanText(next.replace(MULTI_QTY, "")).replace(/[\d.\s]/g, "").length < 3) {
      qty = parseInt(nextMulti[1], 10);
      i++;
    }

    const priceMatch = line.match(PRICE_AT_END);
    if (priceMatch) {
      price = parseFloat(priceMatch[1].replace(/[$\s]/g, "").replace(",", "."));
      line = line.slice(0, priceMatch.index).trim();
    }
    if (price !== null && price < 0) continue; // discount line

    const multi = line.match(MULTI_QTY);
    if (multi) {
      qty = parseInt(multi[1], 10);
      line = line.replace(MULTI_QTY, " ");
    }

    const weight = line.match(WEIGHT);
    if (weight) {
      qty = parseFloat(weight[1].replace(",", "."));
      unit = normalizeUnit(weight[2]);
      line = line.replace(WEIGHT, " ").replace(/@.*$/, " ");
    }

    // Strip SKU / PLU codes (long digit runs) and stray symbols.
    line = line.replace(/\b\d{4,}\b/g, " ").replace(/[*#]/g, " ").trim();

    const lead = line.match(LEADING_QTY);
    if (lead && !weight && !multi && !nextMulti) {
      qty = parseInt(lead[1], 10);
      line = line.slice(lead[0].length);
    }

    const label = cleanText(line);
    if (label.replace(/[^a-z]/g, "").length < 3) continue;

    const food = matchFood(label);
    items.push({
      raw: original,
      name: food ? food.name : titleCase(label),
      qty,
      unit,
      price,
      food,
    });
  }

  return mergeDuplicates(items);
}

function mergeDuplicates(items) {
  const out = [];
  for (const item of items) {
    const same = item.food && out.find((o) => o.food === item.food && o.unit === item.unit);
    if (same) {
      same.qty += item.qty;
      if (item.price !== null) same.price = (same.price || 0) + item.price;
    } else {
      out.push({ ...item });
    }
  }
  return out;
}
