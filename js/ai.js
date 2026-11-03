// Optional Claude integration. Only used when the person adds their own API key
// in Settings. The key stays in this browser and requests go straight to Anthropic.
import { FOODS, LOCATIONS } from "./data/foods.js";

const SDK_URL = "https://cdn.jsdelivr.net/npm/@anthropic-ai/sdk@0.135.0/+esm";
const MODEL = "claude-opus-5-5";
const FOOD_NAMES = FOODS.map((f) => f.name).join(", ");

let sdkPromise = null;

async function client(apiKey) {
  if (!apiKey) throw new Error("Add your Anthropic API key in Settings first.");
  sdkPromise ||= import(SDK_URL);
  const { default: Anthropic } = await sdkPromise;
  // The person supplies their own key and runs the app themselves, so calling
  // the API straight from the browser is intended here.
  return new Anthropic({ apiKey, dangerouslyAllowBrowser: true });
}

async function askForJson(apiKey, content, schema, effort = "low") {
  const anthropic = await client(apiKey);
  const response = await anthropic.beta.messages.create({
    model: MODEL,
    max_tokens: 16000,
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    output_config: { effort, format: { type: "json_schema", schema } },
    messages: [{ role: "user", content }],
  });
  if (response.stop_reason === "refusal") throw new Error("Claude declined this request.");
  if (response.stop_reason === "max_tokens") throw new Error("Claude's answer was cut off. Try again.");
  const text = response.content.filter((b) => b.type === "text").map((b) => b.text).join("");
  return JSON.parse(text);
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(",")[1]);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

async function imageBlock(file) {
  const type = /^image\/(jpeg|png|gif|webp)$/.test(file.type) ? file.type : "image/jpeg";
  return { type: "image", source: { type: "base64", media_type: type, data: await fileToBase64(file) } };
}

const ITEM_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["items"],
  properties: {
    items: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["name", "qty", "unit", "location", "shelf_life_days"],
        properties: {
          name: { type: "string" },
          qty: { type: "number" },
          unit: { type: "string" },
          location: { type: "string", enum: LOCATIONS },
          shelf_life_days: { type: "integer" },
        },
      },
    },
  },
};

/** Read a photographed grocery receipt and return food items. */
export async function scanReceiptWithClaude(apiKey, file) {
  const prompt =
    "This is a photo of a grocery receipt. List only the food and drink items bought; skip totals, taxes, " +
    "fees, discounts and non-food products. Expand receipt abbreviations into plain names (ORG BNNA -> banana). " +
    `When an item is one of these known foods, use exactly that name: ${FOOD_NAMES}. ` +
    "Use unit 'count' for things bought by the piece, otherwise g, kg, lb, ml, l, can or pkg. " +
    "Pick where it is normally stored once home, and a realistic shelf life in days for that location.";
  const data = await askForJson(apiKey, [await imageBlock(file), { type: "text", text: prompt }], ITEM_SCHEMA);
  return data.items;
}

const RECIPE_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["recipes"],
  properties: {
    recipes: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["title", "minutes", "servings", "ingredients", "steps"],
        properties: {
          title: { type: "string" },
          minutes: { type: "integer" },
          servings: { type: "integer" },
          ingredients: {
            type: "array",
            items: {
              type: "object",
              additionalProperties: false,
              required: ["name", "qty", "unit", "optional"],
              properties: {
                name: { type: "string" },
                qty: { type: "number" },
                unit: { type: "string" },
                optional: { type: "boolean" },
              },
            },
          },
          steps: { type: "array", items: { type: "string" } },
        },
      },
    },
  },
};

/**
 * The prompt for recipe ideas. Kept stable for the same kitchen (sorted names,
 * no quantities) so repeat requests can be served from cache.
 */
export function buildIdeasPrompt(inventory, { soon = [], request = "", exclude = [], count = 4 } = {}) {
  const names = [...new Set(inventory.map((it) => it.name))].sort();
  return (
    `Here is what is in my kitchen: ${names.join(", ") || "nothing yet"}. ` +
    (soon.length ? `These need using up in the next few days, so favour them: ${[...soon].sort().join(", ")}. ` : "") +
    (request ? `What I'm in the mood for: ${request}. ` : "") +
    (exclude.length ? `Don't repeat these, I've already seen them: ${exclude.join("; ")}. ` : "") +
    `Suggest ${count} practical, varied home recipes that use mostly what I have, ` +
    "assuming salt, pepper, oil, water and common spices are available. Keep the shopping needed to 0-2 items per recipe. " +
    `Write ingredient names in lower case and, where one matches, use exactly one of these names: ${FOOD_NAMES}. ` +
    "Keep steps short and clear (3-6 steps)."
  );
}

const JSON_SHAPE =
  'Reply with only JSON of this shape: {"recipes": [{"title": string, "minutes": integer, "servings": integer, ' +
  '"ingredients": [{"name": string, "qty": number, "unit": string, "optional": boolean}], "steps": [string]}]}';

/** Keep only well-formed recipes from a model reply. */
export function cleanIdeas(data) {
  const list = Array.isArray(data) ? data : Array.isArray(data?.recipes) ? data.recipes : [];
  return list
    .filter((r) => r && typeof r.title === "string" && Array.isArray(r.ingredients) && r.ingredients.length)
    .map((r) => ({
      title: r.title.trim(),
      minutes: Number.isFinite(+r.minutes) && +r.minutes > 0 ? Math.round(+r.minutes) : 30,
      servings: Number.isFinite(+r.servings) && +r.servings > 0 ? Math.round(+r.servings) : 2,
      ingredients: r.ingredients
        .filter((i) => i && typeof i.name === "string" && i.name.trim())
        .map((i) => ({ name: i.name, qty: Number(i.qty) || 1, unit: String(i.unit || "count"), optional: Boolean(i.optional) })),
      steps: Array.isArray(r.steps) ? r.steps.map(String) : [],
    }));
}

/** Recipe ideas through the person's own Anthropic API key. */
export async function suggestRecipesWithClaude(apiKey, inventory, opts = {}) {
  const data = await askForJson(apiKey, buildIdeasPrompt(inventory, opts), RECIPE_SCHEMA, "medium");
  return cleanIdeas(data);
}

/**
 * Recipe ideas through the claude.ai page capability (the viewer's own Claude
 * account; no key needed). `sample` is the function from claude.use("sample").
 */
export async function suggestRecipesWithSample(sample, inventory, opts = {}, { fresh = false, signal } = {}) {
  const prompt = buildIdeasPrompt(inventory, opts) + "\n\n" + JSON_SHAPE;
  const data = await sample.json(prompt, { signal, cache: fresh ? false : { gcTime: 6 * 60 * 60 * 1000 } });
  return cleanIdeas(data);
}

const RECIPE_PHOTO_PROMPT =
  "These are photos of a recipe, for example a cookbook page, a recipe card or a screenshot. " +
  "If there are several photos they are pages of the same recipe, in order. Transcribe it as one recipe: " +
  "the title, every ingredient with its amount and unit, and the method as short steps in the book's order. " +
  "Estimate total minutes and servings from the page if they aren't printed. " +
  `Write ingredient names in lower case and, where one matches, use exactly one of these names: ${FOOD_NAMES}. ` +
  'If no recipe is visible, return {"recipes": []}.';

/** Read a recipe from one or more photos with the person's own API key. */
export async function scanRecipeWithClaude(apiKey, files) {
  const list = Array.from(files.length !== undefined ? files : [files]);
  const blocks = await Promise.all(list.map(imageBlock));
  const data = await askForJson(apiKey, [...blocks, { type: "text", text: RECIPE_PHOTO_PROMPT }], RECIPE_SCHEMA);
  return cleanIdeas(data)[0] || null;
}

/** Read a recipe from photos through the claude.ai page capability (viewer's own account). */
export async function scanRecipeWithSample(sample, files) {
  const images = Array.from(files.length !== undefined ? files : [files]);
  const data = await sample.json(RECIPE_PHOTO_PROMPT + "\n\n" + JSON_SHAPE, { images, cache: false });
  return cleanIdeas(data)[0] || null;
}

/** Read a grocery receipt photo through the claude.ai page capability. */
export async function scanReceiptWithSample(sample, file) {
  const prompt =
    "This is a photo of a grocery receipt. List only the food and drink items bought; skip totals, taxes, " +
    "fees, discounts and non-food products. Expand receipt abbreviations into plain names (ORG BNNA -> banana). " +
    `When an item is one of these known foods, use exactly that name: ${FOOD_NAMES}. ` +
    "Use unit 'count' for things bought by the piece, otherwise g, kg, lb, ml, l, can or pkg. " +
    "Pick where it is normally stored once home (fridge, freezer or pantry), and a realistic shelf life in days there.\n\n" +
    'Reply with only JSON of this shape: {"items": [{"name": string, "qty": number, "unit": string, ' +
    '"location": "fridge"|"freezer"|"pantry", "shelf_life_days": integer}]}';
  const data = await sample.json(prompt, { images: [file], cache: false });
  const items = Array.isArray(data?.items) ? data.items : [];
  return items
    .filter((it) => it && typeof it.name === "string" && it.name.trim())
    .map((it) => ({
      name: it.name,
      qty: Number(it.qty) || 1,
      unit: String(it.unit || "count"),
      location: LOCATIONS.includes(it.location) ? it.location : "fridge",
      shelf_life_days: Number.isFinite(+it.shelf_life_days) ? Math.round(+it.shelf_life_days) : undefined,
    }));
}
