# Inside my Kitchen

A phone-first web app that acts as your fridge and pantry: it tracks what you have, reads grocery
receipts and recipe photos, suggests recipes from what's on hand, plans meals with calories, and
reminds you to defrost. Plain HTML, CSS and ES modules. No build step, no framework, no npm
dependencies.

## Working with the owner

- Never use emojis or em dashes, in replies, code, commit messages or app text.
- Food art is drawn as inline SVG (`js/icons.js`, `js/mascot.js`), never emoji.
- Show the result: after visual changes, take phone-sized screenshots and send them.
- Develop on branch `claude/recipe-pantry-scanner-app-5x8123`; commit and push after each change.
  Do not open a pull request unless asked.

## Run and test

```sh
npm start        # python3 -m http.server 8080, then open http://localhost:8080
npm test         # node --test test/*.test.js (pure logic only)
```

Check the UI with Playwright (preinstalled; `require('playwright')`, `devices['iPhone 13']`) against
the local server. Hide the splash in tests by setting `#splash` to `display: none`, and seed
`localStorage` key `fridgemate:v1` with `{settings: {name: "Lisa", nameAsked: true}}` to skip the
name prompt. Write test scripts to a file first: inline shell heredocs containing `.remove()` can
trip a shell safety check.

## Published app

Live (private) at https://claude.ai/artifact/Y9cQDkigxbgmJixeDpFKjp. Update it by publishing
`index.html` with the Artifact tool and listing changed files in `files`, for example
`{"css/styles.css": "css/styles.css", "js/app.js": "js/app.js"}`. Omit `capabilities` to keep the
current ones: `sample` (with `images: true`), `db` and `user`.

- `sample`: on claude.ai the page asks Claude through the viewer's own account (recipe ideas,
  receipt and recipe photos). Outside claude.ai it falls back to an API key in Settings, then to
  on-device OCR (Tesseract.js).
- `db` + `user`: the whole kitchen is saved to a private per-person doc at
  `data/users/<id>/kitchen` (`js/cloud.js`). Browser storage is only a fast local cache.
- Keep the storage key `fridgemate:v1` (from the app's first name) so existing kitchens load.

## Files

| File | What it does |
| --- | --- |
| `index.html` | Shell: splash, header, views (home, fridge, kitchen list, scan, recipes, plan, shopping), dialogs, tab bar |
| `css/styles.css` | All styles. Palette tokens at the top; later sections override earlier ones (the "Sleek pass" and the solid-background block at the end win) |
| `js/app.js` | UI wiring for every tab, dialogs, saving, splash, name prompt, folding |
| `js/data/foods.js` | Food catalog: names, receipt aliases, category, default location, shelf life, `parent` (cheddar counts as cheese, cumin as spices) |
| `js/data/recipes.js` | 34 built-in recipes using catalog ingredient names (tests enforce this) |
| `js/data/guess.js` | Works out the category, storage and shelf life of foods not in the catalog from words in the name (kohlrabi is a vegetable, lamb shank is meat) |
| `js/data/meals.js` | Which meals each recipe suits (breakfast, lunch, dinner, snack); hand-picked for built-ins, Claude labels its ideas |
| `js/data/keywords.js` | Occasion keywords; hand-picked per recipe, selective (at most 3 per recipe); quick/vegetarian/vegan worked out |
| `js/normalize.js` | Free text and receipt shorthand to catalog foods (longest match wins) |
| `js/receipt.js`, `js/recipeImport.js` | Parse receipt text and pasted recipes |
| `js/recommend.js` | Rank recipes by what's on hand, expiring food, frozen items; cooking deductions |
| `js/frozen.js` | Freezer rules: "frozen" text goes to the freezer; freezer food needs defrosting unless it cooks from frozen |
| `js/nutrition.js` | Calorie estimates per serving from ingredients (optional extras skipped) |
| `js/family.js` | Family food preferences (allergic, hates, tolerates, loves) and what they mean for a recipe |
| `js/data/diets.js` | Common allergies (peanuts, tree nuts, dairy, eggs, gluten, shellfish, fish, soy, sesame) and diets (vegetarian, vegan, pescatarian, keto, low carb, gluten-free, dairy-free, halal, low salt, high salt) and which ingredients each rules out |
| `js/supply.js` | Grocery outlook: fresh food left, suggested shopping day and cheat day |
| `js/cooktime.js` | Time to cook today: time limits, quick prep and hands-off checks |
| `js/mealtimes.js` | Meal time windows: weekdays, weekends and single-day changes (`settings.mealTimes`); meal start times and the current meal |
| `js/plan.js` | Meal plan dates (weeks start Monday), totals, pruning |
| `js/fridge.js` | Fridge, pantry and spice rack drawing with foldable sections, sorted like grocery aisles (fridge: Dairy and eggs; Meat, fish and tofu; Other only when used; Vegetables and Fruit drawers; door split into Sauces and condiments, and Drinks (never combine sauces and drinks). Pantry: Pasta, rice and grains; Baking; Canned and jarred; Oils and sauces; Bread and bakery; Fruit and veg; Snacks and Drinks as separate shelves shown only when used) |
| `js/icons.js`, `js/mascot.js` | Flat food icons and the fridge assistant |
| `js/ai.js`, `js/ocr.js`, `js/cloud.js`, `js/store.js`, `js/units.js` | Claude calls, OCR loader, account sync, state and merge rules, unit conversion |

## Design system

- Palette (the whole app uses only these five plus tints of them): Rose Sorbet `#D96C81` (accent,
  buttons, logo), Sunflower Gold `#F4AF30`, Vanilla Cream `#F5E9CF` (solid page background), Rose
  Sorbet Light `#F0A9B6`, Rose Sorbet Dark `#9F4A5C` (all text). Cards are a lighter vanilla
  `#fbf5e8`. Dark mode: deep rose-brown `#3b1e26` (cards `#4a2631`) with Vanilla text. The owner
  dislikes navy and dull colours: never bring navy back. Food illustrations keep their own colours.
- Assistant ("Glow", `js/mascot.js`): a rose gradient fridge with its door ajar and gold light
  spilling out, closed happy eyes, no arms or legs. Modern, not childish. Motion is a slow glow
  breathe and door sway (no waving). Also used for the app icon. Inline copies in `index.html`
  are generated from `mascotSvg()`; each copy needs its own gradient id.
- Older token names are kept and remapped: `--coral`/`--pink`/`--raspberry`/`--accent` Rose Sorbet,
  `--olive`/`--sun` Sunflower Gold, `--lilac` Rose Light, `--accent-deep` Rose Dark.
- Meaning colours: breakfast Gold, lunch Rose Sorbet, dinner Rose Dark; fridge Rose Sorbet, freezer
  and frozen food Rose Dark on pale rose (with a snowflake), pantry Gold.
- Logo: name only, one solid colour (Rose Sorbet, `var(--coral)`), no mascot. "Inside my" in DM Serif
  Display sits up and right of a heavy Poppins 800 "Kitchen", with the slogan "let's make cooking fun
  again" in tracked Poppins 600 caps underneath (`.logomark`, `.lm-top`, `.lm-main`, `.lm-tag`).
  The splash shows the same logo inside the ring of food icons.
- Fonts (Google Fonts): DM Serif Display and Poppins for the logo, Funnel Sans for headings,
  Zalando Sans for body.
- Style: clean and sleek. Hairline borders (`--hair`), soft shadows, flat pill buttons and chips,
  frosted header and tab bar, generous spacing. Respect `prefers-reduced-motion`.
- Header: small centred logo on a see-through bar (no tint, soft blur only); settings on the right. Tapping the logo
  scrolls back to the top. No save-status dot (the owner asked for it gone).
- Tabs: Home, Fridge (Picture/List switch), Scan, Recipes, Plan, Family, Shopping.

## App behaviour to preserve

- Home greets the person by time of day and name ("Good morning, Lisa"; afternoon from 12,
  evening from 18; refreshes every minute) with a date badge and an assistant summary of today.
  The name is asked once after the splash and never again (skipping counts); editable in Settings.
- Recipes tab shows Claude's fresh ideas first; ideas refetch automatically when the set of
  ingredients changes.
- Recipes opens with "How much time do you have to cook today?" (15/30/45 min, 1 hour, No rush)
  plus optional Quick prep (at most 3 ingredients to handle, 3 steps) and Hands-off (oven, pot or
  fridge does the work). Logic in `js/cooktime.js`. The answer lasts for the day, folds into a
  one-line summary, filters the library and Claude's ideas, and is sent to Claude with the request.
- Family tab: each person has a name, food preferences, an "Eating today / Out today" switch and
  "Out on" days (`m.away`, ISO dates, past days pruned). Being out only counts for that day; the planner
  uses the slot's day. For people eating: a required ingredient someone hates or is allergic to hides the recipe (with a "Show them"
  option); an optional one becomes "Leave out the X for Y"; tolerated foods get "Keep the X small or on
  the side"; loved foods get a note. Disliking a group (cheese) covers its members (cheddar). Claude's
  ideas get the same rules in the request. Stored in synced `state.family`.
- Each person can have allergies and diets (`m.allergies`, `m.diets`) in a foldable "Allergies and diet"
  section. Allergies and avoid-diets hide recipes like "allergic" does, with the reason ("Andrey can't
  have the shrimp (shellfish allergy)"); low salt and high salt add advice notes instead. Sent to Claude.
- Recipes can be rated "We loved it" or "Not for us" (`state.recipeFeedback`, synced). Not-for-us
  recipes sink to the bottom, are never suggested on Home, and are mentioned to Claude.
- Between 11:30 pm and 5 am a cute sleep nudge (8 hours of solid sleep) shows under the greeting.
- Home always shows the groceries card: a suggested shopping day, and a cheat day line. When there's
  almost nothing to cook it suggests a cheat day (order in or eat out) with "Plan it" (and Undo once
  planned); otherwise it says "try to save some money by cooking at home".
- Every recipe shows "Suggested for" meal tags, with a meal filter row on Recipes. Home only suggests
  a recipe that suits the meal for the time of day (breakfast until 11, lunch until 4pm, then dinner);
  the planner lists recipes that suit the slot first. Never suggest a heavy dinner for breakfast.
- Planned meals can be removed from Home and Plan (x on each slot, or Remove in the slot picker),
  with an Undo toast. The Home date badge opens the planner.
- Shopping items added from a recipe or the week's plan show how much each recipe needs
  ("Need 2 for Banana Pancakes", stored as `item.needs`).
- Recipes page sections fold: Fresh ideas, Filters (shows how many are on) and From the recipe book.
- Every recipe can be edited (Edit in the recipe dialog): name, minutes, serves, meals, ingredients
  (amount, unit, name, optional) and steps. Imported recipes (pasted or photo) open straight in the
  editor as "Check your recipe". Editing a recipe-book recipe or an idea saves your version with the
  same id (`edited: true` for book recipes, which get "Restore original"); `allRecipes()` lets your
  version replace the book one.
- Recipe search sits at the top of Recipes. It searches everything (your recipes, the book and
  Claude's ideas) and ignores the other filters while typing; matching is forgiving (`searchText`:
  case, punctuation and plurals, so "wings" finds "chicken wing"). No results offers to ask Claude.
- The recipe editor keeps what you type (`typedName`): the catalog name only when the text means
  exactly that food, so "chicken wings" never becomes "chicken".
- Food is identified properly, never left as "Other" when it can be helped: about 190 catalog foods
  (each needs nutrition and ideally an icon), then `guessFood` for anything else, and `recategorize`
  fixes items saved as "other" on load. Foods in `VARIETY_GROUPS` keep the typed variety as
  `item.label` ("oat milk", "cod") while matching recipes as the group (plant milk, white fish).
- Seasonings live on a spice rack and count for recipes that just say "spices".
- Anything in the freezer must be defrosted before use. Reminders are timed: "Take out by 6 PM today"
  from the meal's start time (Settings, Meal times) minus how long the food takes to thaw
  (`defrostHours` in `js/frozen.js`: chicken 24h, shrimp 8h, bread 2h...). Each reminder has a tick:
  ticking moves the food to the fridge, unticking puts it back (`state.defrostLog`, synced).
- Days out are set in a calendar dialog (next five weeks); tap a day to mark it, tap again to undo.
- Calories are estimates; say so in the UI.
