// The visual fridge, freezer and pantry: decides which shelf each item sits on
// and draws the appliances as HTML.
import { foodIcon } from "./icons.js";
import { daysLeft, SOON_DAYS } from "./recommend.js";
import { formatQty } from "./units.js";
import { needsDefrost } from "./frozen.js";

const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

// Sorted like grocery store aisles.
export const FRIDGE_ZONES = [
  { id: "dairy", label: "Dairy and eggs" },
  { id: "meat", label: "Meat, fish and tofu" },
  { id: "other", label: "Other" },
  { id: "veg", label: "Vegetables" },
  { id: "fruit", label: "Fruit" },
  { id: "door", label: "Condiments and sauces" },
];

export const PANTRY_ZONES = [
  { id: "grains", label: "Pasta, rice and grains" },
  { id: "baking", label: "Baking" },
  { id: "cans", label: "Canned and jarred" },
  { id: "sauces", label: "Oils and sauces" },
  { id: "bread", label: "Bread and bakery" },
  { id: "basket", label: "Fruit and veg" },
];

// Produce is split into fruit and vegetables, the way a store lays it out.
const FRUITS = new Set(["apple", "avocado", "banana", "berries", "lemon", "lime"]);
const FRUITY = /\b(apples?|oranges?|clementines?|mandarins?|grapes?|mangos?|mangoes|peach(es)?|pears?|plums?|cherr(y|ies)|melons?|watermelon|kiwis?|pineapples?|berr(y|ies)|strawberr(y|ies)|blueberr(y|ies)|raspberr(y|ies)|nectarines?|apricots?|figs?|dates|grapefruit|pomegranates?|papayas?|limes?|lemons?|bananas?|avocados?)\b/i;
export const isFruit = (item) => FRUITS.has(item.name) || FRUITY.test(item.name || "");

/** Which shelf an item belongs on, from where it lives and what it is. */
export function zoneFor(item) {
  const c = item.category;
  if (c === "spices") return "rack"; // seasonings live on the spice rack wherever they're kept
  if (item.location === "freezer") return "freezer";
  if (item.location === "pantry") {
    if (c === "grains") return "grains";
    if (c === "baking") return "baking";
    if (c === "condiments" || c === "staples") return "sauces";
    if (c === "bakery") return "bread";
    if (c === "produce") return "basket";
    return "cans";
  }
  if (c === "dairy") return "dairy";
  if (c === "meat" || c === "seafood" || c === "protein") return "meat";
  if (c === "produce") return isFruit(item) ? "fruit" : "veg";
  if (c === "condiments") return "door";
  return "other";
}

export function groupByZone(inventory) {
  const zones = {};
  for (const item of inventory) (zones[zoneFor(item)] ||= []).push(item);
  for (const list of Object.values(zones)) list.sort((a, b) => daysLeft(a) - daysLeft(b) || a.name.localeCompare(b.name));
  return zones;
}

function freshness(item) {
  const d = daysLeft(item);
  if (d < 0) return "gone";
  if (d <= SOON_DAYS) return "soon";
  return "";
}

let delay = 0;
function tile(item, { showQty = true } = {}) {
  const { svg, color } = foodIcon(item.name, item.category);
  const f = freshness(item);
  const d = daysLeft(item);
  const note = f === "gone" ? "expired" : f === "soon" ? (d === 0 ? "use today" : `${d}d left`) : "";
  const qty = formatQty(item.qty, item.unit);
  const style = `--food:${color};--i:${delay++}`;
  const ice = needsDefrost(item);
  return `<button class="food ${f} ${ice ? "frozen" : ""}" data-id="${esc(item.id)}" style="${style}" aria-label="${esc(item.name)}, ${esc(qty)}${ice ? ", frozen, defrost before using" : ""}${note ? ", " + note : ""}">
    <span class="food-bubble">${svg}${showQty ? `<span class="food-qty">${esc(qty)}</span>` : ""}</span>
    <span class="food-name">${esc(item.name)}</span>
  </button>`;
}

function shelf(items, emptyText) {
  if (!items?.length) return `<div class="shelf-items empty-shelf">${emptyText}</div>`;
  return `<div class="shelf-items">${items.map(tile).join("")}</div>`;
}

/** A section header you can tap to fold the section away. */
const label = (zones, id) => zones.find((x) => x.id === id).label;

function foldHeader(id, label, n, collapsed, extra = "") {
  const shut = collapsed.has(id);
  return `<div class="zone-label">
      <button class="fold" data-fold="${id}" aria-expanded="${!shut}">
        <span class="chev" aria-hidden="true"></span>${label} <span class="count">${n}</span>
      </button>${extra}
    </div>`;
}

/**
 * HTML for the fridge (with freezer), the pantry and the spice rack.
 * `collapsed` is a Set of section ids ("freezer", "fridge", "pantry", "rack") that are folded away.
 */
export function renderAppliances(inventory, collapsed = new Set()) {
  delay = 0;
  const z = groupByZone(inventory);
  const count = (ids) => ids.reduce((n, id) => n + (z[id]?.length || 0), 0);
  const shut = (id) => (collapsed.has(id) ? " collapsed" : "");

  const fridge = `
    <section class="appliance fridge" aria-label="Fridge">
      <div class="handle" aria-hidden="true"></div>
      <div class="compartment freezer${shut("freezer")}">
        ${foldHeader("freezer", "Freezer", count(["freezer"]), collapsed)}
        <div class="fold-body">${shelf(z.freezer, "Nothing frozen yet")}</div>
      </div>
      <div class="fridge-section${shut("fridge")}">
        <div class="fridge-head">${foldHeader("fridge", "Fridge", count(FRIDGE_ZONES.map((x) => x.id)), collapsed)}</div>
        <div class="fold-body fridge-body">
          <div class="compartment main">
            ${["dairy", "meat", "other"].filter((id) => id !== "other" || z.other?.length).map((id) => `
              <div class="shelf" data-zone="${id}">
                <div class="shelf-label">${label(FRIDGE_ZONES, id)}</div>
                ${shelf(z[id], { dairy: "No dairy or eggs", meat: "No meat or fish" }[id] || "Empty shelf")}
              </div>`).join("")}
            <div class="drawers">
              <div class="drawer" data-zone="veg">
                <div class="shelf-label">Vegetables</div>
                ${shelf(z.veg, "No veg")}
              </div>
              <div class="drawer" data-zone="fruit">
                <div class="shelf-label">Fruit</div>
                ${shelf(z.fruit, "No fruit")}
              </div>
            </div>
          </div>
          <div class="compartment door">
            <div class="shelf-label">${label(FRIDGE_ZONES, "door")}</div>
            ${shelf(z.door, "Sauces go here")}
          </div>
        </div>
      </div>
    </section>`;

  const pantry = `
    <section class="appliance pantry${shut("pantry")}" aria-label="Pantry">
      <div class="pantry-top" aria-hidden="true"></div>
      ${foldHeader("pantry", "Pantry", count(PANTRY_ZONES.map((p) => p.id)), collapsed)}
      <div class="fold-body">
        ${["grains", "baking", "cans", "sauces"].map((id) => `
          <div class="shelf wood" data-zone="${id}">
            <div class="shelf-label">${label(PANTRY_ZONES, id)}</div>
            ${shelf(z[id], "Empty shelf")}
          </div>`).join("")}
        <div class="pantry-bins">
          <div class="bin bread-box"><div class="shelf-label">${label(PANTRY_ZONES, "bread")}</div>${shelf(z.bread, "No bread")}</div>
          <div class="bin basket"><div class="shelf-label">${label(PANTRY_ZONES, "basket")}</div>${shelf(z.basket, "Onions, potatoes...")}</div>
        </div>
      </div>
    </section>`;

  // Spice rack: jars in rows of four on little wooden ledges. Amounts are hidden
  // unless there's more than one jar, since seasonings are mostly "have it or not".
  const jars = z.rack || [];
  const rows = [];
  for (let i = 0; i < jars.length; i += 4) rows.push(jars.slice(i, i + 4));
  const rack = `
    <section class="appliance rack${shut("rack")}" aria-label="Spice rack">
      <div class="rack-pegs" aria-hidden="true"><span></span><span></span></div>
      ${foldHeader("rack", "Spice rack", jars.length, collapsed, `<button class="btn small rack-stock" data-act="stock-rack">Stock the rack</button>`)}
      <div class="fold-body">
      ${rows.length
        ? rows.map((row) => `<div class="shelf ledge"><div class="shelf-items">${row.map((it) => tile(it, { showQty: it.qty > 1 })).join("")}</div></div>`).join("")
        : `<div class="shelf ledge"><div class="shelf-items empty-shelf">No seasonings yet. Tap Stock the rack to add the ones you have.</div></div>`}
      </div>
    </section>`;

  return { fridge, pantry, rack };
}
