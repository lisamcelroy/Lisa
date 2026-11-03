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

/** Ask Claude to invent recipes from what is on hand, favouring food that expires soon. */
export async function suggestRecipesWithClaude(apiKey, inventory, { soon = [], request = "" } = {}) {
  const list = inventory.map((it) => `${it.name} (${it.qty} ${it.unit}, ${it.location})`).join("; ");
  const prompt =
    `Here is what is in my kitchen: ${list || "nothing yet"}. ` +
    (soon.length ? `These need using up in the next few days: ${soon.join(", ")}. ` : "") +
    (request ? `What I'm in the mood for: ${request}. ` : "") +
    "Suggest 3 practical home recipes that use mostly what I have, assuming salt, pepper, oil, water and common spices are available. " +
    `Write ingredient names in lower case and, where one matches, use exactly one of these names: ${FOOD_NAMES}. ` +
    "Keep steps short and clear.";
  const data = await askForJson(apiKey, prompt, RECIPE_SCHEMA, "medium");
  return data.recipes;
}

/** Read a recipe from a photo (cookbook page, card, screenshot). */
export async function scanRecipeWithClaude(apiKey, file) {
  const prompt =
    "Transcribe the recipe in this image as one recipe. " +
    `Write ingredient names in lower case and, where one matches, use exactly one of these names: ${FOOD_NAMES}.`;
  const data = await askForJson(apiKey, [await imageBlock(file), { type: "text", text: prompt }], RECIPE_SCHEMA);
  return data.recipes[0];
}
