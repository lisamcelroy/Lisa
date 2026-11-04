// Small hand-drawn food icons (inline SVG) for the fridge and pantry view.
// Each shape takes a fill colour; names map to a shape and colour, and
// anything unknown falls back to its category.

const LEAF = "#6cc35a";
const LID = "#c98b4f";

const SHAPES = {
  fruit: (c) => `<circle cx="12" cy="14" r="7" fill="${c}"/><path d="M12 7.5c0-2 .8-3.4 2.6-4.2" stroke="#6b4a2b" stroke-width="1.5" fill="none" stroke-linecap="round"/><ellipse cx="15.6" cy="5.4" rx="2.6" ry="1.3" fill="${LEAF}" transform="rotate(-25 15.6 5.4)"/><circle cx="9.3" cy="11.3" r="1.7" fill="#fff" opacity=".55"/>`,
  long: (c) => `<path d="M5 17c-.8-3 2-7.5 7-10s9-2.5 9.5-1-1.5 6.5-6.5 9.5S5.8 20 5 17z" fill="${c}"/><path d="M19.5 5.8l1.6-1.6" stroke="#6b4a2b" stroke-width="1.6" stroke-linecap="round"/><path d="M8 15c2-.5 5-2.5 7-5" stroke="#fff" stroke-width="1.2" opacity=".55" fill="none" stroke-linecap="round"/>`,
  leaf: (c) => `<path d="M5 19.5C4.5 11 10.5 4.5 20 4c.5 9.5-6 15.5-15 15.5z" fill="${c}"/><path d="M5.5 19L15 9.5" stroke="#fff" stroke-opacity=".6" stroke-width="1.4" stroke-linecap="round"/>`,
  carrot: (c) => `<path d="M5 20l4-11a3.4 3.4 0 0 1 6 6z" fill="${c}"/><path d="M14 8.5l3-3.2M15.3 10l4.2-1.2M12.8 7.5l.8-4.2" stroke="${LEAF}" stroke-width="1.9" stroke-linecap="round"/><path d="M8.6 13.5l1.6.6M7.4 16.6l1.4.5" stroke="#fff" stroke-opacity=".55" stroke-width="1.2" stroke-linecap="round"/>`,
  tree: (c) => `<rect x="10.4" y="13" width="3.2" height="7" rx="1.6" fill="#8fcf72"/><circle cx="8.5" cy="11" r="4" fill="${c}"/><circle cx="15.5" cy="11" r="4" fill="${c}"/><circle cx="12" cy="7.8" r="4.2" fill="${c}"/>`,
  mushroom: (c) => `<path d="M4 12a8 6.5 0 0 1 16 0z" fill="${c}"/><rect x="9.5" y="11.5" width="5" height="8" rx="2.5" fill="#f6ead8"/><circle cx="9" cy="9" r="1.2" fill="#fff" opacity=".6"/>`,
  onion: (c) => `<path d="M12 4c1 3 7 5 7 10a7 6 0 0 1-14 0c0-5 6-7 7-10z" fill="${c}"/><path d="M12 9v10M9 11c-1 3-1 5 0 7.5M15 11c1 3 1 5 0 7.5" stroke="#fff" stroke-opacity=".45" stroke-width="1.1" fill="none" stroke-linecap="round"/>`,
  egg: (c) => `<ellipse cx="12" cy="13" rx="6.2" ry="7.6" fill="${c}"/><ellipse cx="9.8" cy="10" rx="1.6" ry="2.3" fill="#fff" opacity=".7"/>`,
  carton: (c) => `<path d="M7 9.5L9 5h6l2 4.5V20a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1z" fill="#fff"/><path d="M7 9.5L9 5h6l2 4.5" fill="none" stroke="${c}" stroke-width="1.4" stroke-linejoin="round"/><rect x="7" y="12" width="10" height="6" fill="${c}"/><circle cx="12" cy="15" r="1.6" fill="#fff"/>`,
  cheese: (c) => `<path d="M3.5 16.5L16 8.5l4.5 3v7h-17z" fill="${c}"/><path d="M3.5 16.5h17" stroke="#fff" stroke-opacity=".5" stroke-width="1"/><circle cx="9" cy="18" r="1.2" fill="#fff" opacity=".6"/><circle cx="15.5" cy="14.5" r="1.4" fill="#fff" opacity=".6"/>`,
  block: (c) => `<rect x="4" y="9" width="16" height="9" rx="3" fill="${c}"/><rect x="4" y="9" width="7" height="9" rx="3" fill="#fff" opacity=".35"/>`,
  cup: (c) => `<path d="M6.3 9h11.4l-1.4 10a2 2 0 0 1-2 1.7h-4.6a2 2 0 0 1-2-1.7z" fill="${c}"/><rect x="5" y="6" width="14" height="3.4" rx="1.7" fill="#fff" stroke="${c}" stroke-width="1.2"/>`,
  meat: (c) => `<path d="M6.5 6.5c5-3.5 13-1 13 5.5s-6.5 8.5-10.5 7.5S3.5 16 3.5 13s.5-4.5 3-6.5z" fill="${c}"/><path d="M6 13c1.5 3 5 4.5 8.5 3.5" stroke="#fff" stroke-opacity=".6" stroke-width="1.4" fill="none" stroke-linecap="round"/><circle cx="14" cy="10.5" r="2.2" fill="#fff" opacity=".75"/>`,
  drumstick: (c) => `<path d="M13.5 4.5a6 6 0 0 1 6 6c0 3.5-3 5.5-6 5.5l-3 3a1.8 1.8 0 1 1-2.5-2.5l3-3c0-3 2-9 2.5-9z" fill="${c}"/><circle cx="7" cy="19.5" r="1.7" fill="#f6ead8"/><circle cx="5" cy="17.4" r="1.7" fill="#f6ead8"/><circle cx="15.5" cy="8.5" r="1.5" fill="#fff" opacity=".55"/>`,
  fish: (c) => `<path d="M2.5 12c3-4.5 8.5-5.5 12.5-3l5-3.2v12.4l-5-3.2c-4 2.5-9.5 1.5-12.5-3z" fill="${c}"/><circle cx="7" cy="11" r="1.1" fill="#2b2340"/><path d="M10 9.5c1 1.5 1 3.5 0 5" stroke="#fff" stroke-opacity=".6" stroke-width="1.2" fill="none" stroke-linecap="round"/>`,
  bread: (c) => `<path d="M3.5 11.5c0-3 2.5-4.5 5-4.5h7c2.5 0 5 1.5 5 4.5 0 1.3-.9 1.8-1.5 2V19a1 1 0 0 1-1 1h-12a1 1 0 0 1-1-1v-5.5c-.6-.2-1.5-.7-1.5-2z" fill="${c}"/><path d="M9 10l1.5 1.5M12.5 10l1.5 1.5M16 10l1.2 1.2" stroke="#fff" stroke-opacity=".6" stroke-width="1.3" stroke-linecap="round"/>`,
  can: (c) => `<rect x="6" y="4.5" width="12" height="16" rx="3" fill="${c}"/><rect x="6" y="10" width="12" height="5.5" fill="#fff" opacity=".6"/><ellipse cx="12" cy="5.2" rx="5" ry="1.1" fill="#fff" opacity=".45"/>`,
  jar: (c) => `<rect x="6" y="8" width="12" height="13" rx="3.5" fill="${c}"/><rect x="7" y="4" width="10" height="4.4" rx="1.6" fill="${LID}"/><rect x="8" y="12" width="8" height="4.5" rx="1.2" fill="#fff" opacity=".55"/>`,
  bottle: (c) => `<path d="M10 3h4v4.5l2.2 3V19a2 2 0 0 1-2 2H9.8a2 2 0 0 1-2-2v-8.5l2.2-3z" fill="${c}"/><rect x="7.8" y="12.5" width="8.4" height="4" fill="#fff" opacity=".55"/><rect x="9.6" y="2" width="4.8" height="2" rx="1" fill="#2b2340" opacity=".5"/>`,
  bag: (c) => `<path d="M6 8l1.5-3.5h9L18 8v11a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2z" fill="${c}"/><path d="M6.5 8h11" stroke="#2b2340" stroke-opacity=".15" stroke-width="1.2"/><circle cx="12" cy="14" r="2.6" fill="#fff" opacity=".6"/>`,
  box: (c) => `<rect x="4" y="6.5" width="16" height="13" rx="3.5" fill="${c}"/><path d="M12 9v8M8.6 11l6.8 4M15.4 11l-6.8 4" stroke="#fff" stroke-width="1.4" stroke-linecap="round"/>`,
  shaker: (c) => `<path d="M8 9h8v10a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2z" fill="${c}"/><path d="M8.8 4.5h6.4L16.2 9H7.8z" fill="#b8b4c6"/><circle cx="10.5" cy="6.6" r=".6" fill="#fff"/><circle cx="13.5" cy="6.6" r=".6" fill="#fff"/>`,
  bunch: (c) => `<path d="M7 20c1-6 1-10 0-15M12 20V4M17 20c-1-6-1-10 0-15" stroke="${c}" stroke-width="2.6" stroke-linecap="round" fill="none"/><path d="M5 15h14" stroke="#fff" stroke-opacity=".7" stroke-width="2" stroke-linecap="round"/>`,
  berries: (c) => `<circle cx="8" cy="14" r="4" fill="${c}"/><circle cx="15.5" cy="14.5" r="4" fill="${c}"/><circle cx="12" cy="8.5" r="4" fill="${c}"/><circle cx="11" cy="7.4" r="1" fill="#fff" opacity=".6"/><circle cx="7" cy="13" r="1" fill="#fff" opacity=".6"/>`,
};

// name: [shape, colour]
const FOOD_ICONS = {
  apple: ["fruit", "#ff5d6c"], avocado: ["fruit", "#6aa84f"], banana: ["long", "#ffd43b"], basil: ["leaf", "#49a84f"],
  "bell pepper": ["fruit", "#ff6b3d"], berries: ["berries", "#a23e8f"], broccoli: ["tree", "#3fa34d"],
  cabbage: ["fruit", "#a6e07f"], carrot: ["carrot", "#ff8c3b"], celery: ["bunch", "#9ad36a"], cilantro: ["leaf", "#5cb85c"],
  cucumber: ["long", "#4fae5b"], garlic: ["onion", "#efe3cf"], ginger: ["long", "#e0b06a"], "green onion": ["bunch", "#7ccf5a"],
  kale: ["leaf", "#3e8e41"], lemon: ["fruit", "#ffe04a"], lettuce: ["leaf", "#8bd36b"], lime: ["fruit", "#8bd34a"],
  mushroom: ["mushroom", "#c9a27e"], onion: ["onion", "#e8b07a"], potato: ["fruit", "#d8a466"], spinach: ["leaf", "#43a047"],
  "sweet potato": ["long", "#d0703f"], tomato: ["fruit", "#ff5a4e"], zucchini: ["long", "#3f9a49"],
  butter: ["block", "#ffe07a"], cheese: ["cheese", "#ffcf4a"], cheddar: ["cheese", "#ffb627"], feta: ["block", "#f6f1e4"],
  mozzarella: ["egg", "#fbf6ea"], parmesan: ["cheese", "#f5d67b"], cream: ["carton", "#8cc8ff"], "cream cheese": ["cup", "#cfe3ff"],
  egg: ["egg", "#f7e1bd"], milk: ["carton", "#6cc4ff"], "sour cream": ["cup", "#d6ccff"], yogurt: ["cup", "#b69cff"],
  bacon: ["meat", "#ff7a85"], "chicken breast": ["drumstick", "#ffb38a"], "chicken thigh": ["drumstick", "#ff9f73"],
  chicken: ["drumstick", "#ffaa7f"], "ground beef": ["meat", "#ff6f7d"], "ground turkey": ["meat", "#ff9aa2"], ham: ["meat", "#ffa0b0"],
  "pork chop": ["meat", "#ff9a9a"], salmon: ["fish", "#ff9a7a"], sausage: ["long", "#e7685a"], shrimp: ["fish", "#ff9d80"],
  steak: ["meat", "#e85a6a"], tofu: ["block", "#f1ead8"],
  bread: ["bread", "#e3a55a"], tortilla: ["egg", "#f1d39b"],
  "frozen peas": ["box", "#6fcf7f"], "frozen corn": ["box", "#ffd54a"], "frozen mixed vegetables": ["box", "#8fb8ff"],
  "black beans": ["can", "#5b5670"], chickpeas: ["can", "#e8c37a"], "coconut milk": ["can", "#d8cbb6"], "canned tomatoes": ["can", "#ff5a4e"],
  "tomato paste": ["can", "#e8473b"], broth: ["carton", "#f0b44c"], tuna: ["can", "#6cc4ff"],
  pasta: ["jar", "#f4c95d"], spaghetti: ["jar", "#f0c04a"], rice: ["jar", "#efe9da"], noodles: ["jar", "#f0d27a"], oats: ["jar", "#d9b98a"],
  quinoa: ["jar", "#e6cc8f"], flour: ["bag", "#f4f0e6"], sugar: ["bag", "#ffd6e5"], "baking powder": ["can", "#ff8fab"],
  honey: ["jar", "#ffb01f"], "maple syrup": ["bottle", "#c06b1d"], "peanut butter": ["jar", "#c98b4f"], "soy sauce": ["bottle", "#5a3b2e"],
  salsa: ["jar", "#ff6b3d"], mayonnaise: ["jar", "#fff1c9"], mustard: ["bottle", "#ffcd1f"], "curry paste": ["jar", "#ff9a3c"],
  vinegar: ["bottle", "#d8c08a"], salt: ["shaker", "#f4f4f4"], "black pepper": ["shaker", "#6d6878"], oil: ["bottle", "#e8c547"],
  spices: ["shaker", "#e07a3a"], water: ["bottle", "#9fd8ff"],
  "cumin": ["shaker", "#b5803a"], "paprika": ["shaker", "#e0452b"], "chili powder": ["shaker", "#c8382a"], "cayenne": ["shaker", "#e8502e"], "chili flakes": ["shaker", "#d9432b"], "oregano": ["shaker", "#6f8f3a"], "thyme": ["shaker", "#7c9a55"], "rosemary": ["shaker", "#5f8a5a"], "dried basil": ["shaker", "#5f9a4f"], "italian seasoning": ["shaker", "#7aa04a"], "bay leaves": ["leaf", "#7a9a4a"], "cinnamon": ["shaker", "#a0582d"], "nutmeg": ["shaker", "#9a6a3d"], "turmeric": ["shaker", "#f2b01e"], "curry powder": ["shaker", "#e8a21e"], "garlic powder": ["shaker", "#efe3cf"], "onion powder": ["shaker", "#ead9b8"], "ground ginger": ["shaker", "#e0b06a"], "vanilla": ["bottle", "#5a3b2e"],
};

const CATEGORY_ICONS = {
  produce: ["fruit", "#7ccf5a"], dairy: ["carton", "#8cc8ff"], meat: ["meat", "#ff8a95"], seafood: ["fish", "#ff9a7a"],
  protein: ["block", "#f1ead8"], bakery: ["bread", "#e3a55a"], frozen: ["box", "#9aa8ff"], canned: ["can", "#b69cff"],
  grains: ["jar", "#f4c95d"], baking: ["bag", "#f4f0e6"], condiments: ["bottle", "#ffb36b"], spices: ["shaker", "#e07a3a"],
  staples: ["bottle", "#9fd8ff"], other: ["jar", "#c9bfe6"],
};

// Each icon is filled with a soft airbrushed gradient: a second fruit colour
// glows from the upper left into the food's own colour, so shapes look like
// blurry, painted fruit rather than flat stickers.
const GLOWS = ["#ffe95a", "#ff9a55", "#ff86c2", "#c79bf0", "#ffcf5a"];
let gradientId = 0;

function glowFor(name) {
  let h = 0;
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return GLOWS[h % GLOWS.length];
}

/** @returns {{svg: string, color: string}} */
export function foodIcon(name, category = "other") {
  const [shape, color] = FOOD_ICONS[name] || CATEGORY_ICONS[category] || CATEGORY_ICONS.other;
  const id = `fg${gradientId++}`;
  const glow = glowFor(String(name));
  const defs =
    `<defs><radialGradient id="${id}" cx="32%" cy="28%" r="85%">` +
    `<stop offset="0" stop-color="${glow}"/><stop offset=".55" stop-color="${color}"/>` +
    `<stop offset="1" stop-color="${color}" stop-opacity=".92"/></radialGradient></defs>`;
  return {
    color,
    svg: `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">${defs}${SHAPES[shape](`url(#${id})`)}</svg>`,
  };
}
