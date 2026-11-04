// Best guess at what an unfamiliar food is, from words in its name, so anything
// not in the catalog still lands in the right aisle ("purple kohlrabi" is a
// vegetable, "lamb shank" is meat, "oat milk" is dairy).

const FRUIT = /\b(apples?|oranges?|clementines?|mandarins?|tangerines?|grapes?|mangos?|mangoes|peach(es)?|pears?|plums?|cherr(y|ies)|melons?|watermelons?|cantaloupes?|honeydews?|kiwis?|pineapples?|berr(y|ies)|strawberr(y|ies)|blueberr(y|ies)|raspberr(y|ies)|blackberr(y|ies)|cranberr(y|ies)|nectarines?|apricots?|figs?|dates|grapefruits?|pomegranates?|papayas?|limes?|lemons?|bananas?|avocados?|guavas?|lychees?|passion ?fruits?|persimmons?|plantains?|coconuts?|\w*fruits?)\b/i;

// Checked in order: the first rule that matches wins.
const RULES = [
  ["sauce", /\b(sauces?|dressings?|gravy|gravies|marinades?|glazes?)\b/i],
  ["frozen", /\b(frozen|ice cream|gelato|popsicles?|sorbet)\b/i],
  ["spices", /\b(spices?|seasonings?|rubs?|spice blend|powder|paprika|cumin|oregano|thyme|rosemary|cinnamon|nutmeg|cloves|cardamom|coriander seeds?|peppercorns?|flakes)\b/i],
  ["protein", /\b(veggie|plant[- ]based|meatless|vegan|beyond|impossible|tempeh|seitan|falafel)\b/i],
  ["seafood", /\b(fish|salmon|tuna|cod|haddock|halibut|tilapia|trout|mackerel|sardines?|anchov(y|ies)|shrimps?|prawns?|crabs?|lobsters?|scallops?|mussels?|clams?|oysters?|squid|calamari|octopus|seafood)\b/i],
  ["meat", /\b(beef|pork|lamb|veal|chicken|turkey|duck|goose|bacon|ham|sausages?|salami|chorizo|prosciutto|pepperoni|steaks?|ribs?|brisket|roast|mince|jerky|meatballs?|venison|bison|patt(y|ies)|cutlets?|kotlet\w*|schnitzels?|nuggets?|meatloaf|hot ?dogs?|wieners?|pastrami|deli meat|cold cuts?)\b/i],
  ["condiments", /\b(sauce|ketchup|dressing|jam|jelly|marmalade|syrup|vinegar|oil|relish|pickles?|mayo|mustard|spread|dip|salsa|pesto|hummus|tahini|aioli|sriracha|gochujang|miso|chutney|honey)\b/i],
  ["drinks", /\b(juice|soda|pop|sparkling|water|coffee|tea|kombucha|beer|wine|cider|drinks?|lemonade|smoothies?|cola|coke|pepsi|sprite|ginger ale|root beer|seltzer|tonic|gatorade|powerade|energy drink|espresso|latte|milkshake)\b/i],
  ["dairy", /\b(cheese|milk|cream|yogh?o?urt|kefir|ghee|custard|creamer|eggs?|brie|camembert|gouda|provolone|ricotta|mascarpone|halloumi|paneer)\b/i],
  ["fruit", FRUIT],
  ["produce", /\b(lettuce|greens|salad|squash|peppers?|chil(i|e|li)s?|cabbage|chard|collards?|radicchio|endive|kohlrabi|rutabagas?|turnips?|parsnips?|beets?|radish(es)?|yams?|roots?|sprouts?|tomatillos?|celeriac|herbs?|chives?|sage|tarragon|watercress|microgreens|asparagus|broccol\w*|rapini|romanesco|artichokes?|okra|fennel|leeks?|shallots?|scallions?|eggplants?|aubergines?|cauliflower|beans? sprouts?|green beans?|snap peas?|snow peas?|corn on the cob|pumpkins?|gourds?|cress|arugula|rocket|bok choy|pak choi|veg|vegetables?|veggies?)\b/i],
  ["bakery", /\b(bread|buns?|rolls?|bagels?|muffins?|croissants?|pitas?|naan|tortillas?|baguettes?|loaf|brioche|scones?|cakes?|pies?|donuts?|doughnuts?|wraps?|flatbreads?|crumpets?)\b/i],
  ["baking", /\b(flour|sugar|yeast|baking|cocoa|chocolate chips?|extract|cornstarch|corn starch|icing|sprinkles|molasses|gelatin)\b/i],
  ["grains", /\b(rice|pasta|noodles?|grains?|oats?|oatmeal|barley|couscous|farro|cereal|granola|bulgur|polenta|quinoa|orzo|lasagna|macaroni|breadcrumbs?|panko)\b/i],
  ["canned", /\b(canned|tinned|beans|lentils|chickpeas|soup|broth|stock)\b/i],
  ["snacks", /\b(chips|crisps|crackers?|cookies?|biscuits?|pretzels?|popcorn|nuts?|almonds?|cashews?|walnuts?|pecans?|pistachios?|peanuts?|trail mix|bars?|candy|chocolate|gummies|seeds)\b/i],
];

// Where each kind usually lives and roughly how long it keeps there (days).
const DEFAULTS = {
  sauce: ["fridge", 60], protein: ["fridge", 7], produce: ["fridge", 7], fruit: ["fridge", 7], meat: ["fridge", 2], seafood: ["fridge", 2], dairy: ["fridge", 14],
  bakery: ["pantry", 6], baking: ["pantry", 365], grains: ["pantry", 365], condiments: ["pantry", 180],
  spices: ["pantry", 730], canned: ["pantry", 730], drinks: ["fridge", 14], snacks: ["pantry", 90], frozen: ["freezer", 180],
};

export const isFruitName = (name) => FRUIT.test(String(name || ""));

/** { category, location, shelfLife } for a food name, or null when there's no clue. */
export function guessFood(name) {
  const text = String(name || "").toLowerCase();
  for (const [kind, re] of RULES) {
    if (!re.test(text)) continue;
    const [location, shelfLife] = DEFAULTS[kind];
    return { category: kind === "fruit" ? "produce" : kind === "sauce" ? "condiments" : kind, location, shelfLife };
  }
  return null;
}
