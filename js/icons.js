// Food icons (inline SVG) in a flat illustration style: solid shapes with one
// darker tone for shading, teal-green leaves, no gradients. Names map to a
// shape and colour; anything unknown falls back to its category.

const TEAL = "#14a88e";
const TEAL_DARK = "#3d8c78";
const STEM = "#7a4a2a";
const INK = "#3a2418";

/** Lighten (amt > 0) or darken (amt < 0) a hex colour. */
function shade(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  const ch = (v) => Math.round(Math.min(255, Math.max(0, amt < 0 ? v * (1 + amt) : v + (255 - v) * amt)));
  const r = ch(n >> 16), g = ch((n >> 8) & 255), b = ch(n & 255);
  return "#" + ((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1);
}

// Each shape gets (c = main colour, d = darker shade, l = lighter tint).
const SHAPES = {
  fruit: (c, d) => `<circle cx="12" cy="13.5" r="8" fill="${c}"/>
    <path d="M17.6 7.8A8 8 0 0 1 7.6 20.2A9.6 9.6 0 0 0 17.6 7.8Z" fill="${d}"/>
    <path d="M12 6V3.4" stroke="${STEM}" stroke-width="1.4" stroke-linecap="round"/>
    <path d="M12.3 4.7C14 2.3 17.4 2.4 18.4 3.6C16.7 5.5 14.1 5.7 12.3 4.7Z" fill="${TEAL}"/>`,
  tomato: (c, d) => `<circle cx="12" cy="13.5" r="8" fill="${c}"/>
    <path d="M17.6 7.8A8 8 0 0 1 7.6 20.2A9.6 9.6 0 0 0 17.6 7.8Z" fill="${d}"/>
    <path d="M12 5.4L13.4 3.6L14 6.1L16.6 5.6L15 7.4L16.8 8.6L12 8L7.2 8.6L9 7.4L7.4 5.6L10 6.1L10.6 3.6Z" fill="${TEAL_DARK}"/>`,
  lemon: (c, d) => `<path d="M4 13.2C4 8 8 5 12.6 5C17 5 20.4 8.2 20.4 12.6C20.4 17.4 16.6 20.2 12 20.2C7.6 20.2 4 18.2 4 13.2Z" fill="${c}"/>
    <path d="M15.2 5.6C19 7 21 11 19.8 15C18.6 18.6 15.2 20.2 12 20.2C16 18.6 18.4 15.4 18.2 11.6C18 9 16.9 7 15.2 5.6Z" fill="${d}"/>
    <path d="M5.2 17.6L3.4 19.6L6.2 19.2Z" fill="${d}"/>
    <path d="M16.2 5.6C16.6 2.6 19.6 1.6 21.4 2.4C21.2 5 18.8 6.6 16.2 5.6Z" fill="${TEAL}"/>`,
  long: (c, d) => `<path d="M3.6 16.2C6.6 18.8 13 18 17.2 13.4C19.6 10.8 20.6 7.6 20.2 4.6C21.6 5 22 6.6 21.8 8.6C21.2 14.6 15.6 20.4 9.2 20.4C6.6 20.4 4.6 18.8 3.6 16.2Z" fill="${c}"/>
    <path d="M5.6 18.6C9 19.8 14.6 18.4 18.2 14.4C20.4 12 21.4 9.6 21.6 7.8C22 13.8 15.8 20.4 9.2 20.4C7.8 20.4 6.6 19.8 5.6 18.6Z" fill="${d}"/>
    <path d="M20.2 4.6L20.8 3" stroke="${STEM}" stroke-width="1.4" stroke-linecap="round"/>`,
  potato: (c, d) => `<path d="M4 13C3.6 8.8 7.4 6 12 6C16.8 6 20.4 8.6 20.2 12.6C20 17 16.4 19 12 19C7.8 19 4.3 17 4 13Z" fill="${c}"/>
    <path d="M18.6 9C20.6 12.6 18.6 18.4 12 19C16.2 17.4 18.2 14 18.6 9Z" fill="${d}"/>
    <g fill="${d}"><circle cx="9" cy="10.6" r=".8"/><circle cx="13.6" cy="9.4" r=".7"/><circle cx="8.6" cy="15" r=".7"/><circle cx="14.2" cy="14.4" r=".8"/></g>`,
  disc: (c, d) => `<circle cx="12" cy="12.5" r="8.5" fill="${c}"/>
    <g fill="${d}"><circle cx="9" cy="9.6" r="1.1"/><circle cx="14.6" cy="10.4" r=".9"/><circle cx="11" cy="15.2" r="1"/><circle cx="16" cy="15" r=".7"/><circle cx="7.4" cy="13.6" r=".6"/></g>`,
  leaf: (c, d) => `<path d="M4.6 20C3.8 11 10 4.6 20 4C20.6 13.6 14 20 4.6 20Z" fill="${c}"/>
    <path d="M5 19.6L15.6 9M9 15.6L8.4 12.4M11.6 13L14.6 13.4" stroke="${d}" stroke-width="1.2" stroke-linecap="round"/>`,
  carrot: (c, d) => `<path d="M3.2 20.8C6 17 10.4 11.6 13.6 8.8C15.2 7.4 17.6 9.4 16.4 11.2C13.6 14.4 7.8 18.6 3.2 20.8Z" fill="${c}"/>
    <path d="M9.2 15.2L10.8 16.2M11.6 12.6L13.1 13.6M6.8 17.9L8 18.7" stroke="${d}" stroke-width=".9" stroke-linecap="round"/>
    <path d="M15.4 9.4C16.6 6.6 18.6 4.6 21.2 3.6M16 10C18.4 8.8 20.8 8.6 22 9.4M15.5 9.5C16.8 6 17.4 4 16.9 2.4" stroke="${TEAL}" stroke-width="1.6" stroke-linecap="round" fill="none"/>`,
  tree: (c, d) => `<path d="M10.4 13H13.6L14.4 21H9.6Z" fill="#8fcf72"/>
    <circle cx="7.6" cy="11" r="4" fill="${c}"/><circle cx="16.4" cy="11" r="4" fill="${c}"/><circle cx="12" cy="7.4" r="4.4" fill="${c}"/>
    <path d="M14.8 4.6A4.4 4.4 0 0 1 14.6 10.4A4 4 0 0 1 20.2 12.2A4 4 0 0 1 13 14Z" fill="${d}"/>`,
  mushroom: (c, d, l) => `<path d="M9.6 12.4C9.9 15.2 9.1 18.2 7.6 20.4C10 21.2 14 21.2 16.4 20.4C14.9 18.2 14.1 15.2 14.4 12.4Z" fill="${l}"/>
    <path d="M3.4 12C3.4 6.6 7.8 4 12 4C16.2 4 20.6 6.6 20.6 12C20.6 13.6 19 13.6 17.4 13C14 11.9 10 11.9 6.6 13C5 13.6 3.4 13.6 3.4 12Z" fill="${c}"/>
    <path d="M9.4 12.4C11 14.4 13 14.4 14.6 12.4C13 12 11 12 9.4 12.4Z" fill="${d}"/>`,
  onion: (c, d) => `<path d="M12 3.4C13 6 18.6 8 18.6 13.6C18.6 17.6 15.6 20.6 12 20.6C8.4 20.6 5.4 17.6 5.4 13.6C5.4 8 11 6 12 3.4Z" fill="${c}"/>
    <path d="M12 7V19M9 10C7.8 13 8 17 9.6 19.4M15 10C16.2 13 16 17 14.4 19.4" stroke="${d}" stroke-width=".9" fill="none" stroke-linecap="round"/>
    <path d="M10.4 20.4L9.8 22M12 20.6V22.2M13.6 20.4L14.2 22" stroke="${d}" stroke-width=".9" stroke-linecap="round"/>`,
  egg: (c) => `<path d="M3.8 12.4C3 8 6 4.4 10.6 4.4C15.2 4.4 20.6 7.6 20.6 13C20.6 17.6 17 20 12.6 19.6C9.6 19.3 9 16.8 6.8 16C4.8 15.3 4.1 14 3.8 12.4Z" fill="#e6e7ea"/>
    <circle cx="11.6" cy="11.6" r="3.8" fill="${c}"/>`,
  carton: (c, d) => `<path d="M7 9L9 4.6H15L17 9V20.6H7Z" fill="#f4f5f7"/>
    <path d="M12 4.6H15L17 9V20.6H12Z" fill="#dfe2e8"/>
    <rect x="7" y="12" width="10" height="5.2" fill="${c}"/><rect x="12" y="12" width="5" height="5.2" fill="${d}"/>
    <rect x="10.4" y="2.6" width="3.2" height="2.2" rx=".6" fill="${d}"/>`,
  cheese: (c, d, l) => `<path d="M3 11L15.6 4.4L21 9.4V18.4L3 20.4Z" fill="${c}"/>
    <path d="M3 11L15.6 4.4L21 9.4Z" fill="${l}"/>
    <g fill="${d}"><circle cx="7" cy="15.2" r="1.4"/><circle cx="12" cy="13.6" r="1.8"/><circle cx="17.2" cy="15.4" r="1.1"/><circle cx="13.8" cy="17.8" r="1"/><ellipse cx="15.8" cy="7.6" rx="1.2" ry=".6"/></g>`,
  block: (c, d, l) => `<path d="M5.6 9L8.2 6.4H21.6L19.4 9Z" fill="${l}"/>
    <rect x="3" y="9" width="16.4" height="9.4" rx="1.4" fill="${c}"/>
    <path d="M19.4 9L21.6 6.4V15.8L19.4 18.4Z" fill="${d}"/>`,
  cup: (c, d, l) => `<path d="M5.8 8.6H18.2L16.8 19.4A2 2 0 0 1 14.8 21.2H9.2A2 2 0 0 1 7.2 19.4Z" fill="${c}"/>
    <path d="M12 8.6H18.2L16.8 19.4A2 2 0 0 1 14.8 21.2H12Z" fill="${d}"/>
    <rect x="4.6" y="5.6" width="14.8" height="3.4" rx="1.4" fill="${l}"/>`,
  meat: (c, d, l) => `<path d="M6.4 6.2C11.4 2.8 19.6 5 19.6 11.6C19.6 17.6 13.2 20.2 9 19.4C5.4 18.6 3.4 16.2 3.4 13.2C3.4 10.2 4 7.8 6.4 6.2Z" fill="${l}"/>
    <path d="M7.4 7.6C11.4 5 18 6.6 18 11.6C18 16.4 12.8 18.4 9.4 17.8C6.6 17.2 5 15.4 5 13.2C5 10.6 5.6 8.8 7.4 7.6Z" fill="${c}"/>
    <circle cx="14" cy="10.8" r="2" fill="#fbf3ea"/><path d="M7 14C8.6 16 11.6 16.6 14 15.6" stroke="${d}" stroke-width="1" fill="none" stroke-linecap="round"/>`,
  bacon: (c, d, l) => `<g stroke="${l}" stroke-width="1.3" stroke-linejoin="round" fill="${c}">
      <path d="M2.6 8.4C5.6 5.8 7.8 10 10.8 7.4C13.8 4.8 16 9 19.4 6.4L21.2 8.8C17.8 11.4 15.6 7.2 12.6 9.8C9.6 12.4 7.4 8.2 4.4 10.8Z"/>
      <path d="M2.8 14.6C5.8 12 8 16.2 11 13.6C14 11 16.2 15.2 19.6 12.6L21.4 15C18 17.6 15.8 13.4 12.8 16C9.8 18.6 7.6 14.4 4.6 17Z"/></g>
    <path d="M5 9.2C7.4 7.6 9 10.4 11.4 8.6M5.2 15.4C7.6 13.8 9.2 16.6 11.6 14.8" stroke="${d}" stroke-width=".9" fill="none" stroke-linecap="round"/>`,
  drumstick: (c, d) => `<path d="M14.6 3.8C18.6 3.8 21.2 6.4 21.2 9.6C21.2 13.2 18.1 15.1 14.6 14.6C13.1 14.4 12 14.9 11 15.9L8.7 18.2C9.7 19.3 9.1 21.1 7.6 21.1C6.6 21.1 6 20.3 6.1 19.4C5.2 19.6 4.1 18.9 4.1 17.7C4.1 16.3 5.8 15.7 6.9 16.4L9.3 14C10.3 13 10.6 11.8 10.3 10.4C9.6 6.6 11.4 3.8 14.6 3.8Z" fill="${c}"/>
    <path d="M19.6 6.2C21.6 9.6 19.8 14.6 14.6 14.6C17.8 13.6 19.8 10.4 19.6 6.2Z" fill="${d}"/>`,
  fish: (c, d) => `<path d="M2.6 12C5.6 7.6 11 6.6 15 9L20.4 5.8V18.2L15 15C11 17.4 5.6 16.4 2.6 12Z" fill="${c}"/>
    <path d="M15 9L20.4 5.8V18.2L15 15C16.2 13 16.2 11 15 9Z" fill="${d}"/>
    <circle cx="7" cy="11" r="1.1" fill="${INK}"/>`,
  bread: (c, d, l) => `<path d="M3.4 11.6C3.4 8.6 5.9 7 8.4 7H15.6C18.1 7 20.6 8.6 20.6 11.6C20.6 12.8 19.8 13.3 19.2 13.5V19A1 1 0 0 1 18.2 20H5.8A1 1 0 0 1 4.8 19V13.5C4.2 13.3 3.4 12.8 3.4 11.6Z" fill="${c}"/>
    <path d="M3.4 11.6C3.4 8.6 5.9 7 8.4 7H15.6C18.1 7 20.6 8.6 20.6 11.6C20.6 12.8 19.8 13.3 19.2 13.5H4.8C4.2 13.3 3.4 12.8 3.4 11.6Z" fill="${d}"/>
    <path d="M8.6 9.6L10 11M12.2 9.6L13.6 11M15.8 9.6L17 10.8" stroke="${l}" stroke-width="1.2" stroke-linecap="round"/>`,
  can: (c, d, l) => `<rect x="6" y="4.6" width="12" height="16" rx="2" fill="${c}"/>
    <rect x="6" y="9.6" width="12" height="6" fill="${l}"/><rect x="13" y="4.6" width="5" height="16" rx="2" fill="${d}" opacity=".45"/>
    <rect x="5.4" y="3.6" width="13.2" height="2" rx="1" fill="${d}"/><rect x="5.4" y="19.4" width="13.2" height="2" rx="1" fill="${d}"/>`,
  jar: (c, d, l) => `<rect x="6" y="8" width="12" height="13" rx="3" fill="${c}"/>
    <path d="M13 8H15A3 3 0 0 1 18 11V18A3 3 0 0 1 15 21H13Z" fill="${d}"/>
    <rect x="7" y="4" width="10" height="4.4" rx="1.4" fill="#8a5a35"/>
    <rect x="8" y="12" width="8" height="4.6" rx="1" fill="${l}"/>`,
  bottle: (c, d, l) => `<path d="M10 3H14V7.4L16.2 10.4V19A2 2 0 0 1 14.2 21H9.8A2 2 0 0 1 7.8 19V10.4L10 7.4Z" fill="${c}"/>
    <path d="M12 3H14V7.4L16.2 10.4V19A2 2 0 0 1 14.2 21H12Z" fill="${d}"/>
    <rect x="7.8" y="12.6" width="8.4" height="4" fill="${l}"/><rect x="9.6" y="2" width="4.8" height="2" rx="1" fill="${INK}"/>`,
  bag: (c, d, l) => `<path d="M6 8L7.6 4.4H16.4L18 8V19A2 2 0 0 1 16 21H8A2 2 0 0 1 6 19Z" fill="${c}"/>
    <path d="M12 4.4H16.4L18 8V19A2 2 0 0 1 16 21H12Z" fill="${d}"/>
    <rect x="6" y="7.4" width="12" height="1.4" fill="${d}"/><circle cx="12" cy="14" r="2.6" fill="${l}"/>`,
  box: (c, d) => `<rect x="4" y="6.4" width="16" height="13.6" rx="2.4" fill="${c}"/>
    <path d="M14 6.4H17.6A2.4 2.4 0 0 1 20 8.8V17.6A2.4 2.4 0 0 1 17.6 20H14Z" fill="${d}"/>
    <path d="M10 9.4V16.8M6.8 11.3L13.2 14.9M13.2 11.3L6.8 14.9" stroke="#fff" stroke-width="1.4" stroke-linecap="round"/>`,
  shaker: (c, d) => `<path d="M8 9H16V19A2 2 0 0 1 14 21H10A2 2 0 0 1 8 19Z" fill="${c}"/>
    <path d="M12 9H16V19A2 2 0 0 1 14 21H12Z" fill="${d}"/>
    <path d="M8.8 4.4H15.2L16.2 9H7.8Z" fill="#b9b2c6"/><circle cx="10.6" cy="6.6" r=".6" fill="#fff"/><circle cx="13.4" cy="6.6" r=".6" fill="#fff"/>`,
  bunch: (c, d) => `<path d="M7.2 20.6C8.2 15 8.2 10 7.2 6M12 21V5.6M16.8 20.6C15.8 15 15.8 10 16.8 6" stroke="${c}" stroke-width="2.8" stroke-linecap="round" fill="none"/>
    <path d="M12 21V12" stroke="${d}" stroke-width="2.8" stroke-linecap="round"/>
    <path d="M5 6C6 3 8.4 2.6 9.4 4.4M10 5C10.6 2.2 13.4 2 14 4.4M14.6 4.6C15.8 2.4 18.6 2.8 19 5.4" stroke="${TEAL}" stroke-width="1.8" stroke-linecap="round" fill="none"/>`,
  berries: (c, d) => `<circle cx="7.6" cy="9.6" r="4.4" fill="${c}"/><circle cx="16.4" cy="8.8" r="4.4" fill="${c}"/><circle cx="12.2" cy="16.4" r="4.4" fill="${c}"/>
    <path d="M6.6 8.6L8.6 10.6M8.6 8.6L6.6 10.6M15.4 7.8L17.4 9.8M17.4 7.8L15.4 9.8M11.2 15.4L13.2 17.4M13.2 15.4L11.2 17.4" stroke="${d}" stroke-width="1" stroke-linecap="round"/>`,
};

// name: [shape, colour]  (palette after flat food illustrations)
const FOOD_ICONS = {
  apple: ["fruit", "#f2553a"], avocado: ["fruit", "#6aa84f"], banana: ["long", "#fdd535"], basil: ["leaf", "#14a88e"],
  "bell pepper": ["tomato", "#ff5a1f"], berries: ["berries", "#2e3b78"], broccoli: ["tree", "#14a88e"],
  cabbage: ["fruit", "#8ccf7a"], carrot: ["carrot", "#f7a36a"], celery: ["bunch", "#8ccf7a"], cilantro: ["leaf", "#14a88e"],
  cucumber: ["long", "#3aa66b"], garlic: ["onion", "#f6efe0"], ginger: ["potato", "#e5b874"], "green onion": ["bunch", "#7fcf8f"],
  kale: ["leaf", "#0f8f78"], lemon: ["lemon", "#fdd535"], lettuce: ["leaf", "#8ccf7a"], lime: ["lemon", "#8ccf4a"],
  mushroom: ["mushroom", "#c4a3cc"], onion: ["onion", "#fcefc2"], potato: ["potato", "#d8a466"], spinach: ["leaf", "#14a88e"],
  "sweet potato": ["potato", "#e07a4a"], tomato: ["tomato", "#ff5a1f"], zucchini: ["long", "#2f8f55"],
  butter: ["block", "#fde27a"], cheese: ["cheese", "#fdcb4e"], cheddar: ["cheese", "#f7b733"], feta: ["block", "#f4efe2"],
  mozzarella: ["block", "#f8f4ea"], parmesan: ["cheese", "#f5d67b"], cream: ["carton", "#7ab8e8"], "cream cheese": ["cup", "#9cc4ea"],
  egg: ["egg", "#fcad1a"], milk: ["carton", "#5aa9e6"], "sour cream": ["cup", "#c4a3cc"], yogurt: ["cup", "#f59ab0"],
  bacon: ["bacon", "#d9532e"], "chicken breast": ["drumstick", "#f07a5c"], "chicken thigh": ["drumstick", "#ec6b4f"],
  chicken: ["drumstick", "#f07a5c"], "ground beef": ["meat", "#e8604c"], "ground turkey": ["meat", "#f2907a"], ham: ["meat", "#f59aa6"],
  "pork chop": ["meat", "#f08a78"], salmon: ["fish", "#f07a5c"], sausage: ["long", "#c9583a"], shrimp: ["fish", "#f59a76"],
  steak: ["meat", "#d9483a"], tofu: ["block", "#f4efe2"],
  bread: ["bread", "#e3a55a"], tortilla: ["disc", "#f1d39b"],
  "frozen peas": ["box", "#3aa66b"], "frozen corn": ["box", "#fdcb4e"], "frozen mixed vegetables": ["box", "#7ab8e8"],
  "black beans": ["can", "#4a4560"], chickpeas: ["can", "#e8c37a"], "coconut milk": ["can", "#cdbfa8"], "canned tomatoes": ["can", "#ff5a1f"],
  "tomato paste": ["can", "#d8411e"], broth: ["carton", "#f0b44c"], tuna: ["can", "#5aa9e6"],
  pasta: ["jar", "#f4c95d"], spaghetti: ["jar", "#f0c04a"], rice: ["jar", "#ece5d4"], noodles: ["jar", "#f0d27a"], oats: ["jar", "#d9b98a"],
  quinoa: ["jar", "#e6cc8f"], flour: ["bag", "#efe9dc"], sugar: ["bag", "#f9c8d6"], "baking powder": ["can", "#f59ab0"],
  honey: ["jar", "#fcad1a"], "maple syrup": ["bottle", "#c06b1d"], "peanut butter": ["jar", "#c98b4f"], "soy sauce": ["bottle", "#5a3b2e"],
  salsa: ["jar", "#ff5a1f"], mayonnaise: ["jar", "#f6edc8"], mustard: ["bottle", "#fdcb4e"], "curry paste": ["jar", "#f7923a"],
  vinegar: ["bottle", "#d8c08a"], salt: ["shaker", "#eceef2"], "black pepper": ["shaker", "#5f5a6a"], oil: ["bottle", "#e8c547"],
  spices: ["shaker", "#e07a3a"], water: ["bottle", "#9fd8ff"],
  cumin: ["shaker", "#b5803a"], paprika: ["shaker", "#e0452b"], "chili powder": ["shaker", "#c8382a"], cayenne: ["shaker", "#e8502e"],
  "chili flakes": ["shaker", "#d9432b"], oregano: ["shaker", "#6f8f3a"], thyme: ["shaker", "#7c9a55"], rosemary: ["shaker", "#5f8a5a"],
  "dried basil": ["shaker", "#14a88e"], "italian seasoning": ["shaker", "#7aa04a"], "bay leaves": ["leaf", "#6f9a4a"], cinnamon: ["shaker", "#a0582d"],
  nutmeg: ["shaker", "#9a6a3d"], turmeric: ["shaker", "#f2b01e"], "curry powder": ["shaker", "#e8a21e"], "garlic powder": ["shaker", "#efe3cf"],
  "onion powder": ["shaker", "#ead9b8"], "ground ginger": ["shaker", "#e0b06a"], vanilla: ["bottle", "#5a3b2e"],
};

const CATEGORY_ICONS = {
  produce: ["fruit", "#8ccf7a"], dairy: ["carton", "#7ab8e8"], meat: ["meat", "#e8604c"], seafood: ["fish", "#f07a5c"],
  protein: ["block", "#f4efe2"], bakery: ["bread", "#e3a55a"], frozen: ["box", "#7ab8e8"], canned: ["can", "#c4a3cc"],
  grains: ["jar", "#f4c95d"], baking: ["bag", "#efe9dc"], condiments: ["bottle", "#f7923a"], spices: ["shaker", "#e07a3a"],
  staples: ["bottle", "#9fd8ff"], other: ["jar", "#c4a3cc"],
};

/** @returns {{svg: string, color: string}} */
export function foodIcon(name, category = "other") {
  const [shape, color] = FOOD_ICONS[name] || CATEGORY_ICONS[category] || CATEGORY_ICONS.other;
  const svg = SHAPES[shape](color, shade(color, -0.2), shade(color, 0.35));
  return { color, svg: `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">${svg}</svg>` };
}
