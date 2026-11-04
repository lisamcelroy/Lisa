// Are groceries running low? Works out a suggested shopping day and, when there's
// not much left to cook, a cheat day (order in or eat out) to bridge the gap.
// Pure so it can be tested: pass in what the app already knows.

const DAY = 864e5;
const PERISHABLE = new Set(["produce", "meat", "seafood", "dairy", "bakery", "protein"]);

const startOf = (d) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };
const addDays = (d, n) => { const x = startOf(d); x.setDate(x.getDate() + n); return x; };

/** Fresh food (fridge, counter) that hasn't gone off. */
export function freshItems(inventory, now = new Date()) {
  return inventory.filter((it) => it.location !== "freezer" && PERISHABLE.has(it.category) && (!it.expiresAt || it.expiresAt >= now.getTime()));
}

/**
 * About how many days until fresh food runs low (fewer than `keep` items left).
 * 0 means it already has.
 */
export function freshDaysLeft(inventory, now = new Date(), keep = 4) {
  const fresh = freshItems(inventory, now);
  if (fresh.length < keep) return 0;
  const ends = fresh.map((it) => it.expiresAt || now.getTime() + 14 * DAY).sort((a, b) => b - a);
  return Math.max(0, Math.floor((ends[keep - 1] - now.getTime()) / DAY));
}

/**
 * The outlook.
 * readyCount: recipes you can cook right now with what's on hand.
 * missingDays: ISO days of planned meals that still need shopping.
 * plannedDinners: ISO days that already have a dinner planned.
 */
export function groceryOutlook(inventory, { now = new Date(), readyCount = 0, missingDays = [], plannedDinners = [] } = {}) {
  const today = startOf(now);
  const freshDays = freshDaysLeft(inventory, now);
  const fresh = freshItems(inventory, now).length;
  const soonMissing = missingDays.map((iso) => new Date(`${iso}T00:00:00`)).filter((d) => d >= today && d - today <= 6 * DAY).sort((a, b) => a - b);

  const short = inventory.length > 0 && (readyCount <= 2 || freshDays <= 2 || soonMissing.some((d) => d - today <= 2 * DAY));
  const reasons = [];
  if (readyCount <= 2) reasons.push(readyCount ? `only ${readyCount} meal${readyCount === 1 ? "" : "s"} you can make right now` : "nothing you can cook right now without shopping");
  if (freshDays <= 2) reasons.push(fresh ? `fresh food runs out ${freshDays === 0 ? "today" : freshDays === 1 ? "tomorrow" : "in 2 days"}` : "no fresh food left");
  if (soonMissing.length) reasons.push("planned meals still need ingredients");

  // Shop before fresh food runs out, and before the first planned meal that needs something.
  const candidates = [addDays(today, Math.max(0, freshDays - 1))];
  if (soonMissing.length) candidates.push(new Date(Math.max(today, addDays(soonMissing[0], -1))));
  let shopDay = new Date(Math.min(...candidates));
  if (shopDay <= today && now.getHours() >= 19) shopDay = addDays(today, 1); // too late to shop tonight

  // Cheat day: a night off cooking while you wait to shop, when there's (almost) nothing to cook.
  let cheatDay = null;
  if (short && readyCount <= 1) {
    const night = shopDay > today ? addDays(shopDay, -1) : today;
    const iso = isoOf(night);
    if (!plannedDinners.includes(iso)) cheatDay = night;
  }
  return { short, reasons, freshDays, fresh, shopDay, cheatDay };
}

export const isoOf = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

/** "today", "tomorrow" or a weekday name. */
export function dayWord(d, now = new Date()) {
  const n = Math.round((startOf(d) - startOf(now)) / DAY);
  if (n <= 0) return "today";
  if (n === 1) return "tomorrow";
  return d.toLocaleDateString(undefined, { weekday: "long" });
}
