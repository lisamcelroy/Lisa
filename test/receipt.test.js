import { test } from "node:test";
import assert from "node:assert/strict";
import { parseReceipt } from "../js/receipt.js";

const SAMPLE = `
FRESHCO #1234
123 MAIN ST
ORG BNNA              1.29
MLK 2% 4L             5.49
CHKN BRST BNLS       12.99
EGGS LRG 12           4.29
BABY SPINACH          3.99
GREEK YOGURT
2 @ 2.50              5.00
TOMATOES 0.85 kg @ 4.39/kg  3.73
PAPER TOWEL           6.99
COUPON               -1.00
SUBTOTAL             43.77
HST                   0.91
TOTAL                44.68
VISA                 44.68
THANK YOU FOR SHOPPING
`;

test("pulls food items out of a receipt and skips totals", () => {
  const items = parseReceipt(SAMPLE);
  const names = items.map((i) => i.name);
  for (const n of ["banana", "milk", "chicken breast", "egg", "spinach", "yogurt", "tomato"]) {
    assert.ok(names.includes(n), `expected ${n} in ${names.join(", ")}`);
  }
  assert.ok(!names.some((n) => /total|visa|hst|thank|coupon/i.test(n)));
});

test("reads multi-buy quantities and weights", () => {
  const items = parseReceipt(SAMPLE);
  assert.equal(items.find((i) => i.name === "yogurt").qty, 2);
  const tom = items.find((i) => i.name === "tomato");
  assert.equal(tom.qty, 0.85);
  assert.equal(tom.unit, "kg");
});

test("keeps unrecognised lines flagged for review", () => {
  const towel = parseReceipt(SAMPLE).find((i) => /paper/i.test(i.name));
  assert.ok(towel);
  assert.equal(towel.food, null);
});

test("merges repeated items", () => {
  const items = parseReceipt("BANANA 1.00\nBANANA 1.00");
  assert.equal(items.length, 1);
  assert.equal(items[0].qty, 2);
});
