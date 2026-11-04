# FridgeForMe

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
| `js/data/keywords.js` | Occasion keywords; hand-picked per recipe, selective (at most 3 per recipe); quick/vegetarian/vegan worked out |
| `js/normalize.js` | Free text and receipt shorthand to catalog foods (longest match wins) |
| `js/receipt.js`, `js/recipeImport.js` | Parse receipt text and pasted recipes |
| `js/recommend.js` | Rank recipes by what's on hand, expiring food, frozen items; cooking deductions |
| `js/frozen.js` | Freezer rules: "frozen" text goes to the freezer; freezer food needs defrosting unless it cooks from frozen |
| `js/nutrition.js` | Calorie estimates per serving from ingredients (optional extras skipped) |
| `js/plan.js` | Meal plan dates (weeks start Monday), totals, pruning |
| `js/fridge.js` | Fridge, pantry and spice rack drawing with foldable sections |
| `js/icons.js`, `js/mascot.js` | Flat food icons and the fridge assistant |
| `js/ai.js`, `js/ocr.js`, `js/cloud.js`, `js/store.js`, `js/units.js` | Claude calls, OCR loader, account sync, state and merge rules, unit conversion |

## Design system

- Palette: Tangerine `#F08C21` (accent), Butter `#F2D88F` (solid page background), Blush `#E36888`,
  Sea `#6698CC`, Matcha `#B4B534`. Text is deep navy `#24405f` (darkened Sea) for readability; cards
  are light Butter cream `#fff7e2`. Dark mode: navy `#1d2a3d` with Butter text.
- Older token names are kept and remapped: `--olive` Matcha, `--raspberry`/`--pink` Blush,
  `--lilac` Sea, `--coral` Tangerine, `--sun` deeper Butter.
- Meaning colours: missing ingredients and dinner Blush, frozen food Sea blue, fridge and freezer
  Sea, pantry Matcha, breakfast deeper Butter, lunch Tangerine.
- Fonts (Google Fonts): Climate Crisis for the FridgeForMe wordmark (its YEAR axis melts and
  freezes in the splash), Funnel Sans for headings, Zalando Sans for body, Chewy for the tagline
  "fresh from your fridge".
- Style: clean and sleek. Hairline borders (`--hair`), soft shadows, flat pill buttons and chips,
  frosted header and tab bar, generous spacing. Respect `prefers-reduced-motion`.
- Header: small centred logo with the assistant; settings on the right; save status on the left
  (a dot on phones).
- Tabs: Home, Fridge (Picture/List switch), Scan, Recipes, Plan, Shopping.

## App behaviour to preserve

- Home greets the person by name ("Hi, Lisa") with a date badge and an assistant summary of today.
  The name is asked once after the splash and never again (skipping counts); editable in Settings.
- Recipes tab shows Claude's fresh ideas first; ideas refetch automatically when the set of
  ingredients changes.
- Seasonings live on a spice rack and count for recipes that just say "spices".
- Anything in the freezer must be defrosted before use; recipes and the plan remind you.
- Calories are estimates; say so in the UI.
