import { FOODS, LOCATIONS } from "./data/foods.js";
import { RECIPES } from "./data/recipes.js";
import { canonicalName, titleCase, foodInfo } from "./normalize.js";
import { parseReceipt } from "./receipt.js";
import { parseRecipeText } from "./recipeImport.js";
import { recommend, cookRecipe, daysLeft, SOON_DAYS } from "./recommend.js";
import { loadState, saveState, makeItem, addToInventory, newId, toSynced, adoptRemote, mergeOnLoad } from "./store.js";
import { connectCloud } from "./cloud.js";
import { UNIT_CHOICES, formatQty, normalizeUnit } from "./units.js";

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

let state = loadState();
const ui = { tab: "kitchen", loc: "all", search: "", recipeFilter: "ready", recipeSearch: "", review: [] };
state.ideas ||= { key: "", recipes: [] };

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

function toast(msg) {
  const el = $("#toast");
  el.textContent = msg;
  el.classList.add("show");
  clearTimeout(toast.t);
  toast.t = setTimeout(() => el.classList.remove("show"), 2600);
}

const claudeOn = () => Boolean(state.settings.useClaude && state.settings.apiKey);
const allRecipes = () => [...state.customRecipes, ...RECIPES];
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

// ---------- Kitchen ----------

function renderKitchen() {
  const inv = state.inventory;
  const soon = inv.filter((it) => daysLeft(it) <= SOON_DAYS).sort((a, b) => daysLeft(a) - daysLeft(b));
  const count = (loc) => inv.filter((it) => it.location === loc).length;

  $("#stats").innerHTML = `
    <div class="stat"><b>${count("fridge")}</b><span>Fridge</span></div>
    <div class="stat"><b>${count("freezer")}</b><span>Freezer</span></div>
    <div class="stat"><b>${count("pantry")}</b><span>Pantry</span></div>
    <div class="stat ${soon.length ? "warn" : ""}"><b>${soon.length}</b><span>Use soon</span></div>`;

  $("#use-soon").innerHTML = soon.length
    ? `<div class="card soon">
         <h2>Use these soon</h2>
         <div class="soon-list">${soon.map((it) => `<span class="pill">${esc(it.name)} &middot; ${expiryText(it)}</span>`).join("")}</div>
         <button class="btn small" data-action="show-rescue">Recipes that use them</button>
       </div>`
    : "";

  const q = ui.search.toLowerCase();
  const visible = inv
    .filter((it) => ui.loc === "all" || it.location === ui.loc)
    .filter((it) => !q || it.name.includes(q) || it.category.includes(q));

  if (!inv.length) {
    $("#inventory").innerHTML = `<div class="empty">Your kitchen is empty. Add items above, or scan a grocery receipt from the Scan tab.</div>`;
    return;
  }
  if (!visible.length) {
    $("#inventory").innerHTML = `<div class="empty">Nothing matches.</div>`;
    return;
  }

  $("#inventory").innerHTML = LOCATIONS.map((loc) => {
    const items = visible.filter((it) => it.location === loc).sort((a, b) => daysLeft(a) - daysLeft(b) || a.name.localeCompare(b.name));
    if (!items.length) return "";
    return `<div class="group-title"><span class="dot ${loc}"></span>${loc} (${items.length})</div>
      ${items.map((it) => `
        <div class="item" data-id="${it.id}">
          <div class="item-name">${esc(it.name)}</div>
          <div class="item-meta">${esc(it.category)} ${expiryText(it) ? "&middot; " + expiryText(it) : ""}</div>
          <div class="item-controls">
            <button class="step" data-action="dec" aria-label="Less ${esc(it.name)}">&minus;</button>
            <span class="qty">${esc(formatQty(it.qty, it.unit))}</span>
            <button class="step" data-action="inc" aria-label="More ${esc(it.name)}">+</button>
            <select data-action="move" aria-label="Move ${esc(it.name)}">${locationOptions(it.location)}</select>
            <button class="x" data-action="remove" aria-label="Remove ${esc(it.name)}">&times;</button>
          </div>
        </div>`).join("")}`;
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
    item.location = e.target.value;
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

function updateScanEngine() {
  $("#scan-engine").textContent = claudeOn()
    ? "Using Claude to read receipts."
    : "Reads receipts on your device. For tricky receipts, add a Claude API key in Settings.";
  $("#recipe-photo-label").hidden = !claudeOn();
}

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
    location: p.food?.location || "fridge",
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
    if (claudeOn()) {
      setProgress(60, "Claude is reading your receipt...");
      const { scanReceiptWithClaude } = await import("./ai.js");
      const items = await scanReceiptWithClaude(state.settings.apiKey, file);
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
    title: recipe.title || "My recipe",
    minutes: recipe.minutes || 30,
    servings: recipe.servings || 2,
    tags: recipe.tags || ["mine"],
    ingredients: (recipe.ingredients || []).map((ing) => ({
      name: canonicalName(ing.name),
      qty: Number(ing.qty) || 1,
      unit: normalizeUnit(ing.unit) || "count",
      optional: Boolean(ing.optional),
    })),
    steps: recipe.steps || [],
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
  toast(`Saved "${saved.title}" with ${saved.ingredients.length} ingredients`);
  openRecipe(saved.id);
});

$("#recipe-file").addEventListener("change", async (e) => {
  const file = e.target.files[0];
  e.target.value = "";
  if (!file) return;
  try {
    toast("Claude is reading the recipe...");
    const { scanRecipeWithClaude } = await import("./ai.js");
    const recipe = await scanRecipeWithClaude(state.settings.apiKey, file);
    const saved = saveCustomRecipe({ ...recipe, tags: ["mine"] });
    toast(`Saved "${saved.title}"`);
    openRecipe(saved.id);
  } catch (err) {
    console.error(err);
    toast(err.message || "Couldn't read that recipe");
  }
});

// ---------- Recipes ----------

function recipeCard(r) {
  const pct = Math.round(r.coverage * 100);
  const extra = r.recipe.custom ? " &middot; mine" : "";
  return `<button class="recipe" data-recipe="${esc(r.recipe.id)}">
    <h3>${esc(r.recipe.title)}</h3>
    <div class="tagline">${r.recipe.minutes} min &middot; serves ${r.recipe.servings}${extra}</div>
    <div class="meter" aria-label="${pct}% of ingredients on hand"><div style="width:${pct}%"></div></div>
    ${r.usesSoon.length ? `<div class="rescue">Uses up: ${esc(r.usesSoon.join(", "))}</div>` : ""}
    <div class="missing">${r.missing.length ? `Need: <b>${esc(r.missing.join(", "))}</b>` : "You have everything"}</div>
  </button>`;
}

function renderRecipes() {
  renderIdeas();
  $$("#recipe-filter .chip").forEach((c) => c.classList.toggle("active", c.dataset.filter === ui.recipeFilter));

  const ranked = recommend(allRecipes(), state.inventory, { assumeStaples: state.settings.assumeStaples });
  const q = ui.recipeSearch.toLowerCase();
  let list = ranked.filter((r) => !q || r.recipe.title.toLowerCase().includes(q) || r.recipe.tags.some((t) => t.includes(q)) || r.recipe.ingredients.some((i) => i.name.includes(q)));

  const f = ui.recipeFilter;
  if (f === "ready") list = list.filter((r) => r.missing.length === 0 && r.have.length);
  if (f === "almost") list = list.filter((r) => r.missing.length >= 1 && r.missing.length <= 2 && r.have.length);
  if (f === "mine") list = list.filter((r) => r.recipe.custom);
  if (f === "rescue") list = list.filter((r) => r.usesSoon.length).sort((a, b) => b.usesSoon.length - a.usesSoon.length || a.missing.length - b.missing.length);

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
    $("#recipes").innerHTML = `<div class="empty">${hint}</div>`;
    return;
  }
  $("#recipes").innerHTML = list.map(recipeCard).join("");
}

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
    <p class="muted">${recipe.minutes} min &middot; serves ${recipe.servings}${r.usesSoon.length ? ` &middot; <span class="rescue">uses up ${esc(r.usesSoon.join(", "))}</span>` : ""}</p>
    <h3>Ingredients</h3>
    <ul class="ing-list">
      ${recipe.ingredients.map((ing) => {
        const cls = have.has(ing.name) ? "ok" : missing.has(ing.name) ? "no" : "opt";
        const mark = cls === "ok" ? "&#10003;" : cls === "no" ? "&#10007;" : "&middot;";
        return `<li><span class="${cls}">${mark}</span><span>${esc(formatQty(ing.qty, ing.unit))} ${esc(ing.name)}${ing.optional ? ' <span class="muted">(optional)</span>' : ""}</span></li>`;
      }).join("")}
    </ul>
    <h3>Steps</h3>
    <ol class="steps">${recipe.steps.map((s) => `<li>${esc(s)}</li>`).join("")}</ol>
    <div class="row end">
      ${recipe.custom ? `<button class="btn danger" data-act="delete">Delete</button>` : ""}
      ${isIdea ? `<button class="btn" data-act="keep">Save to my recipes</button>` : ""}
      ${r.missing.length ? `<button class="btn" data-act="shop">Add ${r.missing.length} to shopping list</button>` : ""}
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
      addToShopping(r.missing);
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
    if (act === "keep") {
      state.ideas.recipes = state.ideas.recipes.filter((x) => x !== recipe);
      saveCustomRecipe({ ...recipe, id: undefined, idea: undefined, tags: ["mine", "claude"] });
      dlg.close();
      toast("Saved to your recipes");
    }
  };
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

const kitchenKey = () => [...new Set(state.inventory.map((it) => it.name))].sort().join("|");

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
  $("#library-title").hidden = !show;
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
    const ranked = recommend(recipes, state.inventory, { assumeStaples: state.settings.assumeStaples });
    $("#ideas-list").innerHTML = ranked.map(recipeCard).join("");
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
    request: $("#ai-request").value.trim(),
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

window.claude?.use?.("sample").then((fn) => {
  sampleFn = fn;
  if (ui.tab === "recipes") renderRecipes();
}).catch(() => {});

// ---------- Shopping ----------

function addToShopping(names) {
  for (const raw of names) {
    const name = canonicalName(raw);
    if (name && !state.shopping.some((s) => s.name === name)) state.shopping.push({ id: newId(), name, done: false, addedAt: Date.now() });
  }
  commit();
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
        <label><input type="checkbox" ${s.done ? "checked" : ""} /><span>${esc(s.name)}</span></label>
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
  $("#set-apikey").value = state.settings.apiKey;
  $("#set-useclaude").checked = state.settings.useClaude;
  settingsDlg.showModal();
});

settingsDlg.addEventListener("close", () => {
  state.settings.assumeStaples = $("#set-staples").checked;
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
  a.download = `fridgemate-backup-${new Date().toISOString().slice(0, 10)}.json`;
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
    toast("That doesn't look like a FridgeMate backup");
  }
});

$("#reset-data").addEventListener("click", () => {
  if (!confirm("Remove everything from your kitchen, shopping list and saved recipes?")) return;
  const { settings } = state;
  state = { ...loadState({ getItem: () => null }), settings };
  commit();
  settingsDlg.close();
});

// ---------- Tabs and boot ----------

function switchTab(tab) {
  ui.tab = tab;
  $$(".view").forEach((v) => (v.hidden = v.dataset.view !== tab));
  $$(".tabbar button").forEach((b) => b.classList.toggle("active", b.dataset.tab === tab));
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
  if (ui.tab === "kitchen") renderKitchen();
  if (ui.tab === "recipes") renderRecipes();
}

// ---------- Saved copy on claude.ai ----------

const SYNC_TEXT = {
  connecting: "Loading your kitchen...",
  saving: "Saving...",
  saved: "Saved",
  offline: "Not saved to your account yet",
  local: "Saved on this device only",
};

function setSyncStatus(status) {
  const el = $("#sync-status");
  el.textContent = SYNC_TEXT[status] || "";
  el.dataset.status = status;
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
    render();
  },
}).then((c) => (cloud = c)).catch((err) => {
  console.error(err);
  setSyncStatus("local");
});

// Save immediately when the page is hidden or closed.
addEventListener("pagehide", () => cloud?.flush());
document.addEventListener("visibilitychange", () => document.visibilityState === "hidden" && cloud?.flush());

$("#add-unit").innerHTML = unitOptions("count");
$("#food-names").innerHTML = FOODS.filter((f) => f.name !== "water").map((f) => `<option value="${f.name}"></option>`).join("");
render();
