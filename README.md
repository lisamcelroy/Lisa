# FridgeForMe

A phone-friendly web app that acts as your fridge and pantry. It keeps track of what you have,
reads your grocery receipts so purchases are added automatically, and suggests recipes based on
what is actually in your kitchen, starting with food that is about to go off.

## What it does

**Fridge** (the home tab)
- A drawing of your fridge, freezer and pantry with every item as a little illustrated bubble,
  sorted onto shelves: dairy on top, meat and fish in the middle, fruit and veg in the crisper,
  sauces in the door; grains, cans, sauces, a bread box and a produce basket in the pantry
- Items that need using soon wobble with an orange ring; expired ones get a red ring
- Tap an item to change the amount, move it, mark it used up, or see recipes that use it

**List**
- Fridge, freezer and pantry inventory with quantities and units
- Typing "eggs" or "2% milk" files the item in the right place and estimates a use-by date
- A "Use these soon" panel for anything expiring within 3 days
- Quick +/- buttons, move items between locations, search and filter

**Scan**
- Photograph a grocery receipt. Text is read on your device (Tesseract.js) and receipt shorthand
  is decoded (`ORG BNNA` -> banana, `CHKN BRST BNLS` -> chicken breast). Totals, tax, payment lines
  and coupons are skipped; multi-buys (`2 @ 2.50`) and weights (`0.85 kg`) are understood.
- You get a review list before anything is added. Lines it doesn't recognise (paper towels, etc.)
  start unticked.
- You can paste receipt text instead of taking a photo.
- Add recipes from a cookbook or recipe card: take a photo (or choose several for a recipe that runs
  over two pages). On claude.ai, Claude reads the page through your account and saves it straight to
  your recipes; elsewhere it's read on your device and you check the text before saving. You can also
  type or paste a recipe. Saved recipes join the matches.
- On claude.ai, receipt photos are read by Claude too, with on-device reading as the fallback.

**Recipes**
- Fresh ideas: opening the Recipes tab asks Claude for new recipes built from what you have (favouring food
  that expires soon), and asks again whenever your ingredients change. On claude.ai this uses your Claude
  account; run yourself, it uses the API key from Settings. "More ideas" gets a different batch, and any idea
  can be saved to your recipes.
- 34 built-in recipes, ranked by how much of each you already have
- Ready to cook / Almost there (1-2 items missing) / All / Mine filters
- Recipes that use up expiring food get boosted and labelled
- "Add missing to shopping list" and "I cooked this", which takes the ingredients out of your stock
- Basics like salt, pepper, oil and spices are assumed on hand (you can turn this off in Settings)

**Shopping list**
- Tick items as you shop, then move them into your kitchen in one tap

**Optional: Claude**
Add an Anthropic API key in Settings for much better receipt reading (straight from the photo),
recipe photo import, and fresh recipe ideas when running the app yourself. The key is
stored only in your browser and sent only to Anthropic. Without a key everything else still works.

**Saving.** On claude.ai, your kitchen, shopping list, saved recipes and ideas are saved to your own
private storage on the page (only you can read it), so they survive closing the page, cleared browser
data, and switching devices. The header shows "Saved" once a change is stored. Run on your own, data
stays in this browser's storage. Your API key is never saved anywhere but this browser.
Settings > Export backup still gives you a file copy.

## Running it

No build step. Serve the folder with any static web server:

```sh
npm start            # python3 -m http.server 8080
# open http://localhost:8080
```

To use it on your phone, host the folder anywhere that serves static files (GitHub Pages works)
and use "Add to Home Screen". The camera button on the Scan tab opens the phone camera.
Camera access and the Claude features need the page to be served over HTTPS (or localhost).

## Tests

```sh
npm test
```

Covers name matching, receipt parsing, recipe import, recipe ranking and cooking deductions.

## Project layout

```
index.html            app shell
css/styles.css        styles (light and dark)
js/app.js             UI and wiring
js/fridge.js          the fridge and pantry drawing: which shelf each item goes on
js/icons.js           food icons (inline SVG)
js/data/foods.js      food catalog: names, receipt aliases, storage location, shelf life
js/data/recipes.js    built-in recipes
js/normalize.js       turns free text into catalog foods
js/receipt.js         receipt text -> items
js/recipeImport.js    pasted recipe text -> recipe
js/recommend.js       recipe ranking and cooking deductions
js/units.js           unit conversion
js/store.js           local storage and merge rules for the saved copy
js/cloud.js           saving to your private storage on claude.ai
js/ocr.js             on-device text recognition (Tesseract.js, loaded on demand)
js/ai.js              optional Claude integration
```

To teach it a new food or receipt abbreviation, add an entry or alias in `js/data/foods.js`.
To add a built-in recipe, add it to `js/data/recipes.js` using catalog ingredient names
(the tests check this).
