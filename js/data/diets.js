// Common allergies and diets for the Family tab. Each one says which ingredients
// it rules out, by catalog name, by category, or by words in the name, so it also
// works on Claude's ideas and your own recipes with ingredients the app doesn't know.
import { FOOD_BY_NAME } from "./foods.js";

const cat = (name) => FOOD_BY_NAME.get(name)?.category;
const has = (list) => (name) => list.includes(name);
const words = (re) => (name) => re.test(name);
const any = (...tests) => (name) => tests.some((t) => t(name));

const MEAT = any((n) => cat(n) === "meat", words(/\b(beef|pork|lamb|veal|chicken|turkey|duck|bacon|ham|sausages?|salami|chorizo|prosciutto|pepperoni|steak|ribs|mince|meatballs?|venison|hot ?dogs?|gelatin)\b/i));
const FISH = any(has(["salmon", "white fish", "tuna", "fish sauce", "worcestershire sauce"]), words(/\b(fish|salmon|tuna|cod|haddock|halibut|tilapia|trout|mackerel|sardines?|anchov(y|ies))\b/i));
const SHELLFISH = any(has(["shrimp", "scallops", "mussels", "crab"]), words(/\b(shrimps?|prawns?|crabs?|lobsters?|scallops?|mussels?|clams?|oysters?|squid|calamari|octopus|shellfish)\b/i));
const SEAFOOD = any(FISH, SHELLFISH, (n) => cat(n) === "seafood");
const EGG = any(has(["egg", "mayonnaise"]), words(/\beggs?\b|\bmayo/i));
const DAIRY = any((n) => cat(n) === "dairy", has(["ice cream"]), words(/\b(milk|cheese|butter|cream|yogh?o?urt|ghee|whey|casein)\b/i));
const NOT_DAIRY = (n) => ["plant milk", "peanut butter", "coconut milk", "egg"].includes(n) || /\b(almond|oat|soy|coconut|cashew|peanut)\b/i.test(n);
const DAIRY_SAFE = (n) => DAIRY(n) && !NOT_DAIRY(n);
const GLUTEN = any(has(["pasta", "spaghetti", "noodles", "bread", "buns", "bagel", "pita", "naan", "english muffin", "croissant", "tortilla", "flour", "breadcrumbs", "couscous", "soy sauce", "teriyaki sauce", "crackers", "cereal", "frozen pizza"]),
  words(/\b(wheat|flour|bread|sourdough|loaf|baguettes?|brioche|bagels?|muffins?|cakes?|cookies?|pastry|pie crust|buns?|bagels?|pasta|spaghetti|noodles?|couscous|barley|rye|semolina|crackers?|pizza|pita|naan|tortillas?|croissants?|breadcrumbs|panko|beer)\b/i));
const PEANUT = any(has(["peanut butter", "peanuts"]), words(/\bpeanuts?\b/i));
const TREE_NUT = any(has(["nuts", "pesto"]), words(/\b(almonds?|walnuts?|cashews?|pecans?|pistachios?|hazelnuts?|macadamias?|pine nuts?|brazil nuts?|nuts)\b/i));
const SOY = any(has(["soy sauce", "tofu", "teriyaki sauce"]), words(/\b(soy|soya|tofu|edamame|tempeh|miso)\b/i));
const SESAME = any(has(["hummus"]), words(/\b(sesame|tahini)\b/i));
const CARBY = any(GLUTEN, has(["rice", "oats", "quinoa", "potato", "sweet potato", "corn on the cob", "frozen corn", "sugar", "honey", "maple syrup", "banana", "black beans", "chickpeas", "kidney beans", "lentils", "refried beans", "mango", "grapes", "orange juice", "soda", "jam", "french fries", "cereal", "chips", "tortilla chips", "popcorn", "chocolate chips"]),
  words(/\b(rice|oats?|potato(es)?|sugar|syrup|honey|beans|lentils|chickpeas|corn|juice|soda|candy)\b/i));
const SWEET_STARCH = any(has(["sugar", "honey", "maple syrup", "jam", "soda", "orange juice", "chocolate chips", "cereal", "chips", "french fries"]), GLUTEN, words(/\b(sugar|syrup|candy|soda)\b/i));
const PORK = any(has(["pork", "ground pork", "pork chop", "bacon", "ham", "sausage", "pepperoni", "hot dogs"]), words(/\b(pork|bacon|ham|prosciutto|chorizo|salami|pepperoni|lard|gelatin)\b/i));
const SALTY = any(has(["salt", "soy sauce", "fish sauce", "bacon", "ham", "sausage", "pepperoni", "hot dogs", "parmesan", "feta", "broth", "teriyaki sauce", "worcestershire sauce", "chips", "tortilla chips", "crackers", "pasta sauce", "salsa"]), words(/\b(salt|salted|soy sauce|pickles?|olives?|bouillon|stock)\b/i));

export const ALLERGENS = [
  { id: "peanuts", label: "Peanuts", test: PEANUT },
  { id: "treenuts", label: "Tree nuts", test: TREE_NUT },
  { id: "dairy", label: "Dairy", test: DAIRY_SAFE },
  { id: "eggs", label: "Eggs", test: EGG },
  { id: "gluten", label: "Gluten", test: GLUTEN },
  { id: "shellfish", label: "Shellfish", test: SHELLFISH },
  { id: "fish", label: "Fish", test: FISH },
  { id: "soy", label: "Soy", test: SOY },
  { id: "sesame", label: "Sesame", test: SESAME },
];

// rule: "avoid" rules out ingredients (like an allergy, but a choice); "salt" adds advice instead.
export const DIETS = [
  { id: "vegetarian", label: "Vegetarian", rule: "avoid", test: any(MEAT, SEAFOOD), hint: "no meat or fish" },
  { id: "vegan", label: "Vegan", rule: "avoid", test: any(MEAT, SEAFOOD, DAIRY_SAFE, EGG, has(["honey"]), words(/\bhoney\b/i)), hint: "no animal products" },
  { id: "pescatarian", label: "Pescatarian", rule: "avoid", test: MEAT, hint: "fish but no meat" },
  { id: "keto", label: "Keto", rule: "avoid", test: CARBY, hint: "very low carb" },
  { id: "lowcarb", label: "Low carb", rule: "avoid", test: SWEET_STARCH, hint: "no bread, pasta or sugar" },
  { id: "glutenfree", label: "Gluten-free", rule: "avoid", test: GLUTEN, hint: "no wheat, barley or rye" },
  { id: "dairyfree", label: "Dairy-free", rule: "avoid", test: DAIRY_SAFE, hint: "no milk, cheese or butter" },
  { id: "halal", label: "Halal", rule: "avoid", test: PORK, hint: "no pork" },
  { id: "lowsalt", label: "Low salt", rule: "lowsalt", test: SALTY, hint: "little or no added salt" },
  { id: "highsalt", label: "High salt", rule: "highsalt", test: () => false, hint: "needs extra salt" },
];

export const ALLERGEN_BY_ID = Object.fromEntries(ALLERGENS.map((a) => [a.id, a]));
export const DIET_BY_ID = Object.fromEntries(DIETS.map((d) => [d.id, d]));
