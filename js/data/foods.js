// Food catalog: the canonical ingredient names the app understands.
//
// name       canonical name, used by recipes and inventory
// aliases    other spellings / receipt wording that mean the same food
// category   grouping shown in the UI
// location   where it is stored by default: fridge | pantry | freezer
// shelfLife  rough days it keeps in that location (used for "use soon" alerts)
// parent     optional generic food it can stand in for (cheddar -> cheese)
// staple     basics most kitchens always have (salt, oil...)

export const LOCATIONS = ["fridge", "freezer", "pantry"];

export const FOODS = [
  // Produce
  { name: "apple", aliases: ["apples", "gala", "honeycrisp", "fuji", "granny smith"], category: "produce", location: "fridge", shelfLife: 30 },
  { name: "avocado", aliases: ["avocados", "avo", "hass"], category: "produce", location: "pantry", shelfLife: 5 },
  { name: "banana", aliases: ["bananas", "bnna", "bnn"], category: "produce", location: "pantry", shelfLife: 6 },
  { name: "basil", aliases: ["fresh basil"], category: "produce", location: "fridge", shelfLife: 6 },
  { name: "bell pepper", aliases: ["bell peppers", "red pepper", "green pepper", "yellow pepper", "orange pepper", "sweet pepper", "capsicum"], category: "produce", location: "fridge", shelfLife: 10 },
  { name: "berries", aliases: ["strawberry", "strawberries", "blueberry", "blueberries", "raspberry", "raspberries", "blackberries"], category: "produce", location: "fridge", shelfLife: 5 },
  { name: "broccoli", aliases: ["broc", "brocc", "broccoli crown", "broccoli crowns"], category: "produce", location: "fridge", shelfLife: 7 },
  { name: "cabbage", aliases: ["green cabbage", "red cabbage", "napa cabbage"], category: "produce", location: "fridge", shelfLife: 21 },
  { name: "carrot", aliases: ["carrots", "crt", "crts", "baby carrots"], category: "produce", location: "fridge", shelfLife: 21 },
  { name: "celery", aliases: ["celery stalk", "celery hearts"], category: "produce", location: "fridge", shelfLife: 14 },
  { name: "cilantro", aliases: ["coriander", "clntro", "cilantr"], category: "produce", location: "fridge", shelfLife: 7 },
  { name: "cucumber", aliases: ["cucumbers", "cuc", "cuke", "english cucumber"], category: "produce", location: "fridge", shelfLife: 7 },
  { name: "garlic", aliases: ["grlc", "garlic bulb", "garlic cloves"], category: "produce", location: "pantry", shelfLife: 60 },
  { name: "ginger", aliases: ["ginger root", "gngr"], category: "produce", location: "fridge", shelfLife: 21 },
  { name: "green onion", aliases: ["green onions", "scallion", "scallions", "spring onion", "grn onion"], category: "produce", location: "fridge", shelfLife: 7 },
  { name: "kale", aliases: [], category: "produce", location: "fridge", shelfLife: 7 },
  { name: "lemon", aliases: ["lemons", "lmn"], category: "produce", location: "fridge", shelfLife: 21 },
  { name: "lettuce", aliases: ["romaine", "iceberg", "lttc", "mixed greens", "spring mix", "salad greens"], category: "produce", location: "fridge", shelfLife: 7 },
  { name: "lime", aliases: ["limes"], category: "produce", location: "fridge", shelfLife: 21 },
  { name: "mushroom", aliases: ["mushrooms", "mshrm", "mush", "cremini", "button mushrooms"], category: "produce", location: "fridge", shelfLife: 6 },
  { name: "onion", aliases: ["onions", "yellow onion", "white onion", "red onion", "onio", "onin"], category: "produce", location: "pantry", shelfLife: 30 },
  { name: "potato", aliases: ["potatoes", "pot", "russet", "yukon gold", "yukon", "potat"], category: "produce", location: "pantry", shelfLife: 30 },
  { name: "spinach", aliases: ["spin", "baby spinach", "spnch"], category: "produce", location: "fridge", shelfLife: 6 },
  { name: "sweet potato", aliases: ["sweet potatoes", "yam", "yams"], category: "produce", location: "pantry", shelfLife: 21 },
  { name: "tomato", aliases: ["tomatoes", "tom", "toms", "roma", "cherry tomatoes", "grape tomatoes", "tomatoe"], category: "produce", location: "pantry", shelfLife: 6 },
  { name: "zucchini", aliases: ["zucchinis", "zuke", "courgette"], category: "produce", location: "fridge", shelfLife: 7 },

  // Dairy and eggs
  { name: "butter", aliases: ["btr", "salted butter", "unsalted butter"], category: "dairy", location: "fridge", shelfLife: 60 },
  { name: "cheese", aliases: ["chs", "chz"], category: "dairy", location: "fridge", shelfLife: 21 },
  { name: "cheddar", aliases: ["cheddar cheese", "ched", "chdr"], category: "dairy", location: "fridge", shelfLife: 30, parent: "cheese" },
  { name: "feta", aliases: ["feta cheese"], category: "dairy", location: "fridge", shelfLife: 14, parent: "cheese" },
  { name: "mozzarella", aliases: ["mozz", "mozzarella cheese", "bocconcini"], category: "dairy", location: "fridge", shelfLife: 14, parent: "cheese" },
  { name: "parmesan", aliases: ["parm", "parmigiano", "parmesan cheese", "grana padano"], category: "dairy", location: "fridge", shelfLife: 60, parent: "cheese" },
  { name: "cream", aliases: ["heavy cream", "whipping cream", "cooking cream", "half and half", "crm"], category: "dairy", location: "fridge", shelfLife: 10 },
  { name: "cream cheese", aliases: ["philadelphia"], category: "dairy", location: "fridge", shelfLife: 21 },
  { name: "egg", aliases: ["eggs", "large eggs", "lrg eggs", "egg lrg", "eggs lg"], category: "dairy", location: "fridge", shelfLife: 28 },
  { name: "milk", aliases: ["mlk", "2% milk", "skim milk", "whole milk", "homo milk", "1% milk"], category: "dairy", location: "fridge", shelfLife: 7 },
  { name: "sour cream", aliases: ["sr crm"], category: "dairy", location: "fridge", shelfLife: 14 },
  { name: "yogurt", aliases: ["yoghurt", "yog", "ygrt", "greek yogurt", "yogourt"], category: "dairy", location: "fridge", shelfLife: 14 },

  // Meat and seafood
  { name: "bacon", aliases: ["bcn"], category: "meat", location: "fridge", shelfLife: 7 },
  { name: "chicken breast", aliases: ["chicken breasts", "chkn brst", "chicken brst", "boneless skinless chicken breast"], category: "meat", location: "fridge", shelfLife: 2, parent: "chicken" },
  { name: "chicken thigh", aliases: ["chicken thighs", "chkn thigh", "chkn thghs"], category: "meat", location: "fridge", shelfLife: 2, parent: "chicken" },
  { name: "chicken wing", aliases: ["chicken wings", "wings", "wing", "chkn wings", "party wings"], category: "meat", location: "fridge", shelfLife: 2, parent: "chicken" },
  { name: "chicken drumstick", aliases: ["chicken drumsticks", "drumsticks", "drumstick", "chicken legs", "chicken leg"], category: "meat", location: "fridge", shelfLife: 2, parent: "chicken" },
  { name: "chicken", aliases: ["chkn", "whole chicken", "rotisserie chicken"], category: "meat", location: "fridge", shelfLife: 2 },
  { name: "ground beef", aliases: ["grd beef", "lean ground beef", "minced beef", "hamburger"], category: "meat", location: "fridge", shelfLife: 2 },
  { name: "ground turkey", aliases: ["grd turkey"], category: "meat", location: "fridge", shelfLife: 2 },
  { name: "ham", aliases: ["deli ham", "sliced ham"], category: "meat", location: "fridge", shelfLife: 5 },
  { name: "pork chop", aliases: ["pork chops", "pork loin chop"], category: "meat", location: "fridge", shelfLife: 3 },
  { name: "salmon", aliases: ["salmon fillet", "atlantic salmon", "slmn"], category: "seafood", location: "fridge", shelfLife: 2 },
  { name: "sausage", aliases: ["sausages", "italian sausage", "ssg"], category: "meat", location: "fridge", shelfLife: 3 },
  { name: "shrimp", aliases: ["prawns", "shrmp"], category: "seafood", location: "freezer", shelfLife: 120 },
  { name: "steak", aliases: ["striploin", "ribeye", "sirloin", "flank steak"], category: "meat", location: "fridge", shelfLife: 3 },
  { name: "tofu", aliases: ["firm tofu", "extra firm tofu"], category: "protein", location: "fridge", shelfLife: 14 },

  // Bakery
  { name: "bread", aliases: ["brd", "loaf", "sandwich bread", "whole wheat bread", "white bread", "sourdough"], category: "bakery", location: "pantry", shelfLife: 6 },
  { name: "tortilla", aliases: ["tortillas", "wraps", "flour tortillas"], category: "bakery", location: "pantry", shelfLife: 14 },

  // Frozen
  { name: "frozen peas", aliases: ["peas", "green peas"], category: "frozen", location: "freezer", shelfLife: 240 },
  { name: "frozen corn", aliases: ["corn", "corn kernels"], category: "frozen", location: "freezer", shelfLife: 240 },
  { name: "frozen mixed vegetables", aliases: ["mixed vegetables", "mixed veg", "stir fry vegetables"], category: "frozen", location: "freezer", shelfLife: 240 },

  // Pantry
  { name: "black beans", aliases: ["blk beans", "black bean"], category: "canned", location: "pantry", shelfLife: 730 },
  { name: "chickpeas", aliases: ["garbanzo beans", "chick peas", "chickpea"], category: "canned", location: "pantry", shelfLife: 730 },
  { name: "coconut milk", aliases: ["cocnt milk"], category: "canned", location: "pantry", shelfLife: 730 },
  { name: "canned tomatoes", aliases: ["diced tomatoes", "crushed tomatoes", "tomato sauce", "passata", "can tomatoes"], category: "canned", location: "pantry", shelfLife: 730 },
  { name: "tomato paste", aliases: ["tom paste"], category: "canned", location: "pantry", shelfLife: 730 },
  { name: "broth", aliases: ["stock", "chicken broth", "vegetable broth", "beef broth", "chicken stock"], category: "canned", location: "pantry", shelfLife: 365 },
  { name: "tuna", aliases: ["canned tuna", "tuna can"], category: "canned", location: "pantry", shelfLife: 1000 },
  { name: "pasta", aliases: ["psta", "penne", "fusilli", "rotini", "macaroni", "linguine"], category: "grains", location: "pantry", shelfLife: 730 },
  { name: "spaghetti", aliases: ["spag", "spaghettini"], category: "grains", location: "pantry", shelfLife: 730, parent: "pasta" },
  { name: "rice", aliases: ["rce", "basmati", "jasmine rice", "white rice", "brown rice", "basmati rice"], category: "grains", location: "pantry", shelfLife: 730 },
  { name: "noodles", aliases: ["ramen", "rice noodles", "egg noodles", "udon"], category: "grains", location: "pantry", shelfLife: 365 },
  { name: "oats", aliases: ["rolled oats", "oatmeal", "quick oats"], category: "grains", location: "pantry", shelfLife: 365 },
  { name: "quinoa", aliases: [], category: "grains", location: "pantry", shelfLife: 730 },
  { name: "flour", aliases: ["all purpose flour", "ap flour", "flr"], category: "baking", location: "pantry", shelfLife: 365 },
  { name: "sugar", aliases: ["white sugar", "brown sugar", "granulated sugar"], category: "baking", location: "pantry", shelfLife: 730 },
  { name: "baking powder", aliases: [], category: "baking", location: "pantry", shelfLife: 365 },
  { name: "honey", aliases: [], category: "condiments", location: "pantry", shelfLife: 1000 },
  { name: "maple syrup", aliases: ["syrup"], category: "condiments", location: "fridge", shelfLife: 365 },
  { name: "peanut butter", aliases: ["pnut btr", "pb"], category: "condiments", location: "pantry", shelfLife: 180 },
  { name: "soy sauce", aliases: ["soya sauce", "tamari"], category: "condiments", location: "pantry", shelfLife: 730 },
  { name: "salsa", aliases: [], category: "condiments", location: "fridge", shelfLife: 14 },
  { name: "mayonnaise", aliases: ["mayo"], category: "condiments", location: "fridge", shelfLife: 60 },
  { name: "mustard", aliases: ["dijon"], category: "condiments", location: "fridge", shelfLife: 365 },
  { name: "curry paste", aliases: ["red curry paste", "green curry paste"], category: "condiments", location: "pantry", shelfLife: 365 },
  { name: "vinegar", aliases: ["white vinegar", "balsamic", "rice vinegar", "apple cider vinegar"], category: "condiments", location: "pantry", shelfLife: 1000, staple: true },

  // Staples (assumed on hand unless turned off in settings)
  { name: "salt", aliases: ["sea salt", "kosher salt"], category: "spices", location: "pantry", shelfLife: 3650, staple: true },
  { name: "black pepper", aliases: ["pepper", "peppercorns", "ground pepper"], category: "spices", location: "pantry", shelfLife: 1000, staple: true },
  { name: "oil", aliases: ["olive oil", "vegetable oil", "canola oil", "evoo", "sesame oil"], category: "condiments", location: "pantry", shelfLife: 365, staple: true },
  { name: "water", aliases: [], category: "staples", location: "pantry", shelfLife: 3650, staple: true },
  { name: "spices", aliases: ["mixed spices", "spice blend", "seasoning", "seasonings"], category: "spices", location: "pantry", shelfLife: 730, staple: true },

  // Seasonings for the spice rack. Each one counts as "spices" for recipes that just say spices.
  { name: "cumin", aliases: ["ground cumin", "cumin seed", "cumin seeds"], category: "spices", location: "pantry", shelfLife: 1000, parent: "spices" },
  { name: "paprika", aliases: ["smoked paprika", "sweet paprika"], category: "spices", location: "pantry", shelfLife: 1000, parent: "spices" },
  { name: "chili powder", aliases: ["chilli powder"], category: "spices", location: "pantry", shelfLife: 1000, parent: "spices" },
  { name: "cayenne", aliases: ["cayenne pepper"], category: "spices", location: "pantry", shelfLife: 1000, parent: "spices" },
  { name: "chili flakes", aliases: ["red pepper flakes", "crushed red pepper", "chilli flakes"], category: "spices", location: "pantry", shelfLife: 1000, parent: "spices" },
  { name: "oregano", aliases: ["dried oregano"], category: "spices", location: "pantry", shelfLife: 1000, parent: "spices" },
  { name: "thyme", aliases: ["dried thyme"], category: "spices", location: "pantry", shelfLife: 1000, parent: "spices" },
  { name: "rosemary", aliases: ["dried rosemary"], category: "spices", location: "pantry", shelfLife: 1000, parent: "spices" },
  { name: "dried basil", aliases: [], category: "spices", location: "pantry", shelfLife: 1000, parent: "spices" },
  { name: "italian seasoning", aliases: ["italian herbs", "herbes de provence", "mixed herbs"], category: "spices", location: "pantry", shelfLife: 1000, parent: "spices" },
  { name: "bay leaves", aliases: ["bay leaf"], category: "spices", location: "pantry", shelfLife: 1000, parent: "spices" },
  { name: "cinnamon", aliases: ["ground cinnamon", "cinnamon stick", "cinnamon sticks"], category: "spices", location: "pantry", shelfLife: 1000, parent: "spices" },
  { name: "nutmeg", aliases: ["ground nutmeg"], category: "spices", location: "pantry", shelfLife: 1000, parent: "spices" },
  { name: "turmeric", aliases: ["ground turmeric"], category: "spices", location: "pantry", shelfLife: 1000, parent: "spices" },
  { name: "curry powder", aliases: ["garam masala"], category: "spices", location: "pantry", shelfLife: 1000, parent: "spices" },
  { name: "garlic powder", aliases: ["granulated garlic"], category: "spices", location: "pantry", shelfLife: 1000, parent: "spices" },
  { name: "onion powder", aliases: [], category: "spices", location: "pantry", shelfLife: 1000, parent: "spices" },
  { name: "ground ginger", aliases: ["ginger powder"], category: "spices", location: "pantry", shelfLife: 1000, parent: "spices" },
  { name: "vanilla", aliases: ["vanilla extract"], category: "spices", location: "pantry", shelfLife: 1000, parent: "spices" },
];

export const FOOD_BY_NAME = new Map(FOODS.map((f) => [f.name, f]));
