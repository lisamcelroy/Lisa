// Built-in recipe library. Ingredient names must be catalog names from foods.js.
// i(name, qty, unit, optional)
const i = (name, qty = 1, unit = "count", optional = false) => ({ name, qty, unit, optional });

export const RECIPES = [
  {
    id: "veggie-omelette", title: "Veggie Omelette", minutes: 15, servings: 1, tags: ["breakfast", "vegetarian", "quick"],
    ingredients: [i("egg", 3), i("bell pepper", 0.5), i("spinach", 1, "cup"), i("cheese", 30, "g", true), i("butter", 1, "tbsp"), i("salt"), i("black pepper")],
    steps: ["Whisk eggs with a pinch of salt and pepper.", "Saute chopped pepper and spinach in butter for 2 minutes.", "Pour in eggs, cook gently until almost set, add cheese, fold and serve."],
  },
  {
    id: "french-toast", title: "French Toast", minutes: 15, servings: 2, tags: ["breakfast", "vegetarian"],
    ingredients: [i("bread", 4, "slice"), i("egg", 2), i("milk", 0.5, "cup"), i("butter", 1, "tbsp"), i("maple syrup", 2, "tbsp", true), i("spices", 1, "count", true)],
    steps: ["Whisk eggs, milk and a little cinnamon.", "Dip bread slices on both sides.", "Fry in butter until golden on both sides. Serve with syrup."],
  },
  {
    id: "overnight-oats", title: "Overnight Oats", minutes: 5, servings: 1, tags: ["breakfast", "vegetarian", "make-ahead"],
    ingredients: [i("oats", 0.5, "cup"), i("milk", 0.5, "cup"), i("yogurt", 0.25, "cup"), i("berries", 0.5, "cup", true), i("honey", 1, "tbsp", true)],
    steps: ["Stir oats, milk and yogurt together in a jar.", "Top with berries and honey.", "Refrigerate overnight."],
  },
  {
    id: "banana-pancakes", title: "Banana Pancakes", minutes: 20, servings: 2, tags: ["breakfast", "vegetarian"],
    ingredients: [i("banana", 2), i("egg", 2), i("flour", 0.5, "cup"), i("milk", 0.5, "cup"), i("baking powder", 1, "tsp"), i("butter", 1, "tbsp"), i("maple syrup", 2, "tbsp", true)],
    steps: ["Mash bananas, whisk in eggs and milk.", "Stir in flour and baking powder.", "Cook spoonfuls in a buttered pan, 2 minutes per side."],
  },
  {
    id: "spaghetti-bolognese", title: "Spaghetti Bolognese", minutes: 40, servings: 4, tags: ["dinner", "family"],
    ingredients: [i("spaghetti", 400, "g"), i("ground beef", 450, "g"), i("onion", 1), i("garlic", 2), i("carrot", 1, "count", true), i("canned tomatoes", 1, "can"), i("tomato paste", 2, "tbsp", true), i("parmesan", 30, "g", true), i("oil"), i("salt")],
    steps: ["Brown the beef in oil, then add diced onion, carrot and garlic.", "Add tomatoes and paste, simmer 20 minutes.", "Cook spaghetti, toss with sauce and top with parmesan."],
  },
  {
    id: "garlic-butter-pasta", title: "Garlic Butter Pasta", minutes: 15, servings: 2, tags: ["dinner", "vegetarian", "quick"],
    ingredients: [i("pasta", 200, "g"), i("butter", 3, "tbsp"), i("garlic", 3), i("parmesan", 40, "g"), i("spices", 1, "count", true), i("salt")],
    steps: ["Cook pasta, reserve a little water.", "Gently cook sliced garlic in butter.", "Toss pasta with garlic butter, parmesan and splash of water. Add chili flakes if you like."],
  },
  {
    id: "creamy-mushroom-pasta", title: "Creamy Mushroom Pasta", minutes: 25, servings: 2, tags: ["dinner", "vegetarian"],
    ingredients: [i("pasta", 200, "g"), i("mushroom", 250, "g"), i("cream", 0.5, "cup"), i("garlic", 2), i("parmesan", 30, "g"), i("spinach", 1, "cup", true), i("butter", 1, "tbsp"), i("salt")],
    steps: ["Cook pasta.", "Brown sliced mushrooms in butter, add garlic.", "Pour in cream, simmer, stir in spinach and parmesan, toss with pasta."],
  },
  {
    id: "chicken-stir-fry", title: "Chicken Stir Fry", minutes: 25, servings: 3, tags: ["dinner", "quick"],
    ingredients: [i("chicken", 450, "g"), i("broccoli", 1), i("bell pepper", 1), i("carrot", 1, "count", true), i("soy sauce", 3, "tbsp"), i("garlic", 2), i("ginger", 1, "count", true), i("rice", 1, "cup"), i("oil")],
    steps: ["Cook rice.", "Stir fry sliced chicken in hot oil until browned; remove.", "Stir fry vegetables, garlic and ginger, return chicken, add soy sauce. Serve over rice."],
  },
  {
    id: "fried-rice", title: "Fried Rice", minutes: 20, servings: 2, tags: ["dinner", "leftovers", "quick"],
    ingredients: [i("rice", 1, "cup"), i("egg", 2), i("frozen mixed vegetables", 1, "cup"), i("green onion", 2, "count", true), i("soy sauce", 2, "tbsp"), i("garlic", 1), i("oil")],
    steps: ["Use cold cooked rice if you have it.", "Scramble eggs in oil, set aside.", "Fry garlic and vegetables, add rice and soy sauce, fold in eggs and green onion."],
  },
  {
    id: "chicken-curry", title: "Coconut Chicken Curry", minutes: 35, servings: 4, tags: ["dinner"],
    ingredients: [i("chicken", 600, "g"), i("coconut milk", 1, "can"), i("curry paste", 2, "tbsp"), i("onion", 1), i("garlic", 2), i("ginger", 1, "count", true), i("spinach", 2, "cup", true), i("rice", 1.5, "cup"), i("oil")],
    steps: ["Cook rice.", "Soften onion, garlic and ginger in oil, stir in curry paste.", "Add chicken and coconut milk, simmer 15 minutes, wilt in spinach."],
  },
  {
    id: "chickpea-curry", title: "Chickpea and Spinach Curry", minutes: 30, servings: 4, tags: ["dinner", "vegetarian", "vegan"],
    ingredients: [i("chickpeas", 2, "can"), i("coconut milk", 1, "can"), i("canned tomatoes", 1, "can"), i("onion", 1), i("garlic", 3), i("curry paste", 2, "tbsp"), i("spinach", 2, "cup"), i("rice", 1.5, "cup", true), i("oil")],
    steps: ["Soften onion and garlic in oil, add curry paste.", "Add chickpeas, tomatoes and coconut milk, simmer 15 minutes.", "Stir in spinach. Serve with rice."],
  },
  {
    id: "black-bean-tacos", title: "Black Bean Tacos", minutes: 20, servings: 3, tags: ["dinner", "vegetarian", "quick"],
    ingredients: [i("tortilla", 6), i("black beans", 1, "can"), i("onion", 0.5), i("avocado", 1), i("salsa", 0.5, "cup"), i("lime", 1, "count", true), i("cilantro", 1, "bunch", true), i("cheese", 50, "g", true), i("spices")],
    steps: ["Warm beans with diced onion and cumin, mash lightly.", "Warm tortillas.", "Fill with beans, avocado, salsa, cheese, cilantro and a squeeze of lime."],
  },
  {
    id: "beef-tacos", title: "Ground Beef Tacos", minutes: 25, servings: 4, tags: ["dinner", "family"],
    ingredients: [i("ground beef", 450, "g"), i("tortilla", 8), i("onion", 1), i("lettuce", 1, "cup"), i("tomato", 1), i("cheddar", 100, "g"), i("sour cream", 0.5, "cup", true), i("salsa", 0.5, "cup", true), i("spices")],
    steps: ["Brown beef with onion and chili powder and cumin.", "Chop lettuce and tomato, grate cheese.", "Build tacos with your toppings."],
  },
  {
    id: "quesadillas", title: "Cheese Quesadillas", minutes: 15, servings: 2, tags: ["lunch", "vegetarian", "quick"],
    ingredients: [i("tortilla", 4), i("cheese", 150, "g"), i("bell pepper", 0.5, "count", true), i("chicken", 150, "g", true), i("salsa", 0.25, "cup", true), i("butter", 1, "tbsp")],
    steps: ["Fill half of each tortilla with cheese and any extras, fold.", "Cook in a buttered pan until crisp and melted, flipping once.", "Cut into wedges and serve with salsa."],
  },
  {
    id: "sheet-pan-salmon", title: "Sheet Pan Salmon and Veg", minutes: 30, servings: 2, tags: ["dinner", "healthy"],
    ingredients: [i("salmon", 2), i("broccoli", 1), i("potato", 2), i("lemon", 1), i("garlic", 2), i("oil"), i("salt"), i("black pepper")],
    steps: ["Heat oven to 220C / 425F.", "Roast cubed potatoes with oil 15 minutes.", "Add broccoli and salmon, top with garlic and lemon slices, roast 12 more minutes."],
  },
  {
    id: "lemon-garlic-shrimp", title: "Lemon Garlic Shrimp Pasta", minutes: 20, servings: 2, tags: ["dinner", "quick"],
    ingredients: [i("shrimp", 300, "g"), i("pasta", 200, "g"), i("garlic", 3), i("lemon", 1), i("butter", 2, "tbsp"), i("spinach", 1, "cup", true), i("parmesan", 20, "g", true), i("oil")],
    steps: ["Cook pasta.", "Saute shrimp and garlic in oil and butter until pink.", "Add lemon juice and zest, toss with pasta and spinach."],
  },
  {
    id: "chicken-noodle-soup", title: "Chicken Noodle Soup", minutes: 40, servings: 4, tags: ["soup", "comfort"],
    ingredients: [i("chicken", 400, "g"), i("broth", 1.5, "l"), i("carrot", 2), i("celery", 2), i("onion", 1), i("noodles", 150, "g"), i("garlic", 2), i("salt"), i("spices", 1, "count", true)],
    steps: ["Soften onion, carrot, celery and garlic in a pot.", "Add broth and chicken, simmer 20 minutes; shred chicken.", "Add noodles, cook until tender, season."],
  },
  {
    id: "tomato-soup", title: "Roasted Tomato Soup", minutes: 45, servings: 4, tags: ["soup", "vegetarian"],
    ingredients: [i("tomato", 6), i("onion", 1), i("garlic", 4), i("broth", 0.75, "l"), i("cream", 0.25, "cup", true), i("basil", 1, "bunch", true), i("oil"), i("salt")],
    steps: ["Roast halved tomatoes, onion and garlic with oil at 200C / 400F for 30 minutes.", "Blend with broth, simmer 10 minutes.", "Stir in cream and basil."],
  },
  {
    id: "minestrone", title: "Minestrone", minutes: 40, servings: 6, tags: ["soup", "vegetarian", "vegan"],
    ingredients: [i("onion", 1), i("carrot", 2), i("celery", 2), i("zucchini", 1, "count", true), i("canned tomatoes", 1, "can"), i("broth", 1.5, "l"), i("chickpeas", 1, "can"), i("pasta", 100, "g"), i("kale", 2, "cup", true), i("garlic", 2), i("oil")],
    steps: ["Soften onion, carrot, celery and garlic in oil.", "Add tomatoes, broth and chickpeas, simmer 15 minutes.", "Add pasta, zucchini and kale; cook until pasta is tender."],
  },
  {
    id: "potato-leek-soup", title: "Creamy Potato Soup", minutes: 35, servings: 4, tags: ["soup", "vegetarian", "comfort"],
    ingredients: [i("potato", 4), i("onion", 1), i("broth", 1, "l"), i("milk", 1, "cup"), i("butter", 2, "tbsp"), i("bacon", 4, "slice", true), i("cheddar", 50, "g", true), i("green onion", 2, "count", true), i("salt")],
    steps: ["Cook onion in butter, add cubed potatoes and broth, simmer 20 minutes.", "Blend partly, stir in milk.", "Top with bacon, cheddar and green onion."],
  },
  {
    id: "greek-salad", title: "Greek Salad", minutes: 10, servings: 2, tags: ["salad", "vegetarian", "quick"],
    ingredients: [i("cucumber", 1), i("tomato", 2), i("bell pepper", 1, "count", true), i("onion", 0.25), i("feta", 100, "g"), i("lemon", 0.5, "count", true), i("oil"), i("vinegar"), i("spices")],
    steps: ["Chop vegetables into chunks.", "Top with feta.", "Dress with oil, vinegar or lemon and oregano."],
  },
  {
    id: "chicken-caesar-wrap", title: "Chicken Caesar Wraps", minutes: 15, servings: 2, tags: ["lunch", "quick"],
    ingredients: [i("tortilla", 2), i("chicken", 200, "g"), i("lettuce", 2, "cup"), i("parmesan", 30, "g"), i("mayonnaise", 2, "tbsp"), i("lemon", 0.5), i("bacon", 2, "slice", true)],
    steps: ["Mix mayo, lemon juice and grated parmesan for a quick dressing.", "Toss with chopped lettuce and sliced cooked chicken.", "Wrap in tortillas."],
  },
  {
    id: "tuna-melt", title: "Tuna Melt", minutes: 10, servings: 2, tags: ["lunch", "quick"],
    ingredients: [i("tuna", 1, "can"), i("mayonnaise", 2, "tbsp"), i("bread", 4, "slice"), i("cheddar", 60, "g"), i("celery", 1, "count", true), i("butter", 1, "tbsp")],
    steps: ["Mix tuna, mayo and chopped celery.", "Spread on bread, top with cheese and second slice.", "Grill in butter until golden and melty."],
  },
  {
    id: "grilled-cheese", title: "Grilled Cheese and Tomato", minutes: 10, servings: 1, tags: ["lunch", "vegetarian", "quick"],
    ingredients: [i("bread", 2, "slice"), i("cheese", 60, "g"), i("butter", 1, "tbsp"), i("tomato", 0.5, "count", true), i("ham", 2, "slice", true)],
    steps: ["Butter the outside of the bread.", "Fill with cheese, tomato and ham.", "Cook over medium heat until golden on both sides."],
  },
  {
    id: "shakshuka", title: "Shakshuka", minutes: 25, servings: 2, tags: ["breakfast", "vegetarian"],
    ingredients: [i("egg", 4), i("canned tomatoes", 1, "can"), i("onion", 1), i("bell pepper", 1), i("garlic", 2), i("feta", 50, "g", true), i("bread", 2, "slice", true), i("spices"), i("oil")],
    steps: ["Soften onion, pepper and garlic with paprika and cumin.", "Add tomatoes and simmer 10 minutes.", "Make wells, crack in eggs, cover and cook until whites set. Top with feta."],
  },
  {
    id: "frittata", title: "Clean-Out-The-Fridge Frittata", minutes: 25, servings: 4, tags: ["breakfast", "vegetarian", "leftovers"],
    ingredients: [i("egg", 6), i("milk", 0.25, "cup"), i("cheese", 60, "g"), i("spinach", 1, "cup", true), i("mushroom", 100, "g", true), i("onion", 0.5, "count", true), i("potato", 1, "count", true), i("oil")],
    steps: ["Heat oven to 200C / 400F.", "Cook any vegetables in an oven-safe pan with oil.", "Pour over eggs whisked with milk and cheese, cook 3 minutes then bake 10-12 minutes."],
  },
  {
    id: "pork-chops-apples", title: "Pork Chops with Apples", minutes: 30, servings: 2, tags: ["dinner"],
    ingredients: [i("pork chop", 2), i("apple", 2), i("onion", 1), i("butter", 1, "tbsp"), i("mustard", 1, "tbsp", true), i("broth", 0.5, "cup"), i("salt"), i("black pepper")],
    steps: ["Season and sear chops in butter 4 minutes per side; set aside.", "Cook sliced apple and onion until soft.", "Add broth and mustard, return chops and simmer 5 minutes."],
  },
  {
    id: "steak-potatoes", title: "Steak and Crispy Potatoes", minutes: 40, servings: 2, tags: ["dinner"],
    ingredients: [i("steak", 2), i("potato", 3), i("butter", 2, "tbsp"), i("garlic", 2), i("lettuce", 2, "cup", true), i("oil"), i("salt"), i("black pepper")],
    steps: ["Roast cubed potatoes with oil at 220C / 425F for 30 minutes.", "Sear seasoned steak in a hot pan, baste with butter and garlic.", "Rest 5 minutes, slice and serve with potatoes and salad."],
  },
  {
    id: "sausage-veg-bake", title: "Sausage and Veg Traybake", minutes: 40, servings: 3, tags: ["dinner", "family"],
    ingredients: [i("sausage", 6), i("potato", 3), i("bell pepper", 1), i("onion", 1), i("zucchini", 1, "count", true), i("oil"), i("spices"), i("salt")],
    steps: ["Heat oven to 210C / 410F.", "Toss chopped vegetables and sausages with oil and seasoning.", "Roast 35 minutes, turning once."],
  },
  {
    id: "tofu-noodle-bowl", title: "Peanut Tofu Noodle Bowl", minutes: 25, servings: 2, tags: ["dinner", "vegetarian", "vegan"],
    ingredients: [i("tofu", 1, "pkg"), i("noodles", 200, "g"), i("peanut butter", 3, "tbsp"), i("soy sauce", 2, "tbsp"), i("lime", 1, "count", true), i("carrot", 1), i("cucumber", 1, "count", true), i("green onion", 2, "count", true), i("oil")],
    steps: ["Pan fry cubed tofu in oil until crisp.", "Whisk peanut butter, soy sauce, lime and warm water into a sauce.", "Toss with cooked noodles and shredded vegetables, top with tofu."],
  },
  {
    id: "sweet-potato-bowl", title: "Sweet Potato Black Bean Bowl", minutes: 35, servings: 2, tags: ["dinner", "vegetarian", "healthy"],
    ingredients: [i("sweet potato", 2), i("black beans", 1, "can"), i("quinoa", 1, "cup"), i("avocado", 1), i("salsa", 0.5, "cup", true), i("lime", 1, "count", true), i("spices"), i("oil")],
    steps: ["Roast cubed sweet potato with oil and cumin 25 minutes.", "Cook quinoa, warm beans.", "Build bowls and top with avocado, salsa and lime."],
  },
  {
    id: "turkey-chili", title: "Turkey Chili", minutes: 45, servings: 6, tags: ["dinner", "make-ahead"],
    ingredients: [i("ground turkey", 450, "g"), i("black beans", 1, "can"), i("canned tomatoes", 1, "can"), i("onion", 1), i("bell pepper", 1), i("garlic", 2), i("frozen corn", 1, "cup", true), i("sour cream", 0.5, "cup", true), i("spices"), i("oil")],
    steps: ["Brown turkey with onion, pepper and garlic.", "Add chili powder, cumin, tomatoes, beans and corn.", "Simmer 25 minutes. Serve with sour cream."],
  },
  {
    id: "yogurt-parfait", title: "Yogurt Berry Parfait", minutes: 5, servings: 1, tags: ["breakfast", "snack", "vegetarian", "quick"],
    ingredients: [i("yogurt", 1, "cup"), i("berries", 0.5, "cup"), i("oats", 0.25, "cup", true), i("honey", 1, "tbsp", true)],
    steps: ["Layer yogurt, berries and oats in a glass.", "Drizzle with honey."],
  },
  {
    id: "stuffed-peppers", title: "Stuffed Peppers", minutes: 50, servings: 4, tags: ["dinner", "family"],
    ingredients: [i("bell pepper", 4), i("ground beef", 400, "g"), i("rice", 0.75, "cup"), i("canned tomatoes", 1, "can"), i("onion", 1), i("cheese", 100, "g"), i("spices"), i("oil")],
    steps: ["Cook rice. Brown beef with onion and seasoning, stir in rice and half the tomatoes.", "Fill halved peppers, top with remaining tomatoes and cheese.", "Bake at 190C / 375F for 30 minutes."],
  },
];
