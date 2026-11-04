// The visual fridge, freezer and pantry: decides which shelf each item sits on
// and draws the appliances as HTML.
import { foodIcon } from "./icons.js";
import { daysLeft, SOON_DAYS } from "./recommend.js";
import { formatQty } from "./units.js";

const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

export const FRIDGE_ZONES = [
  { id: "top", label: "Dairy and eggs" },
  { id: "middle", label: "Meat and fish" },
  { id: "bottom", label: "Leftovers and more" },
  { id: "crisper", label: "Crisper drawer" },
  { id: "door", label: "Door" },
];

export const PANTRY_ZONES = [
  { id: "grains", label: "Grains and baking" },
  { id: "cans", label: "Cans and jars" },
  { id: "sauces", label: "Sauces and oils" },
  { id: "bread", label: "Bread box" },
  { id: "basket", label: "Produce basket" },
];

/** Which shelf an item belongs on, from where it lives and what it is. */
export function zoneFor(item) {
  const c = item.category;
  if (c === "spices") return "rack"; // seasonings live on the spice rack wherever they're kept
  if (item.location === "freezer") return "freezer";
  if (item.location === "pantry") {
    if (c === "grains" || c === "baking") return "grains";
    if (c === "condiments" || c === "staples") return "sauces";
    if (c === "bakery") return "bread";
    if (c === "produce") return "basket";
    return "cans";
  }
  if (c === "dairy") return "top";
  if (c === "meat" || c === "seafood" || c === "protein") return "middle";
  if (c === "produce") return "crisper";
  if (c === "condiments" || c === "spices") return "door";
  return "bottom";
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
  return `<button class="food ${f}" data-id="${esc(item.id)}" style="${style}" aria-label="${esc(item.name)}, ${esc(qty)}${note ? ", " + note : ""}">
    <span class="food-bubble">${svg}${showQty ? `<span class="food-qty">${esc(qty)}</span>` : ""}</span>
    <span class="food-name">${esc(item.name)}</span>
  </button>`;
}

function shelf(items, emptyText) {
  if (!items?.length) return `<div class="shelf-items empty-shelf">${emptyText}</div>`;
  return `<div class="shelf-items">${items.map(tile).join("")}</div>`;
}

/** HTML for the fridge (with freezer) and the pantry. */
export function renderAppliances(inventory) {
  delay = 0;
  const z = groupByZone(inventory);
  const count = (ids) => ids.reduce((n, id) => n + (z[id]?.length || 0), 0);

  const fridge = `
    <section class="appliance fridge" aria-label="Fridge">
      <div class="handle" aria-hidden="true"></div>
      <div class="compartment freezer">
        <div class="zone-label">Freezer <span class="count">${count(["freezer"])}</span></div>
        ${shelf(z.freezer, "Nothing frozen yet")}
      </div>
      <div class="fridge-body">
        <div class="compartment main">
          <div class="zone-label">Fridge <span class="count">${count(["top", "middle", "bottom", "crisper", "door"])}</span></div>
          ${["top", "middle", "bottom"].map((id) => `
            <div class="shelf" data-zone="${id}">
              <div class="shelf-label">${FRIDGE_ZONES.find((x) => x.id === id).label}</div>
              ${shelf(z[id], "Empty shelf")}
            </div>`).join("")}
          <div class="drawer">
            <div class="shelf-label">Crisper drawer</div>
            ${shelf(z.crisper, "No fruit or veg")}
          </div>
        </div>
        <div class="compartment door">
          <div class="shelf-label">Door</div>
          ${shelf(z.door, "Sauces go here")}
        </div>
      </div>
    </section>`;

  const pantry = `
    <section class="appliance pantry" aria-label="Pantry">
      <div class="pantry-top" aria-hidden="true"></div>
      <div class="zone-label">Pantry <span class="count">${count(PANTRY_ZONES.map((p) => p.id))}</span></div>
      ${["grains", "cans", "sauces"].map((id) => `
        <div class="shelf wood" data-zone="${id}">
          <div class="shelf-label">${PANTRY_ZONES.find((x) => x.id === id).label}</div>
          ${shelf(z[id], "Empty shelf")}
        </div>`).join("")}
      <div class="pantry-bins">
        <div class="bin bread-box"><div class="shelf-label">Bread box</div>${shelf(z.bread, "No bread")}</div>
        <div class="bin basket"><div class="shelf-label">Produce basket</div>${shelf(z.basket, "Onions, potatoes...")}</div>
      </div>
    </section>`;

  // Spice rack: jars in rows of four on little wooden ledges. Amounts are hidden
  // unless there's more than one jar, since seasonings are mostly "have it or not".
  const jars = z.rack || [];
  const rows = [];
  for (let i = 0; i < jars.length; i += 4) rows.push(jars.slice(i, i + 4));
  const rack = `
    <section class="appliance rack" aria-label="Spice rack">
      <div class="rack-pegs" aria-hidden="true"><span></span><span></span></div>
      <div class="zone-label">Spice rack <span class="count">${jars.length}</span>
        <button class="btn small rack-stock" data-act="stock-rack">Stock the rack</button></div>
      ${rows.length
        ? rows.map((row) => `<div class="shelf ledge"><div class="shelf-items">${row.map((it) => tile(it, { showQty: it.qty > 1 })).join("")}</div></div>`).join("")
        : `<div class="shelf ledge"><div class="shelf-items empty-shelf">No seasonings yet. Tap Stock the rack to add the ones you have.</div></div>`}
    </section>`;

  return { fridge, pantry, rack };
}
