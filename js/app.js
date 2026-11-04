import { FOODS, LOCATIONS } from "./data/foods.js";
import { RECIPES } from "./data/recipes.js";
import { canonicalName, titleCase, foodInfo, matchFood, satisfies, searchText, typedName } from "./normalize.js";
import { parseReceipt } from "./receipt.js";
import { parseRecipeText } from "./recipeImport.js";
import { recommend, cookRecipe, daysLeft, SOON_DAYS } from "./recommend.js";
import { loadState, saveState, makeItem, addToInventory, newId, toSynced, adoptRemote, mergeOnLoad } from "./store.js";
import { connectCloud } from "./cloud.js";
import { renderAppliances } from "./fridge.js";
import { needsDefrost, defrostHint, defrostTo, moveItem } from "./frozen.js";
import { foodIcon } from "./icons.js";
import { estimateCalories } from "./nutrition.js";
import { KEYWORDS, KEYWORD_IDS, KEYWORD_LABEL, keywordsFor } from "./data/keywords.js";
import { MEALS, MEAL_LABEL, isoDay, fromIsoDay, weekDays, dayCalories, prunePlan, plannedRecipeIds } from "./plan.js";
import { UNIT_CHOICES, formatQty, normalizeUnit } from "./units.js";
import { LEVELS, LEVEL_LABEL, familyCheck, familyNotes, familyRequest, eating, isOut, pruneAway } from "./family.js";
import { MEAL_TYPES, MEAL_TYPE_LABEL, mealsFor, mealNow } from "./data/meals.js";
import { TIME_OPTIONS, PREP_OPTIONS, fitsTime, todaysChoice, timeRequest } from "./cooktime.js";

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

let state = loadState();
const ui = { tab: "home", show: "both", itemId: null, keywords: new Set(), loc: "all", search: "", recipeFilter: "ready", meal: "any", recipeSearch: "", review: [] };
state.ideas ||= { key: "", recipes: [] };
state.plan ||= {};
// Sections the person has folded away (fridge drawing and list groups).
const folded = () => new Set(state.settings.collapsed || []);

// Saving: every change goes to this browser's storage straight away and, on
// claude.ai, to the person's private saved copy (see cloud.js).
const sessionStart = Date.now();
let cloud = null;

function persist() {
  state.updatedAt = Date.now();
  saveState(state);
  cloud?.save(toSynced(state));
}

function commit() {
  persist();
  render();
}

function toast(msg, { action, onAction } = {}) {
  const el = $("#toast");
  el.textContent = msg;
  if (action) {
    const b = document.createElement("button");
    b.className = "toast-action";
    b.textContent = action;
    b.onclick = () => { el.classList.remove("show"); onAction(); };
    el.append(" ", b);
  }
  el.classList.toggle("has-action", Boolean(action));
  el.classList.add("show");
  clearTimeout(toast.t);
  toast.t = setTimeout(() => el.classList.remove("show"), action ? 5000 : 2600);
}

const claudeOn = () => Boolean(state.settings.useClaude && state.settings.apiKey);
const allRecipes = () => {
  const mine = new Set(state.customRecipes.map((r) => r.id));
  return [...state.customRecipes, ...RECIPES.filter((r) => !mine.has(r.id))];
};
const unitOptions = (selected) =>
  UNIT_CHOICES.map((u) => `<option value="${u}" ${u === selected ? "selected" : ""}>${u}</option>`).join("");
const locationOptions = (selected) =>
  LOCATIONS.map((l) => `<option value="${l}" ${l === selected ? "selected" : ""}>${titleCase(l)}</option>`).join("");

function expiryText(item) {
  const d = daysLeft(item);
  if (d === Infinity) return "";
  if (d < 0) return `<span class="exp gone">expired ${-d}d ago</span>`;
  if (d === 0) return `<span class="exp gone">use today</span>`;
  if (d <= SOON_DAYS) return `<span class="exp soon-txt">${d}d left</span>`;
  if (d > 60) return `<span class="exp">keeps well</span>`;
  return `<span class="exp">${d}d left</span>`;
}

// ---------- Fridge (visual) ----------

function renderFridge() {
  const inv = state.inventory;
  const n = (loc) => inv.filter((it) => it.location === loc).length;
  const soon = inv.filter((it) => daysLeft(it) <= SOON_DAYS).length;
  const spices = inv.filter((it) => it.category === "spices").length;
  const nonSpice = (loc) => inv.filter((it) => it.location === loc && it.category !== "spices").length;
  $("#fridge-summary").textContent = inv.length
    ? `${nonSpice("fridge")} in the fridge, ${nonSpice("freezer")} in the freezer, ${nonSpice("pantry")} in the pantry, ${spices} seasoning${spices === 1 ? "" : "s"}` + (soon ? `. ${soon} to use soon.` : ".")
    : "Empty for now. Add food or scan a receipt to stock it up.";
  $$("#appliance-filter .chip").forEach((c) => c.classList.toggle("active", c.dataset.show === ui.show));
  renderDefrostBanner();
  const { fridge, pantry, rack } = renderAppliances(inv, folded());
  const box = $("#appliances");
  box.classList.toggle("both", ui.show === "both");
  const show = (part) => ui.show === "both" || ui.show === part;
  box.innerHTML = (show("fridge") ? fridge : "") + (show("pantry") ? pantry : "") + (show("rack") ? rack : "");
}

$("#appliance-filter").addEventListener("click", (e) => {
  const chip = e.target.closest(".chip");
  if (!chip) return;
  ui.show = chip.dataset.show;
  renderFridge();
});

$("#appliances").addEventListener("click", (e) => {
  if (e.target.closest("[data-act=stock-rack]")) return openRack();
  const food = e.target.closest(".food");
  if (food) openItem(food.dataset.id);
});

$("#fridge-add").addEventListener("click", () => {
  switchTab("kitchen");
  $("#add-name").focus();
});

// Item popup: change amount, move it, use it up, or find recipes that use it.
function renderItemDialog() {
  const item = state.inventory.find((it) => it.id === ui.itemId);
  const dlg = $("#item-dialog");
  if (!item) return dlg.open && dlg.close();
  const { svg, color } = foodIcon(item.name, item.category);
  $("#item-detail").innerHTML = `
    <div class="food-bubble big-bubble" style="--food:${color}">${svg}</div>
    <h2>${esc(item.label || item.name)}</h2>
    <p class="muted small">${esc(item.category)}${expiryText(item) ? " &middot; " + expiryText(item) : ""}</p>
    ${needsDefrost(item) ? `<p class="defrost-note">Frozen. Defrost before using: ${esc(defrostHint(item))}.</p>` : ""}
    ${item.defrostedAt && !needsDefrost(item) ? `<p class="thawed-note">Defrosted ${esc(new Date(item.defrostedAt).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" }))}. Don't refreeze it raw.</p>` : ""}
    <div class="stepper">
      <button class="step" data-act="dec" aria-label="Less">&minus;</button>
      <span class="qty">${esc(formatQty(item.qty, item.unit))}</span>
      <button class="step" data-act="inc" aria-label="More">+</button>
    </div>
    <div class="where" role="group" aria-label="Where it's kept">
      ${LOCATIONS.map((l) => `<button class="chip loc-${l} ${l === item.location ? "active" : ""}" data-move="${l}">${titleCase(l)}</button>`).join("")}
    </div>
    <div class="row end">
      ${needsDefrost(item) ? `<button class="btn defrost-btn" data-act="defrost">Defrost it</button>` : ""}
      <button class="btn danger" data-act="usedup">Used it up</button>
      <button class="btn" data-act="recipes">Recipes with this</button>
      <button class="btn primary" data-act="close">Done</button>
    </div>`;
}

function openItem(id) {
  ui.itemId = id;
  renderItemDialog();
  const dlg = $("#item-dialog");
  if (!dlg.open) dlg.showModal();
}

$("#item-dialog").addEventListener("click", (e) => {
  const dlg = $("#item-dialog");
  if (e.target === dlg) return dlg.close();
  const item = state.inventory.find((it) => it.id === ui.itemId);
  if (!item) return dlg.close();
  const move = e.target.closest("[data-move]")?.dataset.move;
  const act = e.target.closest("[data-act]")?.dataset.act;
  if (act === "close") return dlg.close();
  if (act === "recipes") {
    dlg.close();
    ui.recipeFilter = "all";
    ui.recipeSearch = item.name;
    $("#recipe-search").value = item.name;
    return switchTab("recipes");
  }
  if (move || act === "defrost") {
    const to = move || defrostTo(item);
    replaceItem(moveItem(item, to));
    if (act === "defrost") toast(`${titleCase(item.name)} is defrosting in the ${to}. Use within ${daysLeft(state.inventory.find((it) => it.id === item.id))} days.`);
    else if (to === "freezer") toast(`${titleCase(item.name)} frozen. It will need defrosting before you use it.`);
    commit();
    return renderItemDialog();
  }
  if (act === "inc") item.qty = +(item.qty + stepAmount(item)).toFixed(2);
  if (act === "dec") item.qty = +(item.qty - stepAmount(item)).toFixed(2);
  if (act === "usedup" || item.qty <= 0) {
    state.inventory = state.inventory.filter((it) => it.id !== item.id);
    toast(`${titleCase(item.name)} used up`);
    dlg.close();
  }
  if (move || act) {
    commit();
    renderItemDialog();
  }
});

// ---------- Frozen food ----------

function replaceItem(next) {
  state.inventory = state.inventory.map((it) => (it.id === next.id ? next : it));
}

/** The frozen item that would be used for a recipe ingredient. */
function frozenItemFor(ingredient) {
  return state.inventory.find((it) => needsDefrost(it) && satisfies(it.name, ingredient));
}

/** What's actually in the freezer for these ingredients ("chicken" -> "chicken breast"). */
function frozenNames(ingredients) {
  return [...new Set(ingredients.map((n) => frozenItemFor(n)?.name || n))];
}

/** Defrost one frozen item for each ingredient name. */
function defrostFor(ingredients) {
  const done = [];
  for (const ing of ingredients) {
    const item = frozenItemFor(ing);
    if (!item) continue;
    replaceItem(moveItem(item, defrostTo(item)));
    done.push(item.name);
  }
  if (done.length) {
    commit();
    toast(`Defrosting: ${done.join(", ")}`);
  }
}

/** Planned meals today and tomorrow that need something taken out of the freezer. */
function defrostReminders() {
  const out = [];
  for (const offset of [0, 1]) {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + offset);
    const iso = isoDay(d);
    for (const meal of MEALS) {
      const id = state.plan[iso]?.[meal]?.recipeId;
      const recipe = id && findRecipe(id);
      if (!recipe) continue;
      const [r] = recommend([recipe], state.inventory, { assumeStaples: state.settings.assumeStaples });
      if (r.frozen.length) out.push({ iso, when: offset ? "tomorrow" : "today", meal, title: recipe.title, frozen: r.frozen });
    }
  }
  return out;
}

function defrostNote(iso) {
  const due = defrostReminders().filter((x) => x.iso === iso);
  if (!due.length) return "";
  const names = [...new Set(due.flatMap((x) => x.frozen))];
  const shown = frozenNames(names);
  const when = due[0].when === "today" ? "now" : "tonight";
  return `<div class="defrost-reminder"><span>Defrost ${when}: <b>${esc(shown.join(", "))}</b></span>
    <button class="btn small" data-defrost="${esc(names.join("|"))}">Defrost</button></div>`;
}

function renderDefrostBanner() {
  $("#defrost-banner").innerHTML = defrostCardHtml();
}

function defrostCardHtml() {
  const due = defrostReminders();
  return due.length
    ? `<div class="card defrost-card">
        <h2>Take out of the freezer</h2>
        ${due.map((x) => `<div class="defrost-row"><span><b>${esc(frozenNames(x.frozen).join(", "))}</b> for ${x.when}'s ${esc(MEAL_LABEL[x.meal].toLowerCase())} (${esc(x.title)})</span>
          <button class="btn small" data-defrost="${esc(x.frozen.join("|"))}">Defrost</button></div>`).join("")}
      </div>`
    : "";
}

document.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-defrost]");
  if (btn) defrostFor(btn.dataset.defrost.split("|"));
});

// ---------- Home ----------

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
}

// Keep the greeting in step with the clock while the app stays open.
setInterval(() => {
  const el = $("#hello"), name = (state.settings.name || "").trim();
  if (el) el.textContent = name ? `${greeting()}, ${name}` : greeting();
}, 60000);

function renderHome() {
  const name = (state.settings.name || "").trim();
  $("#hello").textContent = name ? `${greeting()}, ${name}` : greeting();
  const now = new Date();
  $("#badge-day").textContent = String(now.getDate()).padStart(2, "0");
  $("#badge-month").textContent = now.toLocaleDateString(undefined, { month: "short" });

  const today = isoDay(new Date());
  const day = state.plan[today] || {};
  const c = dayCalories(day);
  const due = defrostReminders().filter((x) => x.when === "today");
  const soon = state.inventory.filter((it) => daysLeft(it) <= SOON_DAYS && !needsDefrost(it));
  const ranked = recommend(allRecipes(), state.inventory, { assumeStaples: state.settings.assumeStaples });
  const ready = ranked.filter((r) => !r.missing.length && r.have.length && !r.frozen.length && !isBlocked(r) && mealsFor(r.recipe).includes(mealNow()));

  // What the assistant says.
  const lines = [];
  if (!state.inventory.length) lines.push("Your fridge is empty. Scan a receipt or add some food and I'll get to work.");
  else if (c.meals === 3) lines.push(`All three meals are planned today${c.total ? `, about ${c.total} kcal` : ""}.`);
  else if (c.meals) lines.push(`You have ${c.meals} of 3 meals planned today${c.total ? `, about ${c.total} kcal so far` : ""}.`);
  else lines.push(`Nothing is planned for today yet.${ready.length ? ` You could make ${ready[0].recipe.title} for ${mealNow()} right now.` : ""}`);
  if (due.length) lines.push(`Don't forget to defrost the ${frozenNames(due.flatMap((x) => x.frozen)).join(" and ")}.`);
  else if (soon.length) lines.push(`Use up the ${soon.slice(0, 2).map((it) => it.name).join(" and ")} soon.`);
  $("#hello-sub").textContent = lines.join(" ");

  // Today's meals.
  $("#home-today").innerHTML = `
    <div class="card today-card">
      <div class="today-head">
        <h2>Today's meals</h2>
        <span class="muted small">${esc(new Date().toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" }))}</span>
      </div>
      <div class="slots">
        ${MEALS.map((m) => {
          const e = day[m];
          const ref = `${today}|${m}`;
          if (!e) return `<button class="slot empty meal-${m}" data-home-pick="${ref}"><span class="slot-label">${MEAL_LABEL[m]}</span><span class="slot-add">+ Add</span></button>`;
          return `<div class="slot filled meal-${m}">
            <button class="slot-main" data-home-open="${ref}"><span class="slot-label">${MEAL_LABEL[m]}</span><span class="slot-title">${esc(e.title || e.text)}</span>${Number.isFinite(e.kcal) && e.kcal > 0 ? `<span class="slot-kcal">~${e.kcal} kcal</span>` : ""}</button>
            <button class="x" data-home-clear="${ref}" aria-label="Remove ${esc(e.title || e.text)} from ${m}">&times;</button>
          </div>`;
        }).join("")}
      </div>
      <div class="today-foot">
        <span class="kcal-total">${c.meals ? `${c.known ? "" : "at least "}~${c.total} kcal today` : "No meals planned yet"}</span>
        <button class="btn small" data-go="plan">Open planner</button>
      </div>
    </div>`;

  $("#home-defrost").innerHTML = defrostCardHtml();

  $("#home-soon").innerHTML = soon.length
    ? `<div class="card soon">
        <h2>Use these soon</h2>
        <div class="soon-list">${soon.map((it) => `<span class="pill">${esc(it.label || it.name)} &middot; ${expiryText(it)}</span>`).join("")}</div>
        <button class="btn small" data-action="show-rescue">Recipes that use them</button>
      </div>`
    : "";

  $("#home-cook").innerHTML = ready.length
    ? `<h2 class="section-title">You could make right now</h2><div class="recipe-grid">${ready.slice(0, 2).map(recipeCard).join("")}</div>`
    : state.inventory.length
      ? ""
      : `<div class="row home-start"><button class="btn primary" data-go="scan">Scan a receipt</button><button class="btn" data-go="kitchen">Add food</button></div>`;
}

$("#view-home").addEventListener("click", (e) => {
  const go = e.target.closest("[data-go]")?.dataset.go;
  if (go) return switchTab(go);
  if (e.target.closest("[data-action=show-rescue]")) {
    ui.recipeFilter = "rescue";
    return switchTab("recipes");
  }
  const clear = e.target.closest("[data-home-clear]")?.dataset.homeClear;
  if (clear) return removePlanned(...clear.split("|"));
  const pick = e.target.closest("[data-home-pick]")?.dataset.homePick;
  if (pick) return openSlotPicker(...pick.split("|"));
  const open = e.target.closest("[data-home-open]")?.dataset.homeOpen;
  if (open) {
    const [d, m] = open.split("|");
    const id = state.plan[d]?.[m]?.recipeId;
    return id && findRecipe(id) ? openRecipe(id) : openSlotPicker(d, m);
  }
  const card = e.target.closest("[data-recipe]");
  if (card) openRecipe(card.dataset.recipe);
});

// ---------- Your name (asked once) ----------

function maybeAskName(tries = 0) {
  if (state.settings.name || state.settings.nameAsked) return;
  // Wait for the saved copy to load first, so a name saved on another device is used.
  if (syncStatus === "connecting" && tries < 10) return setTimeout(() => maybeAskName(tries + 1), 500);
  const dlg = $("#name-dialog");
  if (!dlg.open) dlg.showModal();
  setTimeout(() => $("#name-input").focus(), 50);
}

function saveName(name) {
  state.settings.name = String(name || "").trim().slice(0, 40);
  state.settings.nameAsked = true; // never ask again, even if skipped
  commit();
  $("#name-dialog").close();
  if (state.settings.name) toast(`Nice to meet you, ${state.settings.name}!`);
}

$("#name-form").addEventListener("submit", (e) => {
  e.preventDefault();
  saveName($("#name-input").value);
});
$("#name-skip").addEventListener("click", () => saveName(""));
$("#name-dialog").addEventListener("cancel", (e) => {
  e.preventDefault();
  saveName("");
});

// ---------- Folding sections ----------

document.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-fold]");
  if (!btn) return;
  const id = btn.dataset.fold;
  const set = folded();
  set.has(id) ? set.delete(id) : set.add(id);
  state.settings.collapsed = [...set];
  commit();
});

document.addEventListener("click", (e) => {
  const mode = e.target.closest("[data-view-mode]")?.dataset.viewMode;
  if (mode && mode !== ui.tab) switchTab(mode);
});

// ---------- Spice rack ----------
// Seasonings are mostly "have it or not", so the rack is stocked by tapping jars on and off.

const SEASONING_FOODS = FOODS.filter((f) => f.category === "spices" && f.name !== "spices");
const hasItem = (name) => state.inventory.some((it) => it.name === name);

function renderRack() {
  const custom = state.inventory.filter((it) => it.category === "spices" && !SEASONING_FOODS.some((f) => f.name === it.name));
  const tileFor = (name, category = "spices") => {
    const { svg, color } = foodIcon(name, category);
    const on = hasItem(name);
    return `<button class="stock-item ${on ? "on" : ""}" data-season="${esc(name)}" aria-pressed="${on}">
      <span class="food-bubble" style="--food:${color}">${svg}</span><span>${esc(name)}</span></button>`;
  };
  const owned = SEASONING_FOODS.filter((f) => hasItem(f.name)).length + custom.length;
  $("#rack-detail").innerHTML = `
    <h2>Stock your spice rack</h2>
    <p class="muted small">Tap the seasonings you have. ${owned} on the rack.</p>
    <div class="stock-grid">${SEASONING_FOODS.map((f) => tileFor(f.name)).join("")}${custom.map((it) => tileFor(it.name)).join("")}</div>
    <form class="row" id="rack-add" autocomplete="off">
      <input id="rack-name" placeholder="Another seasoning, like za'atar" aria-label="Another seasoning" />
      <button class="btn" type="submit">Add</button>
    </form>
    <div class="row end"><button class="btn primary" data-act="close">Done</button></div>`;
}

function openRack() {
  renderRack();
  const dlg = $("#rack-dialog");
  if (!dlg.open) dlg.showModal();
}

$("#rack-dialog").addEventListener("click", (e) => {
  const dlg = $("#rack-dialog");
  if (e.target === dlg || e.target.closest("[data-act=close]")) return dlg.close();
  const name = e.target.closest("[data-season]")?.dataset.season;
  if (!name) return;
  if (hasItem(name)) state.inventory = state.inventory.filter((it) => it.name !== name);
  else state.inventory = addToInventory(state.inventory, [makeItem({ name, location: "pantry", category: "spices" })]);
  commit();
  renderRack();
});

$("#rack-dialog").addEventListener("submit", (e) => {
  e.preventDefault();
  const raw = $("#rack-name").value.trim();
  if (!raw) return;
  // Known seasonings use their catalog name; anything else keeps the person's own spelling.
  const name = matchFood(raw)?.category === "spices" ? matchFood(raw).name : raw.toLowerCase().replace(/\s+/g, " ");
  if (!hasItem(name)) state.inventory = addToInventory(state.inventory, [makeItem({ name, location: "pantry", category: "spices", shelfLife: 1000, keepName: true })]);
  commit();
  renderRack();
  $("#rack-name").focus();
});

// ---------- Kitchen ----------

// The List tab groups seasonings on their own, wherever they're kept.
const GROUPS = ["fridge", "freezer", "pantry", "seasonings"];
const groupOf = (it) => (it.category === "spices" ? "seasonings" : it.location);

function renderKitchen() {
  const inv = state.inventory;
  const soon = inv.filter((it) => daysLeft(it) <= SOON_DAYS).sort((a, b) => daysLeft(a) - daysLeft(b));
  const count = (group) => inv.filter((it) => groupOf(it) === group).length;

  $("#stats").innerHTML = `
    <div class="stat"><b>${count("fridge")}</b><span>Fridge</span></div>
    <div class="stat"><b>${count("freezer")}</b><span>Freezer</span></div>
    <div class="stat"><b>${count("pantry")}</b><span>Pantry</span></div>
    <div class="stat"><b>${count("seasonings")}</b><span>Seasonings</span></div>
    <div class="stat ${soon.length ? "warn" : ""}"><b>${soon.length}</b><span>Use soon</span></div>`;

  $("#use-soon").innerHTML = soon.length
    ? `<div class="card soon">
         <h2>Use these soon</h2>
         <div class="soon-list">${soon.map((it) => `<span class="pill">${esc(it.label || it.name)} &middot; ${expiryText(it)}</span>`).join("")}</div>
         <button class="btn small" data-action="show-rescue">Recipes that use them</button>
       </div>`
    : "";

  const q = ui.search.toLowerCase();
  const visible = inv
    .filter((it) => ui.loc === "all" || groupOf(it) === ui.loc)
    .filter((it) => !q || it.name.includes(q) || (it.label || "").includes(q) || it.category.includes(q));

  if (!inv.length) {
    $("#inventory").innerHTML = `<div class="empty">Your kitchen is empty. Add items above, or scan a grocery receipt from the Scan tab.</div>`;
    return;
  }
  if (!visible.length) {
    $("#inventory").innerHTML = `<div class="empty">Nothing matches.</div>`;
    return;
  }

  $("#inventory").innerHTML = GROUPS.map((loc) => {
    const items = visible.filter((it) => groupOf(it) === loc).sort((a, b) => daysLeft(a) - daysLeft(b) || a.name.localeCompare(b.name));
    if (!items.length) return "";
    const shut = folded().has("list-" + loc);
    return `<button class="group-title fold" data-fold="list-${loc}" aria-expanded="${!shut}"><span class="chev" aria-hidden="true"></span><span class="dot ${loc}"></span>${loc} (${items.length})</button>
      ${shut ? "" : `
      ${items.map((it) => `
        <div class="item" data-id="${it.id}">
          <div class="item-name">${esc(it.label || it.name)}</div>
          <div class="item-meta">${esc(it.category)} ${expiryText(it) ? "&middot; " + expiryText(it) : ""}</div>
          <div class="item-controls">
            <button class="step" data-action="dec" aria-label="Less ${esc(it.name)}">&minus;</button>
            <span class="qty">${esc(formatQty(it.qty, it.unit))}</span>
            <button class="step" data-action="inc" aria-label="More ${esc(it.name)}">+</button>
            <select data-action="move" aria-label="Move ${esc(it.name)}">${locationOptions(it.location)}</select>
            <button class="x" data-action="remove" aria-label="Remove ${esc(it.name)}">&times;</button>
          </div>
        </div>`).join("")}`}`;
  }).join("");
}

function stepAmount(item) {
  const u = normalizeUnit(item.unit);
  if (u === "g" || u === "ml") return 100;
  if (u === "kg" || u === "l" || u === "lb") return 0.5;
  return 1;
}

$("#inventory").addEventListener("click", (e) => {
  const btn = e.target.closest("[data-action]");
  const row = e.target.closest(".item");
  if (!btn || !row || btn.tagName === "SELECT") return;
  const item = state.inventory.find((it) => it.id === row.dataset.id);
  if (!item) return;
  const action = btn.dataset.action;
  if (action === "inc") item.qty = +(item.qty + stepAmount(item)).toFixed(2);
  if (action === "dec") item.qty = +(item.qty - stepAmount(item)).toFixed(2);
  if (action === "remove" || item.qty <= 0) {
    state.inventory = state.inventory.filter((it) => it.id !== item.id);
    toast(`${titleCase(item.name)} removed`);
  }
  commit();
});

$("#inventory").addEventListener("change", (e) => {
  if (e.target.dataset.action !== "move") return;
  const item = state.inventory.find((it) => it.id === e.target.closest(".item").dataset.id);
  if (item) {
    replaceItem(moveItem(item, e.target.value));
    commit();
  }
});

$("#use-soon").addEventListener("click", (e) => {
  if (e.target.closest("[data-action=show-rescue]")) {
    ui.recipeFilter = "rescue";
    switchTab("recipes");
  }
});

$("#add-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const name = $("#add-name").value.trim();
  if (!name) return;
  const item = makeItem({ name, qty: $("#add-qty").value, unit: $("#add-unit").value, location: $("#add-location").value || undefined });
  state.inventory = addToInventory(state.inventory, [item]);
  $("#add-name").value = "";
  $("#add-qty").value = 1;
  toast(`Added ${item.name} to ${item.location}`);
  commit();
  $("#add-name").focus();
});

$("#location-filter").addEventListener("click", (e) => {
  const chip = e.target.closest(".chip");
  if (!chip) return;
  ui.loc = chip.dataset.loc;
  $$("#location-filter .chip").forEach((c) => c.classList.toggle("active", c === chip));
  renderKitchen();
});

$("#inventory-search").addEventListener("input", (e) => {
  ui.search = e.target.value.trim();
  renderKitchen();
});

// ---------- Scan receipts ----------

// Which reader handles photos: Claude through claude.ai (the viewer's own
// account), Claude through the person's API key, or on-device text recognition.
let photoSample = null; // set once the page knows it can send images to Claude

function photoEngine() {
  if (photoSample) return "sample";
  if (claudeOn()) return "key";
  return "device";
}

function updateScanEngine() {
  const engine = photoEngine();
  $("#scan-engine").textContent = engine === "device"
    ? "Reads receipts on your device. For tricky receipts, add a Claude API key in Settings."
    : "Claude reads your receipt.";
  $("#recipe-engine").textContent = engine === "device"
    ? "Reads the page on your device, then you check the text before saving. Works best with a flat, well-lit page."
    : "Claude reads the page. For a recipe over two pages, choose both photos together.";
}

function setRecipeProgress(pct, label) {
  const bar = $("#recipe-progress");
  bar.hidden = pct === null;
  if (pct !== null) {
    bar.querySelector("div").style.width = `${pct}%`;
    bar.querySelector("span").textContent = label || `${pct}%`;
  }
}

// Codes after which this page can't send photos to Claude for the rest of the visit.
const PHOTO_OFF_CODES = ["not_granted", "sampling_disabled", "not_declared", "capability_disabled", "capability_removed", "images_unavailable"];

function showReview(items) {
  // Unrecognised receipt lines (food === null) start unticked so non-food doesn't sneak in.
  ui.review = items.map((it) => ({ ...it, keep: it.food !== null, rid: newId() }));
  if (!ui.review.length) {
    toast("No food items found. Try a sharper photo or paste the text.");
    return;
  }
  $("#review").hidden = false;
  renderReview();
  $("#review").scrollIntoView({ behavior: "smooth", block: "start" });
}

function renderReview() {
  $("#review-list").innerHTML = ui.review.map((it) => `
    <div class="review-row" data-rid="${it.rid}">
      <input type="checkbox" data-f="keep" ${it.keep ? "checked" : ""} aria-label="Keep ${esc(it.name)}" />
      <div class="fields">
        <input type="text" data-f="name" value="${esc(it.name)}" aria-label="Name" />
        <input type="number" data-f="qty" value="${esc(it.qty)}" min="0" step="any" aria-label="Quantity" />
        <select data-f="unit" aria-label="Unit">${unitOptions(normalizeUnit(it.unit))}</select>
        <select data-f="location" aria-label="Where">${locationOptions(it.location)}</select>
      </div>
      ${it.raw ? `<div class="raw">${esc(it.raw)}${it.food === null ? ' <span class="unknown">not recognised, check it</span>' : ""}</div>` : ""}
    </div>`).join("");
  $("#review-add").textContent = `Add ${ui.review.filter((r) => r.keep).length} to kitchen`;
}

$("#review-list").addEventListener("input", (e) => {
  const row = e.target.closest(".review-row");
  const item = ui.review.find((r) => r.rid === row?.dataset.rid);
  if (!item) return;
  const f = e.target.dataset.f;
  item[f] = f === "keep" ? e.target.checked : e.target.value;
  if (f === "name") {
    const info = foodInfo(canonicalName(item.name));
    if (info) {
      item.location = info.location;
      row.querySelector("[data-f=location]").value = info.location;
    }
  }
  $("#review-add").textContent = `Add ${ui.review.filter((r) => r.keep).length} to kitchen`;
});

$("#review-cancel").addEventListener("click", () => {
  ui.review = [];
  $("#review").hidden = true;
});

$("#review-add").addEventListener("click", () => {
  const items = ui.review
    .filter((r) => r.keep && String(r.name).trim())
    .map((r) => makeItem({ name: r.name, qty: r.qty, unit: r.unit, location: r.location, shelfLife: r.shelfLife }));
  state.inventory = addToInventory(state.inventory, items);
  // Anything bought comes off the shopping list.
  const bought = new Set(items.map((i) => i.name));
  state.shopping = state.shopping.filter((s) => !bought.has(s.name));
  ui.review = [];
  $("#review").hidden = true;
  $("#receipt-text").value = "";
  toast(`Added ${items.length} item${items.length === 1 ? "" : "s"} to your kitchen`);
  commit();
  switchTab("kitchen");
});

function fromReceiptParse(parsed) {
  return parsed.map((p) => ({
    name: p.name,
    qty: p.qty,
    unit: p.unit,
    raw: p.raw,
    food: p.food,
    location: p.frozen ? "freezer" : p.food?.location || "fridge",
  }));
}

function setProgress(pct, label) {
  const bar = $("#scan-progress");
  bar.hidden = pct === null;
  if (pct !== null) {
    bar.querySelector("div").style.width = `${pct}%`;
    bar.querySelector("span").textContent = label || `${pct}%`;
  }
}

$("#receipt-file").addEventListener("change", async (e) => {
  const file = e.target.files[0];
  e.target.value = "";
  if (!file) return;
  try {
    let items = null;
    if (photoEngine() !== "device") {
      setProgress(60, "Claude is reading your receipt...");
      const ai = await import("./ai.js");
      try {
        items = photoSample
          ? await ai.scanReceiptWithSample(photoSample, file)
          : await ai.scanReceiptWithClaude(state.settings.apiKey, file);
      } catch (err) {
        if (!(photoSample && PHOTO_OFF_CODES.includes(err?.code))) throw err;
        photoSample = null; // fall back to reading on this device
      }
    }
    if (items) {
      showReview(items.map((it) => {
        const name = canonicalName(it.name);
        return { name, qty: it.qty, unit: it.unit, location: it.location, shelfLife: it.shelf_life_days, raw: it.name, food: foodInfo(name) || undefined };
      }));
    } else {
      setProgress(0, "Loading scanner...");
      const { recognizeText } = await import("./ocr.js");
      const text = await recognizeText(file, (p) => setProgress(p, `Reading receipt ${p}%`));
      $("#receipt-text").value = text;
      showReview(fromReceiptParse(parseReceipt(text)));
    }
  } catch (err) {
    console.error(err);
    toast(err.message || "Scanning failed");
  } finally {
    setProgress(null);
  }
});

$("#parse-receipt-text").addEventListener("click", () => {
  showReview(fromReceiptParse(parseReceipt($("#receipt-text").value)));
});

// ---------- Import recipes ----------

function saveCustomRecipe(recipe) {
  const clean = {
    id: recipe.id || "custom-" + newId(),
    title: (recipe.title || "").trim() || "My recipe",
    minutes: recipe.minutes || 30,
    servings: recipe.servings || 2,
    tags: recipe.tags || ["mine"],
    ingredients: (recipe.ingredients || []).map((ing) => ({
      name: ing.typed ? ing.name : canonicalName(ing.name),
      qty: Number(ing.qty) || 1,
      unit: normalizeUnit(ing.unit) || "count",
      optional: Boolean(ing.optional),
    })),
    steps: recipe.steps || [],
    keywords: (recipe.keywords || []).filter((k) => KEYWORD_IDS.includes(k)),
    meals: Array.isArray(recipe.meals) ? recipe.meals : undefined,
    edited: recipe.edited || undefined,
    custom: true,
    addedAt: recipe.addedAt || Date.now(),
  };
  state.customRecipes = [clean, ...state.customRecipes.filter((r) => r.id !== clean.id)];
  commit();
  return clean;
}

$("#import-recipe").addEventListener("click", () => {
  const text = $("#recipe-text").value.trim();
  if (!text) return toast("Paste a recipe first");
  const recipe = parseRecipeText(text);
  if (!recipe.ingredients.length) return toast("Couldn't find any ingredients. Put each one on its own line.");
  const saved = saveCustomRecipe(recipe);
  $("#recipe-text").value = "";
  openRecipeEditor(saved.id, { checking: true });
});

async function readRecipeTextOnDevice(files) {
  const { recognizeText } = await import("./ocr.js");
  let text = "";
  for (let i = 0; i < files.length; i++) {
    const label = files.length > 1 ? `Reading page ${i + 1} of ${files.length}` : "Reading the page";
    text += (await recognizeText(files[i], (p) => setRecipeProgress(p, `${label} ${p}%`))) + "\n";
  }
  return text.trim();
}

async function importRecipePhotos(fileList) {
  const files = Array.from(fileList || []).slice(0, 4);
  if (!files.length) return;
  let engine = photoEngine();
  try {
    if (engine !== "device") {
      setRecipeProgress(55, files.length > 1 ? `Claude is reading ${files.length} pages...` : "Claude is reading the recipe...");
      const ai = await import("./ai.js");
      let recipe = null;
      try {
        recipe = engine === "sample"
          ? await ai.scanRecipeWithSample(photoSample, files)
          : await ai.scanRecipeWithClaude(state.settings.apiKey, files);
      } catch (err) {
        if (engine === "sample" && PHOTO_OFF_CODES.includes(err?.code)) {
          photoSample = null; // fall back to reading on this device
          engine = "device";
        } else throw err;
      }
      if (engine !== "device") {
        if (!recipe) throw { code: "no_recipe" };
        const saved = saveCustomRecipe({ ...recipe, tags: ["mine", "book"] });
        openRecipeEditor(saved.id, { checking: true });
        return;
      }
    }
    // On-device: read the text, then let the person check it before saving.
    setRecipeProgress(0, "Loading the reader...");
    const text = await readRecipeTextOnDevice(files);
    if (!text) throw { code: "no_recipe" };
    $("#recipe-text").value = text;
    $("#recipe-paste").open = true;
    $("#recipe-text").scrollIntoView({ behavior: "smooth", block: "center" });
    toast("Check the text, fix anything that looks off, then tap Save recipe");
  } catch (err) {
    console.error(err);
    const code = err?.code;
    toast(
      code === "no_recipe" ? "Couldn't find a recipe in that photo. Try a closer, sharper shot."
      : code === "image_rejected" ? "That photo couldn't be used. Try a different one."
      : code === "rate_limited" ? "Usage limit reached. Try again a bit later."
      : code === "invalid_json" ? "Claude couldn't read that one cleanly. Try again."
      : err?.message && !code ? err.message
      : "Couldn't read that recipe"
    );
  } finally {
    setRecipeProgress(null);
    updateScanEngine();
  }
}

for (const id of ["#recipe-file", "#recipe-camera"]) {
  $(id).addEventListener("change", (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    importRecipePhotos(files);
  });
}

// ---------- Recipes ----------

function recipeCard(r) {
  const pct = Math.round(r.coverage * 100);
  const extra = r.recipe.custom ? " &middot; mine" : "";
  return `<button class="recipe" data-recipe="${esc(r.recipe.id)}">
    <h3>${esc(r.recipe.title)}</h3>
    <div class="tagline">${r.recipe.minutes} min &middot; serves ${r.recipe.servings}${kcalText(r.recipe) ? " &middot; " + kcalText(r.recipe) : ""}${extra}</div>
    ${mealLine(r.recipe)}
    ${kwPills(r.recipe, 3)}
    <div class="meter" aria-label="${pct}% of ingredients on hand"><div style="width:${pct}%"></div></div>
    ${r.usesSoon.length ? `<div class="rescue">Uses up: ${esc(r.usesSoon.join(", "))}</div>` : ""}
    ${r.frozen.length ? `<div class="defrost">Defrost first: ${esc(frozenNames(r.frozen).join(", "))}</div>` : ""}
    <div class="missing">${r.missing.length ? `Need: <b>${esc(r.missing.join(", "))}</b>` : "You have everything"}</div>
    ${familyLines(r.recipe)}
  </button>`;
}

// ---------- Time to cook today ----------
// Asked at the top of Recipes; the answer lasts for the day, then the question comes back.

function cookTime() {
  return todaysChoice(state.settings.cookTime, isoDay(new Date()));
}

function timeSummary(t) {
  const prep = t.prep.map((id) => PREP_OPTIONS.find((o) => o.id === id).label.toLowerCase());
  const time = Number.isFinite(t.max) ? `${t.label} or less` : "no time limit";
  return [time, ...prep].join(", ");
}

function renderTimeCard() {
  const t = cookTime();
  const open = ui.timeOpen || !t;
  $("#time-ask").hidden = !open;
  $("#time-summary").hidden = open;
  $("#time-card").classList.toggle("folded", !open);
  $("#time-options").innerHTML = TIME_OPTIONS.map((o) =>
    `<button class="chip ${t?.time === o.id ? "active" : ""}" data-time="${o.id}" aria-pressed="${t?.time === o.id}">${o.label}</button>`).join("");
  $("#prep-options").innerHTML = PREP_OPTIONS.map((o) =>
    `<button class="chip prep-chip ${t?.prep.includes(o.id) ? "active" : ""}" data-prep="${o.id}" aria-pressed="${Boolean(t?.prep.includes(o.id))}" title="${o.hint}">${o.label}<small>${o.hint}</small></button>`).join("");
  if (t) $("#time-summary-text").innerHTML = `Cooking today: <b>${esc(timeSummary(t))}</b>`;
}

function setCookTime(change) {
  const t = cookTime() || { time: "any", prep: [] };
  const next = { day: isoDay(new Date()), time: t.time, prep: [...t.prep], ...change };
  state.settings.cookTime = next;
  persist();
  renderRecipes();
}

$("#time-card").addEventListener("click", (e) => {
  const time = e.target.closest("[data-time]");
  const prep = e.target.closest("[data-prep]");
  if (time) { ui.timeOpen = false; setCookTime({ time: time.dataset.time }); }
  else if (prep) {
    const p = new Set(cookTime()?.prep || []);
    p.has(prep.dataset.prep) ? p.delete(prep.dataset.prep) : p.add(prep.dataset.prep);
    ui.timeOpen = true; setCookTime({ prep: [...p] });
  } else if (e.target.closest("#time-change")) { ui.timeOpen = true; renderTimeCard(); }
});

$("#recipes").addEventListener("click", (e) => {
  if (e.target.closest('[data-act="time-clear"]')) { e.stopPropagation(); ui.timeOpen = true; setCookTime({ time: "any", prep: [] }); }
  if (e.target.closest('[data-act="toggle-blocked"]')) { e.stopPropagation(); ui.showBlocked = !ui.showBlocked; renderRecipes(); }
}, true);

function renderRecipeFolds() {
  const shut = folded();
  for (const [el, id] of [["#ideas", "rec-ideas"], ["#rec-filters", "rec-filters"], ["#rec-book", "rec-book"]]) {
    $(el).classList.toggle("collapsed", shut.has(id));
    $(`[data-fold="${id}"]`).setAttribute("aria-expanded", String(!shut.has(id)));
  }
  const n = (ui.recipeFilter !== "ready" ? 1 : 0) + (ui.meal !== "any" ? 1 : 0) + ui.keywords.size;
  $("#filter-count").textContent = n ? `${n} on` : "";
}

function renderRecipes() {
  renderRecipeFolds();
  renderTimeCard();
  renderMealFilter();
  renderIdeas();
  $$("#recipe-filter .chip").forEach((c) => c.classList.toggle("active", c.dataset.filter === ui.recipeFilter));

  renderKeywordFilter();
  const q = searchText(ui.recipeSearch);
  document.body.classList.toggle("searching", Boolean(q));
  $("#library-title").textContent = q ? "Search results" : "From the recipe book";
  if (q) return renderSearch(q);

  const ranked = recommend(allRecipes(), state.inventory, { assumeStaples: state.settings.assumeStaples });
  let list = ranked;
  if (ui.keywords.size) list = list.filter((r) => { const ks = keywordsFor(r.recipe); return [...ui.keywords].every((k) => ks.includes(k)); });
  const time = cookTime();
  if (time) list = list.filter((r) => fitsTime(r.recipe, time));
  if (ui.meal !== "any") list = list.filter((r) => mealsFor(r.recipe).includes(ui.meal));
  const blockedCount = list.filter(isBlocked).length;
  if (!ui.showBlocked) list = list.filter((r) => !isBlocked(r));

  const f = ui.recipeFilter;
  if (f === "ready") list = list.filter((r) => r.missing.length === 0 && r.have.length);
  if (f === "almost") list = list.filter((r) => r.missing.length >= 1 && r.missing.length <= 2 && r.have.length);
  if (f === "mine") list = list.filter((r) => r.recipe.custom);
  if (f === "rescue") list = list.filter((r) => r.usesSoon.length).sort((a, b) => b.usesSoon.length - a.usesSoon.length || a.missing.length - b.missing.length);

  if (!list.length && ui.keywords.size) {
    const where = { ready: "Ready to cook", almost: "Almost there", mine: "Mine", rescue: "this list", all: "All" }[f];
    $("#recipes").innerHTML = `<div class="empty">Nothing in ${where} matches ${[...ui.keywords].map((k) => `"${KEYWORD_LABEL[k]}"`).join(" + ")}.${f !== "all" ? ` <button class="btn small" data-act="kw-all">Show All recipes</button>` : ""}</div>`;
    return;
  }
  if (!list.length && time && (Number.isFinite(time.max) || time.prep.length)) {
    $("#recipes").innerHTML = `<div class="empty">Nothing here fits ${esc(timeSummary(time))}. <button class="btn small" data-act="time-clear">Show any time</button></div>`;
    return;
  }
  if (!list.length) {
    const hint = {
      ready: state.inventory.length
        ? "Nothing you can make with exactly what you have yet. Check \"Almost there\"."
        : "Add what's in your fridge and pantry and recipes will show up here.",
      almost: "No close matches yet. Add more items to your kitchen.",
      mine: "No saved recipes yet. Add one from the Scan tab.",
      rescue: "Nothing is about to expire.",
      all: "No recipes match.",
    }[f];
    $("#recipes").innerHTML = blockedNote(blockedCount) + `<div class="empty">${hint}</div>`;
    return;
  }
  $("#recipes").innerHTML = blockedNote(blockedCount) + list.map(recipeCard).join("");
}

// Search: every recipe (yours, the book and Claude's ideas), ignoring the other
// filters so nothing is hidden. Forgiving: "Wings" finds "Crispy Chicken Wings"
// and recipes with "chicken wing" in them.
function recipeHaystack(recipe) {
  return searchText([
    recipe.title, ...(recipe.tags || []), ...recipe.ingredients.map((i) => i.name),
    ...keywordsFor(recipe).map((k) => KEYWORD_LABEL[k]), ...mealsFor(recipe).map((m) => MEAL_TYPE_LABEL[m]),
  ].join(" "));
}

function renderSearch(q) {
  const words = q.split(" ").filter(Boolean);
  const pool = [...allRecipes(), ...state.ideas.recipes];
  const list = recommend(pool, state.inventory, { assumeStaples: state.settings.assumeStaples })
    .filter((r) => { const hay = recipeHaystack(r.recipe); return words.every((w) => hay.includes(w)); })
    .sort((a, b) => (searchText(b.recipe.title).includes(q) - searchText(a.recipe.title).includes(q)) || b.score - a.score);
  $("#recipes").innerHTML = list.length
    ? `<p class="muted small search-count">${list.length} recipe${list.length === 1 ? "" : "s"} for "${esc(ui.recipeSearch)}"</p>` + list.map(recipeCard).join("")
    : `<div class="empty">No recipes for "${esc(ui.recipeSearch)}" yet. <button class="btn small" data-act="ask-claude">Ask Claude for ${esc(ui.recipeSearch)} ideas</button></div>`;
}

// Suggested meals: a line on each recipe and a filter row.
function mealLine(recipe) {
  return `<div class="meal-for">Suggested for ${mealsFor(recipe).map((m) => `<span class="meal-tag meal-${m}">${MEAL_TYPE_LABEL[m]}</span>`).join("")}</div>`;
}

function renderMealFilter() {
  $("#meal-filter").innerHTML = `<span class="meal-row-label">Suggested for</span>` +
    [{ id: "any", label: "Any meal" }, ...MEAL_TYPES].map((m) =>
      `<button class="chip ${ui.meal === m.id ? "active" : ""}" data-meal="${m.id}" aria-pressed="${ui.meal === m.id}">${m.label}</button>`).join("");
}

$("#meal-filter").addEventListener("click", (e) => {
  const b = e.target.closest("[data-meal]");
  if (!b) return;
  ui.meal = b.dataset.meal;
  renderRecipes();
});

// Family preferences on the Recipes tab (for whoever is eating that day; today unless given).
const todayIso = () => isoDay(new Date());
const isBlocked = (r, day = todayIso()) => familyCheck(r.recipe, state.family, day).blocked.length > 0;

function blockedNote(n) {
  if (!n) return "";
  const who = eating(state.family, todayIso()).map((m) => m.name);
  return `<div class="family-hidden">${ui.showBlocked ? `Showing ${n} recipe${n > 1 ? "s" : ""} someone won't eat.` : `Hiding ${n} recipe${n > 1 ? "s" : ""} ${esc(who.length > 1 ? "someone at the table" : who[0] || "someone")} won't eat.`}
    <button class="btn small" data-act="toggle-blocked">${ui.showBlocked ? "Hide them" : "Show them"}</button></div>`;
}

function familyLines(recipe) {
  return familyNotes(familyCheck(recipe, state.family, todayIso()))
    .map((n) => `<div class="fam-note fam-${n.kind}">${esc(n.text)}</div>`).join("");
}

// Scenario keywords: pick any number; a recipe has to match all of them.
const KW_COLORS = ["var(--olive)", "var(--raspberry)", "var(--sun)", "var(--lilac)", "var(--pink)", "var(--coral)"];
const kwColor = (id) => KW_COLORS[KEYWORD_IDS.indexOf(id) % KW_COLORS.length];

function kwPills(recipe, max = Infinity) {
  const ks = keywordsFor(recipe);
  if (!ks.length) return "";
  const shown = ks.slice(0, max);
  return `<div class="kw-pills">${shown.map((k) => `<span class="kw" style="--kw:${kwColor(k)}">${esc(KEYWORD_LABEL[k])}</span>`).join("")}${ks.length > shown.length ? `<span class="kw more">+${ks.length - shown.length}</span>` : ""}</div>`;
}

function renderKeywordFilter() {
  $("#keyword-filter").innerHTML =
    KEYWORDS.map((k) => `<button class="kw-chip ${ui.keywords.has(k.id) ? "on" : ""}" style="--kw:${kwColor(k.id)}" data-kw="${k.id}" aria-pressed="${ui.keywords.has(k.id)}">${esc(k.label)}</button>`).join("") +
    (ui.keywords.size ? `<button class="kw-chip clear" data-kw-clear>Clear</button>` : "");
}

$("#keyword-filter").addEventListener("click", (e) => {
  const chip = e.target.closest("[data-kw]");
  if (e.target.closest("[data-kw-clear]")) ui.keywords.clear();
  else if (chip) {
    const k = chip.dataset.kw;
    ui.keywords.has(k) ? ui.keywords.delete(k) : ui.keywords.add(k);
  } else return;
  renderRecipes();
});

$("#recipe-filter").addEventListener("click", (e) => {
  const chip = e.target.closest(".chip");
  if (!chip) return;
  ui.recipeFilter = chip.dataset.filter;
  renderRecipes();
});

$("#recipe-search").addEventListener("input", (e) => {
  ui.recipeSearch = e.target.value.trim();
  renderRecipes();
});

$("#recipes").addEventListener("click", (e) => {
  if (e.target.closest("[data-act=ask-claude]")) {
    $("#ai-request").value = ui.recipeSearch;
    ui.recipeSearch = "";
    $("#recipe-search").value = "";
    renderRecipes();
    fetchIdeas({ fresh: true });
    window.scrollTo({ top: 0, behavior: "smooth" });
    return;
  }
  if (e.target.closest("[data-act=kw-all]")) {
    ui.recipeFilter = "all";
    return renderRecipes();
  }
  const card = e.target.closest("[data-recipe]");
  if (card) openRecipe(card.dataset.recipe);
});

function findRecipe(id) {
  return allRecipes().find((r) => r.id === id) || state.ideas.recipes.find((r) => r.id === id);
}

function openRecipe(id) {
  const recipe = findRecipe(id);
  if (!recipe) return;
  const [r] = recommend([recipe], state.inventory, { assumeStaples: state.settings.assumeStaples });
  const have = new Set([...r.have, ...r.optionalHave]);
  const missing = new Set(r.missing);
  const isIdea = Boolean(recipe.idea);

  $("#recipe-detail").innerHTML = `
    <h2>${esc(recipe.title)}</h2>
    <p class="muted">${recipe.minutes} min &middot; serves ${recipe.servings}${kcalText(recipe) ? ` &middot; <span class="kcal" title="Estimated per serving from the ingredients, without optional extras">${kcalText(recipe)} per serving</span>` : ""}${r.usesSoon.length ? ` &middot; <span class="rescue">uses up ${esc(r.usesSoon.join(", "))}</span>` : ""}</p>
    ${mealLine(recipe)}
    ${kwPills(recipe)}
    ${familyLines(recipe)}
    ${r.frozen.length ? `<p class="defrost-note">Defrost first: ${r.frozen.map((n) => `${esc(frozenItemFor(n)?.name || n)} (${esc(defrostHint(frozenItemFor(n) || { name: n }))})`).join(", ")}.</p>` : ""}
    <details class="fold-details" open><summary><h3>Ingredients</h3></summary>
    <ul class="ing-list">
      ${recipe.ingredients.map((ing) => {
        const cls = have.has(ing.name) ? "ok" : missing.has(ing.name) ? "no" : "opt";
        const mark = cls === "ok" ? "&#10003;" : cls === "no" ? "&#10007;" : "&middot;";
        const ice = r.frozen.includes(ing.name) ? ' <span class="ice-tag">frozen</span>' : "";
        return `<li><span class="${cls}">${mark}</span><span>${esc(formatQty(ing.qty, ing.unit))} ${esc(ing.name)}${ing.optional ? ' <span class="muted">(optional)</span>' : ""}${ice}</span></li>`;
      }).join("")}
    </ul></details>
    <details class="fold-details" open><summary><h3>Steps</h3></summary>
    <ol class="steps">${recipe.steps.map((s) => `<li>${esc(s)}</li>`).join("")}</ol></details>
    <div class="row end">
      ${recipe.custom && !recipe.edited ? `<button class="btn danger" data-act="delete">Delete</button>` : ""}
      ${recipe.edited ? `<button class="btn" data-act="restore">Restore original</button>` : ""}
      <button class="btn" data-act="edit">Edit</button>
      ${isIdea ? `<button class="btn" data-act="keep">Save to my recipes</button>` : ""}
      ${r.missing.length ? `<button class="btn" data-act="shop">Add ${r.missing.length} to shopping list</button>` : ""}
      <button class="btn" data-act="plan">Plan it</button>
      <button class="btn primary" data-act="cook">I cooked this</button>
      <button class="btn" data-act="close">Close</button>
    </div>`;

  const dlg = $("#recipe-dialog");
  dlg.onclick = (e) => {
    if (e.target === dlg) return dlg.close();
    const act = e.target.closest("[data-act]")?.dataset.act;
    if (!act) return;
    if (act === "close") dlg.close();
    if (act === "shop") {
      addToShopping(r.missing, [recipe]);
      toast(`Added ${r.missing.length} to your shopping list`);
      dlg.close();
    }
    if (act === "cook") {
      const { inventory, unchanged } = cookRecipe(recipe, state.inventory);
      state.inventory = inventory;
      commit();
      dlg.close();
      toast(unchanged.length ? `Updated your kitchen. Check amounts of: ${unchanged.join(", ")}` : "Enjoy! Your kitchen has been updated.");
    }
    if (act === "delete") {
      state.customRecipes = state.customRecipes.filter((x) => x.id !== recipe.id);
      commit();
      dlg.close();
    }
    if (act === "edit") return openRecipeEditor(recipe.id);
    if (act === "restore") {
      state.customRecipes = state.customRecipes.filter((x) => x.id !== recipe.id);
      commit();
      toast("Back to the original recipe");
      return openRecipe(recipe.id);
    }
    if (act === "plan") {
      dlg.close();
      return openPlanFor(recipe);
    }
    if (act === "keep") {
      state.ideas.recipes = state.ideas.recipes.filter((x) => x !== recipe);
      saveCustomRecipe({ ...recipe, id: undefined, idea: undefined, tags: ["mine", "claude"] });
      dlg.close();
      toast("Saved to your recipes");
    }
  };
  if (!dlg.open) dlg.showModal();
}

// ---------- Edit a recipe ----------
// Any recipe can be corrected: your own and imported ones are changed in place;
// a recipe-book recipe or one of Claude's ideas is saved as your version (same id,
// so plans and favourites still find it), and a book recipe can be restored.

function ingRow(ing = { qty: 1, unit: "count", name: "", optional: false }) {
  return `<div class="ing-edit">
    <input class="ie-qty" type="number" min="0" step="any" value="${esc(String(ing.qty ?? ""))}" aria-label="Amount" />
    <select class="ie-unit" aria-label="Unit">${unitOptions(normalizeUnit(ing.unit) || "count")}</select>
    <input class="ie-name" list="food-names" value="${esc(ing.name || "")}" placeholder="Ingredient" aria-label="Ingredient" />
    <label class="ie-opt" title="Optional"><input type="checkbox" ${ing.optional ? "checked" : ""} /> optional</label>
    <button type="button" class="x" data-ie="del" aria-label="Remove ingredient">&times;</button>
  </div>`;
}

function openRecipeEditor(id, { checking = false } = {}) {
  const recipe = findRecipe(id);
  if (!recipe) return;
  const meals = mealsFor(recipe);
  $("#recipe-detail").innerHTML = `
    <form id="recipe-edit" class="recipe-edit" autocomplete="off">
      <h2>${checking ? "Check your recipe" : "Edit recipe"}</h2>
      ${checking ? `<p class="muted small">Here's what was read. Fix anything that came out wrong, then save.</p>` : ""}
      ${!recipe.custom ? `<p class="muted small">This saves your own version. You can restore the original any time.</p>` : ""}
      <label class="field">Name<input name="title" value="${esc(recipe.title)}" required /></label>
      <div class="row two">
        <label class="field">Minutes<input name="minutes" type="number" min="1" step="1" value="${recipe.minutes || 30}" /></label>
        <label class="field">Serves<input name="servings" type="number" min="1" step="1" value="${recipe.servings || 2}" /></label>
      </div>
      <div class="field">Suggested for
        <div class="chips">${MEAL_TYPES.map((m) => `<label class="chip check-chip"><input type="checkbox" name="meal" value="${m.id}" ${meals.includes(m.id) ? "checked" : ""} />${m.label}</label>`).join("")}</div>
      </div>
      <h3>Ingredients</h3>
      <div id="ie-list">${recipe.ingredients.map(ingRow).join("")}</div>
      <button type="button" class="btn small" data-ie="add">+ Add ingredient</button>
      <h3>Steps</h3>
      <p class="muted small">One step per line.</p>
      <textarea name="steps" rows="7">${esc((recipe.steps || []).join("\n"))}</textarea>
      <div class="row end">
        <button type="button" class="btn" data-ie="cancel">Cancel</button>
        <button type="submit" class="btn primary">Save</button>
      </div>
    </form>`;

  const form = $("#recipe-edit");
  form.addEventListener("click", (e) => {
    const act = e.target.closest("[data-ie]")?.dataset.ie;
    if (act === "add") {
      $("#ie-list").insertAdjacentHTML("beforeend", ingRow());
      $("#ie-list .ing-edit:last-child .ie-name").focus();
    }
    if (act === "del") e.target.closest(".ing-edit").replaceWith();
    if (act === "cancel") openRecipe(recipe.id);
  });
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const ingredients = [...form.querySelectorAll(".ing-edit")].map((row) => ({
      name: typedName(row.querySelector(".ie-name").value),
      qty: Number(row.querySelector(".ie-qty").value) || 1,
      unit: row.querySelector(".ie-unit").value,
      optional: row.querySelector(".ie-opt input").checked,
    })).filter((i) => i.name).map((i) => ({ ...i, typed: true }));
    if (!ingredients.length) return toast("Add at least one ingredient");
    const chosen = [...form.querySelectorAll('input[name="meal"]:checked')].map((i) => i.value);
    const fromBook = !recipe.custom && !recipe.idea;
    const saved = saveCustomRecipe({
      ...recipe,
      id: recipe.id,
      title: form.title.value,
      minutes: Math.max(1, Math.round(Number(form.minutes.value) || 30)),
      servings: Math.max(1, Math.round(Number(form.servings.value) || 2)),
      meals: chosen.length ? chosen : undefined,
      ingredients,
      steps: form.steps.value.split("\n").map((x) => x.trim()).filter(Boolean),
      keywords: recipe.custom || recipe.idea ? recipe.keywords : keywordsFor(recipe),
      tags: recipe.custom ? recipe.tags : [...(recipe.tags || []), "mine"],
      edited: recipe.edited || fromBook,
      idea: undefined,
    });
    if (recipe.idea) state.ideas.recipes = state.ideas.recipes.filter((x) => x.id !== recipe.id);
    commit();
    toast(`Saved "${saved.title}"`);
    openRecipe(saved.id);
  });
  const dlg = $("#recipe-dialog");
  dlg.onclick = (e) => { if (e.target === dlg) dlg.close(); };
  if (!dlg.open) dlg.showModal();
}

// ---------- Fresh recipe ideas ----------
// On claude.ai the page asks Claude through the viewer's own account (the
// `sample` capability). Run locally, it uses the API key from Settings.
// Ideas are fetched automatically when the Recipes tab opens and the set of
// ingredients has changed since the last batch.

let sampleFn = null;
const ideas = { loading: false, ctl: null, error: "", blocked: false, autoTried: new Set() };
const HIDE_CODES = ["not_granted", "sampling_disabled", "not_declared", "capability_disabled", "capability_removed"];

const kitchenKey = () => {
  const t = cookTime();
  return [...new Set(state.inventory.map((it) => it.name))].sort().join("|") + (t ? `@${t.time}:${t.prep.join(",")}` : "") +
    (familyRequest(state.family, todayIso()) ? "#" + familyRequest(state.family, todayIso()) : "") + (ui.meal !== "any" ? "~" + ui.meal : "");
};

function ideaSource() {
  if (sampleFn && !ideas.blocked) return "sample";
  if (claudeOn()) return "key";
  return null;
}

function renderIdeas() {
  const src = ideaSource();
  const show = Boolean(src) && state.inventory.length > 0 && ui.recipeFilter !== "mine";
  $("#ideas").hidden = !show;
  $("#ideas-hint").hidden = Boolean(src) || !state.inventory.length || Boolean(window.claude);
  if (!show) return;

  const key = kitchenKey();
  const current = state.ideas.key === key;
  if (!current && !ideas.loading && !ideas.autoTried.has(key)) {
    ideas.autoTried.add(key);
    setTimeout(() => fetchIdeas(), 0);
  }

  const recipes = state.ideas.recipes;
  if (ideas.loading && !recipes.length) {
    $("#ideas-list").innerHTML = '<div class="skeleton"></div><div class="skeleton"></div><div class="skeleton"></div>';
  } else if (recipes.length) {
    const ranked = recommend(recipes, state.inventory, { assumeStaples: state.settings.assumeStaples })
      .filter((r) => !ui.keywords.size || [...ui.keywords].every((k) => keywordsFor(r.recipe).includes(k)))
      .filter((r) => !cookTime() || fitsTime(r.recipe, cookTime()))
      .filter((r) => !isBlocked(r))
      .filter((r) => ui.meal === "any" || mealsFor(r.recipe).includes(ui.meal));
    $("#ideas-list").innerHTML = ranked.length
      ? ranked.map(recipeCard).join("")
      : `<div class="empty">None of these ideas match ${[...[...ui.keywords].map((k) => `"${KEYWORD_LABEL[k]}"`), ...(cookTime() ? [esc(timeSummary(cookTime()))] : [])].join(" + ")}. Tap More ideas for new ones.</div>`;
  } else {
    $("#ideas-list").innerHTML = "";
  }

  $("#ideas-status").textContent = ideas.loading
    ? recipes.length ? "Updating for what you have now..." : "Finding recipes for what you have..."
    : ideas.error || (current && recipes.length ? "Made for what's in your kitchen now" : "");
  $("#ai-suggest").disabled = ideas.loading;
  $("#ai-suggest").textContent = ideas.loading ? "Thinking..." : $("#ai-request").value.trim() ? "Get ideas" : "More ideas";
  $("#ideas-stop").hidden = !(ideas.loading && ideas.ctl && src === "sample");
}

async function fetchIdeas({ fresh = false, more = false } = {}) {
  const src = ideaSource();
  if (!src || ideas.loading || !state.inventory.length) return;
  const key = kitchenKey();
  const ctl = new AbortController();
  Object.assign(ideas, { loading: true, error: "", ctl });
  renderIdeas();

  const opts = {
    soon: state.inventory.filter((it) => daysLeft(it) <= SOON_DAYS).map((it) => it.name),
    request: [$("#ai-request").value.trim(), timeRequest(cookTime()), familyRequest(state.family, todayIso()), ui.meal !== "any" ? `These are for ${ui.meal}, so every recipe must suit ${ui.meal}` : ""].filter(Boolean).join(". "),
    exclude: more ? state.ideas.recipes.map((r) => r.title) : [],
  };
  try {
    const ai = await import("./ai.js");
    const raw = src === "sample"
      ? await ai.suggestRecipesWithSample(sampleFn, state.inventory, opts, { fresh, signal: ctl.signal })
      : await ai.suggestRecipesWithClaude(state.settings.apiKey, state.inventory, opts);
    if (!raw.length) throw { code: "empty_completion" };
    state.ideas = {
      key,
      recipes: raw.map((r) => ({
        ...r,
        id: "idea-" + newId(),
        tags: ["idea"],
        idea: true,
        ingredients: r.ingredients.map((i) => ({ ...i, name: canonicalName(i.name), unit: normalizeUnit(i.unit) })),
      })),
    };
    persist();
  } catch (err) {
    const code = err?.code;
    if (code !== "cancelled") console.error(err);
    if (HIDE_CODES.includes(code)) ideas.blocked = true;
    else if (code === "rate_limited") ideas.error = "Usage limit reached. Try again a bit later.";
    else if (code === "session_expired") ideas.error = "Sign in to claude.ai again to get ideas.";
    else if (code !== "cancelled") ideas.error = !code && err?.message ? err.message : "Couldn't get ideas just now.";
  } finally {
    Object.assign(ideas, { loading: false, ctl: null });
    if (ui.tab === "recipes") renderRecipes();
  }
}

$("#ideas-list").addEventListener("click", (e) => {
  const card = e.target.closest("[data-recipe]");
  if (card) openRecipe(card.dataset.recipe);
});

$("#ai-suggest").addEventListener("click", () => fetchIdeas({ fresh: true, more: !$("#ai-request").value.trim() }));
$("#ai-request").addEventListener("input", () => renderIdeas());
$("#ai-request").addEventListener("keydown", (e) => {
  if (e.key === "Enter") fetchIdeas({ fresh: true });
});
$("#ideas-stop").addEventListener("click", () => ideas.ctl?.abort());

window.claude?.use?.("sample").then(async (fn) => {
  sampleFn = fn;
  const limits = fn ? await fn.limits().catch(() => null) : null;
  photoSample = limits?.images ? fn : null;
  updateScanEngine();
  if (ui.tab === "recipes") renderRecipes();
}).catch(() => {});

// ---------- Meal plan ----------

const planUi = { week: 0, slot: null, recipe: null, meal: "dinner", month: 0, selected: null };

function kcalOf(recipe) {
  return estimateCalories(recipe).perServing;
}

function kcalText(recipe) {
  const k = kcalOf(recipe);
  return k > 0 ? `~${k} kcal` : "";
}

const shortDate = (d) => d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
const dayMonth = (d) => d.toLocaleDateString(undefined, { month: "short", day: "numeric" });

// Ideas from Claude are saved to "Mine" when planned, so the plan never points at something that disappears.
function entryFor(recipe) {
  let r = recipe;
  if (recipe.idea) {
    state.ideas.recipes = state.ideas.recipes.filter((x) => x !== recipe);
    r = saveCustomRecipe({ ...recipe, id: undefined, idea: undefined, tags: ["mine", "claude"] });
  }
  return { recipeId: r.id, title: r.title, kcal: kcalOf(r) };
}

function setPlan(day, meal, entry) {
  const plan = { ...state.plan, [day]: { ...(state.plan[day] || {}) } };
  if (entry) plan[day][meal] = entry;
  else delete plan[day][meal];
  state.plan = prunePlan(plan);
  commit();
}

// Take a meal off the plan, with a quick way to put it back.
function removePlanned(day, meal) {
  const was = state.plan[day]?.[meal];
  if (!was) return;
  setPlan(day, meal, null);
  toast(`Removed ${was.title || was.text} from ${meal}`, { action: "Undo", onAction: () => setPlan(day, meal, was) });
}

function defaultMeal(recipe) {
  const tags = recipe.tags || [];
  if (tags.includes("breakfast")) return "breakfast";
  if (tags.includes("lunch") || tags.includes("salad")) return "lunch";
  return "dinner";
}

function weekMissing(days) {
  const ids = plannedRecipeIds(state.plan, days, isoDay(new Date()));
  const missing = new Set();
  for (const id of ids) {
    const recipe = findRecipe(id);
    if (!recipe) continue;
    const [r] = recommend([recipe], state.inventory, { assumeStaples: state.settings.assumeStaples });
    r.missing.forEach((m) => missing.add(m));
  }
  return [...missing];
}

// Month calendar: dots show planned meals; tap a day to jump to it in the week below.
function renderMonth() {
  const base = new Date();
  const first = new Date(base.getFullYear(), base.getMonth() + planUi.month, 1);
  const today = isoDay(base);
  $("#month-title").textContent = first.getFullYear();
  $("#month-sub").textContent = first.toLocaleDateString(undefined, { month: "long" });
  const lead = (first.getDay() + 6) % 7; // Monday first
  const start = new Date(first.getFullYear(), first.getMonth(), 1 - lead);
  const cells = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
    if (i >= 35 && d.getMonth() !== first.getMonth()) break;
    const iso = isoDay(d);
    const day = state.plan[iso] || {};
    const dots = MEALS.filter((m) => day[m]).map((m) => `<i class="mk ${m}"></i>`).join("");
    const cls = [d.getMonth() !== first.getMonth() ? "out" : "", iso === today ? "today" : "", iso === planUi.selected ? "sel" : ""].join(" ");
    cells.push(`<button class="mday ${cls}" data-day-jump="${iso}" aria-label="${d.toDateString()}${dots ? ", meals planned" : ""}"><span>${d.getDate()}</span><em>${dots}</em></button>`);
  }
  $("#month-grid").innerHTML = ["M", "T", "W", "T", "F", "S", "S"].map((w) => `<b>${w}</b>`).join("") + cells.join("");
}

$("#month-prev").addEventListener("click", () => { planUi.month--; renderMonth(); });
$("#month-next").addEventListener("click", () => { planUi.month++; renderMonth(); });
$("#month-grid").addEventListener("click", (e) => {
  const iso = e.target.closest("[data-day-jump]")?.dataset.dayJump;
  if (!iso) return;
  const monday = (d) => { const x = new Date(d); x.setHours(0, 0, 0, 0); x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); return x; };
  planUi.week = Math.round((monday(fromIsoDay(iso)) - monday(new Date())) / (7 * 864e5));
  planUi.selected = iso;
  renderPlan();
  document.querySelector(`[data-day-card="${iso}"]`)?.scrollIntoView({ behavior: "smooth", block: "center" });
});

function renderPlan() {
  renderMonth();
  const days = weekDays(planUi.week);
  const today = isoDay(new Date());
  $("#plan-title").textContent =
    { 0: "This week", 1: "Next week", "-1": "Last week" }[planUi.week] ?? `Week of ${dayMonth(days[0])}`;
  $("#plan-range").textContent = `${dayMonth(days[0])} to ${dayMonth(days[6])}`;

  let meals = 0;
  const totals = [];
  for (const d of days) {
    const c = dayCalories(state.plan[isoDay(d)]);
    meals += c.meals;
    if (c.meals) totals.push(c.total);
  }
  const avg = totals.length ? Math.round(totals.reduce((a, b) => a + b, 0) / totals.length / 10) * 10 : 0;
  const missing = weekMissing(days);
  $("#plan-summary").innerHTML = `
    <div class="plan-stats">
      <div><b>${meals}<small>/21</small></b><span>meals planned</span></div>
      <div><b>${avg ? "~" + avg : "&ndash;"}</b><span>avg kcal a day</span></div>
      <div><b>${missing.length}</b><span>to buy</span></div>
    </div>
    ${missing.length ? `<button class="btn small" data-act="plan-shop">Add ${missing.length} missing ingredient${missing.length === 1 ? "" : "s"} to shopping list</button>` : ""}`;

  $("#plan-days").innerHTML = days.map((d) => {
    const iso = isoDay(d);
    const day = state.plan[iso] || {};
    const c = dayCalories(day);
    return `<div class="plan-day ${iso === today ? "today" : ""} ${iso < today ? "past" : ""} ${iso === planUi.selected ? "picked" : ""}" data-day-card="${iso}">
      <div class="plan-day-head">
        <div><b>${d.toLocaleDateString(undefined, { weekday: "long" })}</b> <span class="muted small">${dayMonth(d)}${iso === today ? " &middot; today" : ""}</span></div>
        ${c.meals ? `<span class="day-kcal">${c.known ? "" : "at least "}~${c.total} kcal</span>` : ""}
      </div>
      ${defrostNote(iso)}
      <div class="slots">
        ${MEALS.map((m) => {
          const e = day[m];
          const ref = `${iso}|${m}`;
          if (!e) return `<button class="slot empty meal-${m}" data-pick="${ref}"><span class="slot-label">${MEAL_LABEL[m]}</span><span class="slot-add">+ Add</span></button>`;
          return `<div class="slot filled meal-${m}">
            <button class="slot-main" data-open="${ref}"><span class="slot-label">${MEAL_LABEL[m]}</span><span class="slot-title">${esc(e.title || e.text)}</span>${Number.isFinite(e.kcal) && e.kcal > 0 ? `<span class="slot-kcal">~${e.kcal} kcal</span>` : ""}</button>
            <button class="x" data-clear="${ref}" aria-label="Clear ${m}">&times;</button>
          </div>`;
        }).join("")}
      </div>
    </div>`;
  }).join("");
}

$("#plan-prev").addEventListener("click", () => { planUi.week--; renderPlan(); });
$("#plan-next").addEventListener("click", () => { planUi.week++; renderPlan(); });
$("#plan-summary").addEventListener("click", (e) => {
  if (!e.target.closest("[data-act=plan-shop]")) return;
  const days = weekDays(planUi.week);
  const missing = weekMissing(days);
  addToShopping(missing, plannedRecipeIds(state.plan, days, isoDay(new Date())).map(findRecipe).filter(Boolean));
  toast(`Added ${missing.length} to your shopping list`);
});
$("#plan-days").addEventListener("click", (e) => {
  const pick = e.target.closest("[data-pick]")?.dataset.pick;
  const clear = e.target.closest("[data-clear]")?.dataset.clear;
  const open = e.target.closest("[data-open]")?.dataset.open;
  if (pick) return openSlotPicker(...pick.split("|"));
  if (clear) return removePlanned(...clear.split("|"));
  if (open) {
    const [day, meal] = open.split("|");
    const id = state.plan[day]?.[meal]?.recipeId;
    return id && findRecipe(id) ? openRecipe(id) : openSlotPicker(day, meal);
  }
});

// Picker: choose a recipe (or type something) for one day's meal.
function pickList() {
  const { meal } = planUi.slot;
  const q = ($("#plan-search")?.value || "").trim().toLowerCase();
  const suits = (r) => mealsFor(r.recipe).includes(meal);
  const pool = [...allRecipes(), ...state.ideas.recipes];
  const ranked = recommend(pool, state.inventory, { assumeStaples: state.settings.assumeStaples })
    .filter((r) => !q || r.recipe.title.toLowerCase().includes(q) || r.recipe.ingredients.some((i) => i.name.includes(q)))
    .sort((a, b) => (isBlocked(a, planUi.slot.day) - isBlocked(b, planUi.slot.day)) || (suits(b) - suits(a)) || b.score - a.score)
    .slice(0, 40);
  return ranked.length
    ? ranked.map((r) => `<button class="pick" data-recipe="${esc(r.recipe.id)}"><b>${esc(r.recipe.title)}</b>
        <span>${r.recipe.minutes} min${kcalText(r.recipe) ? " &middot; " + kcalText(r.recipe) : ""} &middot; ${r.missing.length ? `need ${r.missing.length}` : "you have everything"}${r.recipe.idea ? " &middot; idea" : ""}${isBlocked(r, planUi.slot.day) ? " &middot; someone won't eat this" : ""}${suits(r) ? "" : ` &middot; usually ${mealsFor(r.recipe).map((m) => MEAL_TYPE_LABEL[m].toLowerCase()).join(" or ")}`}</span></button>`).join("")
    : `<div class="empty">No recipes match.</div>`;
}

function openSlotPicker(day, meal) {
  planUi.slot = { day, meal };
  planUi.recipe = null;
  const d = fromIsoDay(day);
  $("#plan-detail").innerHTML = `
    <h2>${MEAL_LABEL[meal]} &middot; ${esc(shortDate(d))}</h2>
    <input id="plan-search" type="search" placeholder="Search recipes or ingredients" aria-label="Search recipes" />
    <div class="pick-list" id="pick-list">${pickList()}</div>
    <h3>Or something else</h3>
    <div class="row">
      <input id="plan-text" placeholder="Leftovers, eating out..." aria-label="Something else" />
      <input id="plan-text-kcal" type="number" min="0" step="10" placeholder="kcal" aria-label="Calories (optional)" />
      <button class="btn" data-act="plan-text">Add</button>
    </div>
    <div class="row end">${state.plan[day]?.[meal] ? `<button class="btn danger" data-act="unplan">Remove ${esc(state.plan[day][meal].title || state.plan[day][meal].text)}</button>` : ""}<button class="btn" data-act="close">Close</button></div>`;
  $("#plan-search").addEventListener("input", () => { $("#pick-list").innerHTML = pickList(); });
  const dlg = $("#plan-dialog");
  if (!dlg.open) dlg.showModal();
}

// Planner from a recipe: choose the meal and the day.
function renderPlanFor() {
  const recipe = planUi.recipe;
  const days = Array.from({ length: 14 }, (_, i) => { const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() + i); return d; });
  $("#plan-detail").innerHTML = `
    <h2>Plan ${esc(recipe.title)}</h2>
    <p class="muted small">${kcalText(recipe) ? kcalText(recipe) + " per serving &middot; " : ""}pick a meal, then a day</p>
    <div class="chips meal-chips">${MEALS.map((m) => `<button class="chip ${m === planUi.meal ? "active" : ""}" data-meal="${m}">${MEAL_LABEL[m]}</button>`).join("")}</div>
    <div class="pick-days">${days.map((d) => {
      const iso = isoDay(d);
      const taken = state.plan[iso]?.[planUi.meal];
      return `<button class="pick-day ${taken ? "taken" : ""}" data-day="${iso}"><b>${d.toLocaleDateString(undefined, { weekday: "short" })}</b><span>${dayMonth(d)}</span><small>${taken ? esc(taken.title || taken.text) : "free"}</small></button>`;
    }).join("")}</div>
    <div class="row end"><button class="btn" data-act="close">Close</button></div>`;
}

function openPlanFor(recipe) {
  planUi.slot = null;
  planUi.recipe = recipe;
  planUi.meal = defaultMeal(recipe);
  renderPlanFor();
  const dlg = $("#plan-dialog");
  if (!dlg.open) dlg.showModal();
}

$("#plan-dialog").addEventListener("click", (e) => {
  const dlg = $("#plan-dialog");
  if (e.target === dlg) return dlg.close();
  const act = e.target.closest("[data-act]")?.dataset.act;
  if (act === "close") return dlg.close();
  if (act === "unplan" && planUi.slot) {
    dlg.close();
    return removePlanned(planUi.slot.day, planUi.slot.meal);
  }
  const meal = e.target.closest("[data-meal]")?.dataset.meal;
  if (meal) {
    planUi.meal = meal;
    return renderPlanFor();
  }
  const day = e.target.closest("[data-day]")?.dataset.day;
  if (day && planUi.recipe) {
    setPlan(day, planUi.meal, entryFor(planUi.recipe));
    dlg.close();
    return toast(`Planned for ${MEAL_LABEL[planUi.meal].toLowerCase()} on ${shortDate(fromIsoDay(day))}`);
  }
  const id = e.target.closest("[data-recipe]")?.dataset.recipe;
  if (id && planUi.slot) {
    const recipe = findRecipe(id);
    if (recipe) setPlan(planUi.slot.day, planUi.slot.meal, entryFor(recipe));
    return dlg.close();
  }
  if (act === "plan-text" && planUi.slot) {
    const text = $("#plan-text").value.trim();
    if (!text) return $("#plan-text").focus();
    const kcal = parseInt($("#plan-text-kcal").value, 10);
    setPlan(planUi.slot.day, planUi.slot.meal, { text, kcal: Number.isFinite(kcal) ? kcal : null });
    dlg.close();
  }
});

// ---------- Shopping ----------

// names: what to buy. recipes: the recipes they're for, so each item can say how much
// each recipe needs ("3 for Veggie Omelette").
function addToShopping(names, recipes = []) {
  for (const raw of names) {
    const name = canonicalName(raw);
    if (!name) continue;
    let item = state.shopping.find((s) => s.name === name);
    if (!item) {
      item = { id: newId(), name, done: false, addedAt: Date.now() };
      state.shopping.push(item);
    }
    for (const recipe of recipes) {
      const ing = recipe.ingredients.find((i) => i.name === name);
      if (!ing) continue;
      item.needs = (item.needs || []).filter((n) => n.recipe !== recipe.title);
      item.needs.push({ recipe: recipe.title, qty: ing.qty, unit: ing.unit });
    }
  }
  commit();
}

function needsText(item) {
  return (item.needs || []).map((n) => `Need ${formatQty(n.qty, n.unit)} for ${n.recipe}`).join(" &middot; ");
}

function renderShopping() {
  const list = state.shopping;
  const open = list.filter((s) => !s.done).length;
  const badge = $("#shop-count");
  badge.hidden = !open;
  badge.textContent = open;
  $("#shop-actions").hidden = !list.some((s) => s.done);
  $("#shopping").innerHTML = list.length
    ? list.map((s) => `
      <div class="shop-item" data-id="${s.id}">
        <label><input type="checkbox" ${s.done ? "checked" : ""} /><span class="shop-name">${esc(s.name)}${s.needs?.length ? `<small class="shop-need">${esc(needsText(s)).replace(/&amp;middot;/g, "&middot;")}</small>` : ""}</span></label>
        <button class="x" aria-label="Remove ${esc(s.name)}">&times;</button>
      </div>`).join("")
    : `<div class="empty">Your list is empty. Missing recipe ingredients can be added from any recipe.</div>`;
}

$("#shop-form").addEventListener("submit", (e) => {
  e.preventDefault();
  addToShopping([$("#shop-name").value]);
  $("#shop-name").value = "";
});

$("#shopping").addEventListener("click", (e) => {
  const row = e.target.closest(".shop-item");
  if (!row) return;
  if (e.target.closest(".x")) {
    state.shopping = state.shopping.filter((s) => s.id !== row.dataset.id);
    commit();
  }
});

$("#shopping").addEventListener("change", (e) => {
  const row = e.target.closest(".shop-item");
  const item = state.shopping.find((s) => s.id === row?.dataset.id);
  if (item) {
    item.done = e.target.checked;
    commit();
  }
});

$("#shop-clear").addEventListener("click", () => {
  state.shopping = state.shopping.filter((s) => !s.done);
  commit();
});

$("#shop-bought").addEventListener("click", () => {
  const done = state.shopping.filter((s) => s.done);
  state.inventory = addToInventory(state.inventory, done.map((s) => makeItem({ name: s.name })));
  state.shopping = state.shopping.filter((s) => !s.done);
  toast(`Moved ${done.length} item${done.length === 1 ? "" : "s"} to your kitchen. Adjust amounts there.`);
  commit();
});

// ---------- Settings ----------

const settingsDlg = $("#settings-dialog");

$("#open-settings").addEventListener("click", () => {
  $("#set-staples").checked = state.settings.assumeStaples;
  $("#set-name").value = state.settings.name || "";
  $("#set-apikey").value = state.settings.apiKey;
  $("#set-useclaude").checked = state.settings.useClaude;
  settingsDlg.showModal();
});

settingsDlg.addEventListener("close", () => {
  state.settings.assumeStaples = $("#set-staples").checked;
  state.settings.name = $("#set-name").value.trim().slice(0, 40);
  state.settings.nameAsked = true;
  state.settings.apiKey = $("#set-apikey").value.trim();
  state.settings.useClaude = $("#set-useclaude").checked && Boolean(state.settings.apiKey);
  commit();
});

$("#set-apikey").addEventListener("input", (e) => {
  if (e.target.value.trim()) $("#set-useclaude").checked = true;
});

$("#export-data").addEventListener("click", () => {
  const { apiKey, ...settings } = state.settings;
  const blob = new Blob([JSON.stringify({ ...state, settings }, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `fridgeforme-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
});

$("#import-data").addEventListener("change", async (e) => {
  const file = e.target.files[0];
  e.target.value = "";
  if (!file) return;
  try {
    const data = JSON.parse(await file.text());
    if (!Array.isArray(data.inventory)) throw new Error("bad file");
    state = { ...state, ...data, settings: { ...state.settings, ...(data.settings || {}), apiKey: state.settings.apiKey } };
    commit();
    toast("Backup restored");
  } catch {
    toast("That doesn't look like a Inside my Kitchen backup");
  }
});

$("#reset-data").addEventListener("click", () => {
  if (!confirm("Remove everything from your kitchen, shopping list and saved recipes?")) return;
  const { settings } = state;
  state = { ...loadState({ getItem: () => null }), settings };
  commit();
  settingsDlg.close();
});

// ---------- Family ----------
// Each person: a name, whether they're eating at home, and food preferences
// (allergic, hates, tolerates, loves). Saved with the kitchen and synced.

const AVATAR = ["#d96c81", "#f4af30", "#9f4a5c", "#f0a9b6"];

function renderFamily() {
  const today = todayIso();
  for (const m of state.family) { m.away = pruneAway(m.away, today); delete m.home; }
  const fam = state.family;
  const me = (state.settings.name || "").trim();
  const suggest = me && !fam.some((m) => m.name.toLowerCase() === me.toLowerCase())
    ? `<button class="btn small" data-fam="add-me">Add ${esc(me)}</button>` : "";
  if (!fam.length) {
    $("#family-list").innerHTML = `<div class="empty">Add the people you cook for, then what each of them loves, tolerates, hates or is allergic to. ${suggest}</div>`;
    return;
  }
  $("#family-list").innerHTML = fam.map((m, i) => {
    const byLevel = LEVELS.map((l) => {
      const prefs = (m.prefs || []).filter((p) => p.level === l.id);
      return prefs.length ? `<div class="pref-group"><span class="pref-level lvl-${l.id}">${l.label}</span>${prefs.map((p) =>
        `<span class="pref-chip lvl-${l.id}">${esc(p.food)}<button aria-label="Remove ${esc(p.food)}" data-fam="del-pref" data-member="${m.id}" data-food="${esc(p.food)}">&times;</button></span>`).join("")}</div>` : "";
    }).join("");
    const later = (m.away || []).filter((d) => d > today);
    return `<div class="card member${isOut(m, today) ? " away" : ""}">
      <div class="member-head">
        <span class="avatar" style="background:${AVATAR[i % AVATAR.length]}">${esc((m.name[0] || "?").toUpperCase())}</span>
        <h3>${esc(m.name)}</h3>
        <button class="eat-toggle ${isOut(m, today) ? "" : "on"}" data-fam="today" data-member="${m.id}" aria-pressed="${!isOut(m, today)}">${isOut(m, today) ? "Out today" : "Eating today"}</button>
        <button class="icon-btn small" data-fam="del-member" data-member="${m.id}" aria-label="Remove ${esc(m.name)}">&times;</button>
      </div>
      ${byLevel || `<p class="muted small">No preferences yet.</p>`}
      <div class="away-row">
        <span class="pref-level">Out on</span>
        ${later.map((d) => `<span class="pref-chip away-chip">${esc(shortDate(fromIsoDay(d)))}<button aria-label="${esc(m.name)} is home on ${esc(shortDate(fromIsoDay(d)))}" data-fam="del-away" data-member="${m.id}" data-day="${d}">&times;</button></span>`).join("")}
        <label class="btn small away-add">+ A day out<input type="date" min="${today}" data-fam-away="${m.id}" aria-label="Add a day ${esc(m.name)} is out" /></label>
      </div>
      <form class="pref-form" data-member="${m.id}">
        <input name="food" list="food-names" placeholder="A food, e.g. mushrooms" required aria-label="Food" />
        <select name="level" aria-label="How they feel">${LEVELS.map((l) => `<option value="${l.id}"${l.id === "hates" ? " selected" : ""}>${l.label}</option>`).join("")}</select>
        <button class="btn primary" type="submit">Add</button>
      </form>
    </div>`;
  }).join("") + (suggest ? `<p class="center">${suggest}</p>` : "");
}

function addMember(name) {
  name = name.trim();
  if (!name) return;
  state.family.push({ id: newId(), name: titleCase(name), home: true, prefs: [] });
  commit();
}

$("#member-form").addEventListener("submit", (e) => {
  e.preventDefault();
  addMember($("#member-name").value);
  $("#member-name").value = "";
});

$("#family-list").addEventListener("submit", (e) => {
  const form = e.target.closest(".pref-form");
  if (!form) return;
  e.preventDefault();
  const m = state.family.find((x) => x.id === form.dataset.member);
  const food = canonicalName(form.food.value);
  if (!m || !food) return;
  m.prefs = (m.prefs || []).filter((p) => p.food !== food);
  m.prefs.push({ food, level: form.level.value });
  commit();
  const said = { allergic: "is allergic to", hates: "hates", tolerates: "tolerates", loves: "loves" }[form.level.value];
  toast(`Saved: ${m.name} ${said} ${food}`);
});

$("#family-list").addEventListener("change", (e) => {
  const input = e.target.closest("[data-fam-away]");
  const m = input && state.family.find((x) => x.id === input.dataset.famAway);
  if (!m || !input.value) return;
  m.away = pruneAway([...new Set([...(m.away || []), input.value])], todayIso());
  commit();
  toast(`${m.name} is out on ${shortDate(fromIsoDay(input.value))}`);
});

$("#family-list").addEventListener("click", (e) => {
  const b = e.target.closest("[data-fam]");
  if (!b) return;
  const m = state.family.find((x) => x.id === b.dataset.member);
  const act = b.dataset.fam;
  if (act === "add-me") addMember(state.settings.name || "");
  if (act === "today" && m) {
    const today = todayIso();
    m.away = isOut(m, today) ? m.away.filter((d) => d !== today) : [...(m.away || []), today];
    commit();
    toast(isOut(m, today) ? `${m.name} is out today. Recipes are for everyone else.` : `${m.name} is eating at home today`);
  }
  if (act === "del-away" && m) { m.away = m.away.filter((d) => d !== b.dataset.day); commit(); }
  if (act === "del-pref" && m) { m.prefs = m.prefs.filter((p) => p.food !== b.dataset.food); commit(); }
  if (act === "del-member" && m && confirm(`Remove ${m.name} and their preferences?`)) {
    state.family = state.family.filter((x) => x !== m);
    commit();
  }
});

// Tap the logo to go back to the top.
$("#logo-top").addEventListener("click", () => window.scrollTo({ top: 0, behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" }));
$("#logo-top").addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); $("#logo-top").click(); } });

// ---------- Tabs and boot ----------

function switchTab(tab) {
  ui.tab = tab;
  $$(".view").forEach((v) => (v.hidden = v.dataset.view !== tab));
  // The list view lives inside the Fridge tab.
  const tabFor = tab === "kitchen" ? "fridge" : tab;
  $$(".tabbar button").forEach((b) => b.classList.toggle("active", b.dataset.tab === tabFor));
  $$("[data-view-mode]").forEach((b) => b.classList.toggle("on", b.dataset.viewMode === tab));
  render();
  window.scrollTo({ top: 0 });
}

$(".tabbar").addEventListener("click", (e) => {
  const b = e.target.closest("[data-tab]");
  if (b) switchTab(b.dataset.tab);
});

function render() {
  renderShopping();
  updateScanEngine();
  if (ui.tab === "home") renderHome();
  if (ui.tab === "fridge") renderFridge();
  if (ui.tab === "kitchen") renderKitchen();
  if (ui.tab === "recipes") renderRecipes();
  if (ui.tab === "plan") renderPlan();
  if (ui.tab === "family") renderFamily();
}

// ---------- Saved copy on claude.ai ----------

const SYNC_TEXT = {
  connecting: ["Loading", "Loading your kitchen from your account"],
  saving: ["Saving", "Saving to your account"],
  saved: ["Saved", "Everything is saved to your account"],
  offline: ["Offline", "Not saved to your account yet; it will save when the connection is back"],
  local: ["This device", "Saved on this device only"],
};
let syncStatus = "";

function setSyncStatus(status) {
  const el = $("#sync-status");
  const [short, long] = SYNC_TEXT[status] || ["", ""];
  el.textContent = short;
  el.title = long;
  el.setAttribute("aria-label", long);
  el.dataset.status = status;
  syncStatus = status;
}

connectCloud({
  getState: () => toSynced(state),
  onStatus: setSyncStatus,
  onRemote(remote, first) {
    if (first) {
      const merged = mergeOnLoad(state, remote, sessionStart);
      const addedHere = ["inventory", "shopping", "customRecipes"].some((k) => (merged[k] || []).length !== (remote[k] || []).length);
      state = merged;
      state.ideas ||= { key: "", recipes: [] };
      if (addedHere) return commit();
    } else {
      state = adoptRemote(state, remote);
      state.ideas ||= { key: "", recipes: [] };
    }
    saveState(state);
    if ((state.settings.name || state.settings.nameAsked) && $("#name-dialog").open) $("#name-dialog").close();
    render();
  },
}).then((c) => (cloud = c)).catch((err) => {
  console.error(err);
  setSyncStatus("local");
});

// Save immediately when the page is hidden or closed.
addEventListener("pagehide", () => cloud?.flush());
document.addEventListener("visibilitychange", () => document.visibilityState === "hidden" && cloud?.flush());

// ---------- Opening splash ----------
// A ring of painted food floats around the fridge while the name pops in,
// then the splash fades away on its own (tap to skip).

(function splash() {
  const el = $("#splash");
  if (!el) return;
  const foods = [
    ["apple", "produce"], ["lemon", "produce"], ["carrot", "produce"], ["berries", "produce"],
    ["cheddar", "dairy"], ["egg", "dairy"], ["broccoli", "produce"], ["banana", "produce"],
    ["milk", "dairy"], ["bell pepper", "produce"],
  ];
  $("#splash-ring").innerHTML = foods
    .map(([name, cat], i) => {
      const angle = (360 / foods.length) * i - 90;
      return `<span class="splash-food" style="--a:${angle}deg;--i:${i}">${foodIcon(name, cat).svg}</span>`;
    })
    .join("");
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  let gone = false;
  const leave = () => {
    if (gone) return;
    gone = true;
    el.classList.add("leaving");
    setTimeout(() => {
      el.remove();
      maybeAskName();
    }, reduced ? 0 : 500);
  };
  el.addEventListener("click", leave);
  setTimeout(leave, reduced ? 900 : 3300);
})();

$("#add-unit").innerHTML = unitOptions("count");
$("#food-names").innerHTML = FOODS.filter((f) => f.name !== "water").map((f) => `<option value="${f.name}"></option>`).join("");
render();
