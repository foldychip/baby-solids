/* =====================================================================
   Little Bites — data
   General, commonly-cited first-foods guidance (AAP-style, ~6 months).
   NOT medical advice. Confirm everything, especially allergens, with
   your pediatrician.

   Each food now carries:
     group    - a food group used for "try next" suggestions & pantry logic
     nutrients- key vitamins/minerals (plain-language, for filtering)
   All nutrition values are approximate, general nutrient highlights for
   education only — not exact label figures.
   ===================================================================== */

/* Nutrient keys used for filtering (label -> emoji) */
const NUTRIENTS = {
  "Iron":"🩸", "Vitamin A":"🥕", "Vitamin C":"🍊", "Vitamin D":"☀️",
  "Vitamin E":"🌰", "B vitamins":"🌾", "Calcium":"🦴", "Potassium":"🍌",
  "Zinc":"🛡️", "Fiber":"🌱", "Protein":"💪", "Healthy fats":"🥑",
  "Omega-3":"🐟", "Folate":"🥬"
};

/* ---------- Recommended first foods ---------- */
const FOODS = [
  {
    name:"Avocado", emoji:"🥑", allergen:false, stage:"Stage 1 (first foods)",
    group:"Healthy fats", groupEmoji:"🥑",
    cook:"No cooking needed.",
    temp:"Serve at room temperature.",
    texture:"Mash with a fork until smooth; thin with a little breast milk or formula if needed.",
    amount:"Start with 1–2 teaspoons, once a day. Build up as baby takes more.",
    tips:"Soft, mild, full of healthy fats. Pick one that gives slightly to gentle pressure.",
    nutrients:["Healthy fats","Vitamin E","Potassium","Fiber","Folate"]
  },
  {
    name:"Sweet potato", emoji:"🍠", allergen:false, stage:"Stage 1 (first foods)",
    group:"Orange veg", groupEmoji:"🍠",
    cook:"Peel, cube, and steam or boil 15–20 min until very soft. Or bake at 400°F (205°C) ~45 min until soft.",
    temp:"Cool to lukewarm (test on your wrist — should feel barely warm).",
    texture:"Mash or purée smooth; add water/milk to loosen.",
    amount:"1–2 teaspoons to start, once a day.",
    tips:"Naturally sweet, usually a baby favorite. Make a batch and freeze in ice-cube trays.",
    nutrients:["Vitamin A","Vitamin C","Fiber","Potassium"]
  },
  {
    name:"Banana", emoji:"🍌", allergen:false, stage:"Stage 1 (first foods)",
    group:"Soft fruit", groupEmoji:"🍌",
    cook:"No cooking needed.",
    temp:"Room temperature.",
    texture:"Mash very ripe banana with a fork until smooth.",
    amount:"1–2 teaspoons to start.",
    tips:"Use a ripe (spotty) banana so it mashes smooth. Can firm up stools.",
    nutrients:["Potassium","Vitamin C","B vitamins","Fiber"]
  },
  {
    name:"Butternut squash", emoji:"🎃", allergen:false, stage:"Stage 1 (first foods)",
    group:"Orange veg", groupEmoji:"🍠",
    cook:"Peel, cube, steam/boil 15–20 min until very soft, or roast at 400°F (205°C) ~30 min.",
    temp:"Serve lukewarm.",
    texture:"Purée smooth.",
    amount:"1–2 teaspoons to start.",
    tips:"Mild and sweet. Freezes well in cubes.",
    nutrients:["Vitamin A","Vitamin C","Potassium","Fiber"]
  },
  {
    name:"Carrot", emoji:"🥕", allergen:false, stage:"Stage 1 (first foods)",
    group:"Orange veg", groupEmoji:"🍠",
    cook:"Peel, slice, steam/boil 15–20 min until fork-tender.",
    temp:"Serve lukewarm.",
    texture:"Purée smooth (carrots need a thorough blend).",
    amount:"1–2 teaspoons to start.",
    tips:"Use fresh carrots for first foods; purée very smooth as they can stay fibrous.",
    nutrients:["Vitamin A","Fiber","Potassium"]
  },
  {
    name:"Apple", emoji:"🍎", allergen:false, stage:"Stage 1 (first foods)",
    group:"Soft fruit", groupEmoji:"🍌",
    cook:"Peel, core, cube; steam or simmer 10–15 min until soft.",
    temp:"Serve lukewarm.",
    texture:"Purée smooth (unsweetened — no added sugar).",
    amount:"1–2 teaspoons to start.",
    tips:"Basically homemade unsweetened applesauce. Can loosen stools.",
    nutrients:["Vitamin C","Fiber"]
  },
  {
    name:"Pear", emoji:"🍐", allergen:false, stage:"Stage 1 (first foods)",
    group:"Soft fruit", groupEmoji:"🍌",
    cook:"Ripe pear needs no cooking; firmer pear: steam 5–10 min.",
    temp:"Room temp or lukewarm.",
    texture:"Mash or purée smooth.",
    amount:"1–2 teaspoons to start.",
    tips:"Gentle and sweet; often well tolerated early.",
    nutrients:["Vitamin C","Fiber","Potassium"]
  },
  {
    name:"Oatmeal (iron-fortified)", emoji:"🥣", allergen:false, stage:"Stage 1 (first foods)",
    group:"Grains", groupEmoji:"🌾",
    cook:"Mix iron-fortified baby oat cereal with warm breast milk, formula, or water per package.",
    temp:"Serve lukewarm.",
    texture:"Thin and runny at first; thicken over time.",
    amount:"Start with a few teaspoons.",
    tips:"Iron matters a lot at 6 months — iron-fortified cereals are a common first food.",
    nutrients:["Iron","B vitamins","Fiber","Zinc"]
  },
  {
    name:"Green peas", emoji:"🫛", allergen:false, stage:"Stage 1–2",
    group:"Green veg", groupEmoji:"🥬",
    cook:"Steam/boil 5–8 min until very soft.",
    temp:"Serve lukewarm.",
    texture:"Purée smooth and push through a sieve to remove skins.",
    amount:"1–2 teaspoons to start.",
    tips:"Press through a strainer so there are no tough skins.",
    nutrients:["Vitamin C","Folate","Fiber","Protein","Vitamin A"]
  },
  {
    name:"Chicken (well-cooked)", emoji:"🍗", allergen:false, stage:"Stage 2 (protein / iron)",
    group:"Meat / protein", groupEmoji:"🍗",
    cook:"Cook thoroughly to an internal temp of 165°F (74°C). Then purée.",
    temp:"Cool to lukewarm before serving.",
    texture:"Purée smooth with broth or water; or finely shred for older babies.",
    amount:"1–2 teaspoons to start.",
    tips:"Good iron source. Blend with a familiar veggie if the texture is new.",
    nutrients:["Protein","Iron","Zinc","B vitamins"]
  },
  {
    name:"Lentils (soft)", emoji:"🫘", allergen:false, stage:"Stage 2 (protein / iron)",
    group:"Meat / protein", groupEmoji:"🍗",
    cook:"Rinse red/green lentils, simmer 20–25 min until very soft and falling apart.",
    temp:"Serve lukewarm.",
    texture:"Mash or purée smooth; thin with water or broth.",
    amount:"1–2 teaspoons to start.",
    tips:"Plant protein + iron, very soft when cooked. A legume — low cross-reactivity with peanut (<5%).",
    nutrients:["Protein","Iron","Folate","Fiber","Zinc"]
  },
  {
    name:"Chickpea / hummus", emoji:"🧆", allergen:false, stage:"Stage 2 (protein / iron)",
    group:"Meat / protein", groupEmoji:"🍗",
    cook:"Soft-cook or use canned (no-salt) chickpeas; blend with water. Hummus also contains tahini (sesame).",
    temp:"Serve at room temp or lukewarm.",
    texture:"Purée very smooth; whole chickpeas are a choking risk.",
    amount:"1–2 teaspoons to start.",
    tips:"Legume, low peanut cross-reactivity. If using hummus, remember it introduces sesame too — watch that separately.",
    nutrients:["Protein","Iron","Folate","Fiber"]
  },
  {
    name:"Turkey (puréed)", emoji:"🦃", allergen:false, stage:"Stage 2 (protein / iron)",
    group:"Meat / protein", groupEmoji:"🍗",
    cook:"Cook thoroughly to an internal temp of 165°F (74°C). Then purée.",
    temp:"Cool to lukewarm.",
    texture:"Purée smooth with broth or water.",
    amount:"1–2 teaspoons to start.",
    tips:"Lean poultry like chicken — good iron, mild flavor.",
    nutrients:["Protein","Iron","Zinc","B vitamins"]
  },
  {
    name:"Beef (puréed)", emoji:"🥩", allergen:false, stage:"Stage 2 (protein / iron)",
    group:"Meat / protein", groupEmoji:"🍗",
    cook:"Cook thoroughly (well-done, no pink) to 160°F (71°C). Then purée.",
    temp:"Cool to lukewarm.",
    texture:"Purée very smooth with broth or a familiar veggie.",
    amount:"1–2 teaspoons to start.",
    tips:"Rich in iron & zinc for growing babies. Only ~10% of milk-allergic babies react to beef.",
    nutrients:["Iron","Zinc","Protein","B vitamins"]
  },
  {
    name:"Spinach (cooked)", emoji:"🥬", allergen:false, stage:"Stage 1–2",
    group:"Green veg", groupEmoji:"🥬",
    cook:"Steam or boil until wilted and soft, 3–5 min.",
    temp:"Serve lukewarm.",
    texture:"Purée smooth; blend well as leaves can be stringy.",
    amount:"1–2 teaspoons to start, mixed with a mild veg.",
    tips:"Iron + folate. Serve freshly cooked (don't reheat spinach repeatedly).",
    nutrients:["Iron","Folate","Vitamin A","Vitamin C"]
  },
  {
    name:"Green beans", emoji:"🫛", allergen:false, stage:"Stage 1–2",
    group:"Green veg", groupEmoji:"🥬",
    cook:"Steam/boil 10–15 min until very soft.",
    temp:"Serve lukewarm.",
    texture:"Purée smooth; sieve to remove any strings.",
    amount:"1–2 teaspoons to start.",
    tips:"Mild green veg, variety pick like peas.",
    nutrients:["Vitamin C","Vitamin A","Fiber","Folate"]
  },
  {
    name:"Zucchini", emoji:"🥒", allergen:false, stage:"Stage 1 (first foods)",
    group:"Green veg", groupEmoji:"🥬",
    cook:"Steam 5–8 min until soft (peel for youngest babies).",
    temp:"Serve lukewarm.",
    texture:"Mash or purée smooth.",
    amount:"1–2 teaspoons to start.",
    tips:"Soft, mild, cooks fast — an easy early green.",
    nutrients:["Vitamin C","Potassium","Fiber"]
  },
  {
    name:"Pumpkin", emoji:"🎃", allergen:false, stage:"Stage 1 (first foods)",
    group:"Orange veg", groupEmoji:"🍠",
    cook:"Steam/boil cubes 15–20 min, or roast at 400°F (205°C) ~30 min until soft.",
    temp:"Serve lukewarm.",
    texture:"Purée smooth.",
    amount:"1–2 teaspoons to start.",
    tips:"Sweet and vitamin-A rich like sweet potato & squash. Use plain pumpkin, not pie filling.",
    nutrients:["Vitamin A","Vitamin C","Fiber","Potassium"]
  },
  {
    name:"Mango", emoji:"🥭", allergen:false, stage:"Stage 1 (first foods)",
    group:"Orange veg", groupEmoji:"🍠",
    cook:"No cooking needed if ripe.",
    temp:"Room temperature.",
    texture:"Mash or purée very ripe mango smooth.",
    amount:"1–2 teaspoons to start.",
    tips:"Sweet, soft, vitamin-A/C rich. Use a soft, ripe mango.",
    nutrients:["Vitamin A","Vitamin C","Folate","Fiber"]
  },
  {
    name:"Peach (ripe/steamed)", emoji:"🍑", allergen:false, stage:"Stage 1 (first foods)",
    group:"Soft fruit", groupEmoji:"🍌",
    cook:"Ripe peach needs no cooking; firmer: steam 5 min. Peel first.",
    temp:"Room temp or lukewarm.",
    texture:"Mash or purée smooth.",
    amount:"1–2 teaspoons to start.",
    tips:"Soft, sweet. A Rosaceae fruit (apple, pear, cherry, plum family) — these share ~50% cross-reactivity, so offer one at a time.",
    nutrients:["Vitamin C","Vitamin A","Fiber"]
  },
  {
    name:"Rice cereal (iron-fortified)", emoji:"🍚", allergen:false, stage:"Stage 1 (first foods)",
    group:"Grains", groupEmoji:"🌾",
    cook:"Mix iron-fortified baby rice cereal with warm breast milk, formula, or water per package.",
    temp:"Serve lukewarm.",
    texture:"Thin and runny at first; thicken over time.",
    amount:"Start with a few teaspoons.",
    tips:"Rarely cross-reacts with wheat (<5%). Vary with oats so it's not the only grain.",
    nutrients:["Iron","B vitamins","Zinc"]
  }
];

/* ---------- Allergen introduction schedule ----------
   Common guidance: introduce ONE allergen at a time, early (around 6
   months, once a few first foods are tolerated), in the MORNING, on a day
   you can watch baby for several hours. Wait ~3–5 days before the next NEW
   allergen so a reaction can be traced to one food. Once tolerated, keep
   offering it regularly (a few times a week) to maintain tolerance.
   ORDER AND TIMING ARE A STARTING POINT — your pediatrician may change them. */
const ALLERGENS = [
  { name:"Peanut", emoji:"🥜", week:1, group:"Peanut", groupEmoji:"🥜",
    how:"Smooth peanut butter thinned with warm water/breast milk/formula to a loose purée, OR a peanut puff dissolved. NEVER whole peanuts or thick globs (choking).",
    amount:"Start tiny: about 1/4 teaspoon of thinned peanut butter. If no reaction after ~10 min, offer a bit more.",
    watch:"Watch 2+ hours. Keep offering 2–3x/week once tolerated.",
    note:"Early peanut introduction is specifically recommended by many guidelines. If baby has severe eczema or egg allergy, ASK YOUR DOCTOR FIRST — some babies need allergy testing before peanut.",
    nutrients:["Protein","Healthy fats","Vitamin E","B vitamins"] },
  { name:"Egg", emoji:"🥚", week:2, group:"Egg", groupEmoji:"🥚",
    how:"Fully cooked egg — hard-boiled yolk+white mashed, or well-cooked scrambled, no runny parts.",
    amount:"Start with ~1/4 teaspoon of cooked egg, increase gradually.",
    watch:"Watch 2+ hours. Keep in rotation once tolerated.",
    note:"Must be fully cooked. Introduce whole egg (yolk + white).",
    nutrients:["Protein","Vitamin D","B vitamins","Iron","Healthy fats"] },
  { name:"Dairy (yogurt/cheese)", emoji:"🧀", week:3, group:"Dairy", groupEmoji:"🧀",
    how:"Plain whole-milk yogurt or a little soft cheese. (Plain cow's MILK as a drink waits until 12 months — but yogurt/cheese are fine as foods earlier.)",
    amount:"Start with ~1 teaspoon plain whole-milk yogurt.",
    watch:"Watch 2+ hours.",
    note:"No added sugar. Whole-milk (full-fat) dairy for babies.",
    nutrients:["Calcium","Protein","Vitamin D","B vitamins"] },
  { name:"Wheat", emoji:"🌾", week:4, group:"Grains", groupEmoji:"🌾",
    how:"Iron-fortified wheat baby cereal, or a small amount of soft bread/pasta purée.",
    amount:"Start with a few teaspoons of thinned wheat cereal.",
    watch:"Watch 2+ hours.",
    note:"Often introduced via cereal so it's easy to control amount.",
    nutrients:["B vitamins","Iron","Fiber"] },
  { name:"Soy", emoji:"🫘", week:5, group:"Soy", groupEmoji:"🫘",
    how:"Plain soft tofu mashed, or plain soy yogurt.",
    amount:"Start with ~1 teaspoon mashed silken/soft tofu.",
    watch:"Watch 2+ hours.",
    note:"Soft/silken tofu mashes to a smooth texture.",
    nutrients:["Protein","Calcium","Iron","Folate"] },
  { name:"Tree nuts", emoji:"🌰", week:6, group:"Tree nuts", groupEmoji:"🌰",
    how:"Smooth almond or cashew butter thinned to a loose purée. NEVER whole nuts (choking).",
    amount:"Start with ~1/4 teaspoon thinned nut butter.",
    watch:"Watch 2+ hours. Introduce one tree nut at a time if your doctor advises.",
    note:"Thin thoroughly. Whole nuts are a choking hazard until ~4 years.",
    nutrients:["Healthy fats","Vitamin E","Protein","Calcium"] },
  { name:"Fish", emoji:"🐟", week:7, group:"Fish", groupEmoji:"🐟",
    how:"Well-cooked, flaked, boneless mild fish (e.g. salmon, cod) to 145°F (63°C). Purée smooth.",
    amount:"Start with ~1 teaspoon puréed cooked fish.",
    watch:"Watch 2+ hours.",
    note:"Check carefully for bones. Choose low-mercury fish.",
    nutrients:["Omega-3","Protein","Vitamin D","B vitamins"] },
  { name:"Shellfish", emoji:"🦐", week:8, group:"Shellfish", groupEmoji:"🦐",
    how:"Well-cooked shellfish (e.g. shrimp), finely puréed. Cook thoroughly.",
    amount:"Start with ~1/4–1/2 teaspoon.",
    watch:"Watch 2+ hours.",
    note:"Shellfish allergy can be significant — introduce carefully and ask your doctor, especially with family history.",
    nutrients:["Protein","Zinc","Omega-3","B vitamins"] },
  { name:"Sesame", emoji:"🌱", week:9, group:"Sesame", groupEmoji:"🌱",
    how:"Tahini (sesame paste) thinned with water to a loose purée, or hummus (which contains tahini).",
    amount:"Start with ~1/4 teaspoon thinned tahini.",
    watch:"Watch 2+ hours.",
    note:"Sesame is now recognized as a major allergen.",
    nutrients:["Calcium","Healthy fats","Protein","Iron"] }
];

/* ---------- "Try next" suggestions by food group ----------
   Cross-reactivity-informed. Once a food is TOLERATED, related foods fall
   into two kinds:
     tier "ok"   🟢 low cross-reactivity — reassuring to try next
     tier "care" 🟡 high cross-reactivity — introduce one at a time; tolerating
                    one does NOT predict the others
   Rates are clinical cross-reactivity figures (how often someone ALLERGIC to
   the first food also reacts to the second) from Francis et al., "Common food
   allergens and cross-reactivity", J Food Allergy 2020 (funded by FARE). The
   percentages are factual from that review; which foods to surface is our
   editorial choice. STILL confirm introductions with your pediatrician.
   SRC = short citation shown in-app. */
const SUGG_SRC = "Francis et al., J Food Allergy 2020";
const GROUP_SUGGESTIONS = {
  /* --- Non-allergen groups: variety suggestions, labeled as such --- */
  "Orange veg":   [ {name:"Pumpkin", tier:"ok", why:"Sweet vitamin-A veg like sweet potato & squash — a variety pick, not an allergy group."},
                    {name:"Mango", tier:"ok", why:"Sweet vitamin-A/C fruit — variety pick."} ],
  "Soft fruit":   [ {name:"Peach (ripe/steamed)", tier:"care", why:"Rosaceae fruit — ~50% cross-reactivity among this family (apple, pear, cherry, plum). Usually mild, but offer on its own."},
                    {name:"Plum (steamed)", tier:"care", why:"Also Rosaceae (~50% within family). Gentle; introduce singly."} ],
  "Green veg":    [ {name:"Green beans", tier:"ok", why:"Mild green veg — variety pick like peas."},
                    {name:"Zucchini", tier:"ok", why:"Soft, mild, steams quickly — variety pick."},
                    {name:"Spinach (cooked)", tier:"ok", why:"Iron + folate — variety pick."} ],
  "Meat / protein":[ {name:"Turkey (puréed)", tier:"ok", why:"Lean poultry like chicken — variety pick, good iron."},
                    {name:"Beef (puréed)", tier:"care", why:"Only ~10% of milk-allergic kids react to beef — but if dairy isn't tolerated yet, offer beef on its own."},
                    {name:"Lentils (soft)", tier:"ok", why:"If peanut is tolerated, legumes like lentils are low-risk (<5% cross-react with peanut). Lentil↔chickpea/pea is high though — introduce those singly."} ],

  /* --- Allergen groups: cross-reactivity-based --- */
  "Peanut":       [ {name:"Soy (tofu)", tier:"ok", why:"Legume like peanut, but only <5% cross-react — reassuring. ("+SUGG_SRC+")"},
                    {name:"Lentils (soft)", tier:"ok", why:"Other legumes cross-react with peanut only ~5% — low risk. ("+SUGG_SRC+")"},
                    {name:"Chickpea / hummus", tier:"ok", why:"Legume; low peanut cross-reactivity. (Hummus also brings in sesame — watch that separately.)"},
                    {name:"Tree nuts (thinned butter)", tier:"care", why:"20–60% of peanut-allergic kids also react to a tree nut — introduce each tree nut on its own, carefully. ("+SUGG_SRC+")"} ],
  "Soy":          [ {name:"Peanut (thinned)", tier:"ok", why:"Legume like soy; peanut↔soy clinical cross-reactivity is <5%. Still a top allergen — go slow. ("+SUGG_SRC+")"},
                    {name:"Lentils (soft)", tier:"ok", why:"Another legume; low cross-reactivity with soy."} ],
  "Dairy":        [ {name:"Cheese (soft)", tier:"ok", why:"Same cow's-milk source as yogurt — if yogurt is tolerated, soft cheese is a reasonable next dairy."},
                    {name:"Baked/heated milk (in muffins)", tier:"ok", why:"~75% of milk-allergic kids tolerate baked milk — but that's for allergic kids; for a tolerant baby it's simply another form. ("+SUGG_SRC+")"},
                    {name:"Goat / sheep milk products", tier:"care", why:"⚠ >90% cross-reactive with cow's milk — NOT a safe swap if cow's milk ever causes trouble. ("+SUGG_SRC+")"} ],
  "Egg":          [ {name:"Egg in baked goods", tier:"ok", why:"Keeps egg in the diet; ~70% of egg-allergic kids tolerate baked egg. Other bird eggs rarely cross-react. ("+SUGG_SRC+")"} ],
  "Grains":       [ {name:"Rice cereal (iron-fortified)", tier:"ok", why:"If wheat is tolerated, rice almost never cross-reacts (<5%) — reassuring. ("+SUGG_SRC+")"},
                    {name:"Oatmeal (iron-fortified)", tier:"ok", why:"Oats rarely cross-react with wheat (<5%) — low risk. ("+SUGG_SRC+")"},
                    {name:"Corn (soft polenta)", tier:"ok", why:"Corn <5% cross-reactivity with wheat — reassuring."},
                    {name:"Barley / rye cereal", tier:"care", why:"~20% cross-reactivity with wheat (one study: 55% reacted to barley) — introduce on its own. ("+SUGG_SRC+")"} ],
  "Fish":         [ {name:"A second finned fish (e.g. cod)", tier:"care", why:"~50% of fish-allergic kids react to another fish — tolerating salmon does NOT clear cod. Introduce each fish singly. ("+SUGG_SRC+")"},
                    {name:"Shellfish (shrimp, later)", tier:"ok", why:"Fish and shellfish do NOT cross-react — a separate allergen to introduce on its own schedule. ("+SUGG_SRC+")"} ],
  "Shellfish":    [ {name:"A second crustacean (e.g. crab)", tier:"care", why:"~50% cross-reactivity within crustaceans — tolerating shrimp does NOT clear crab/lobster. Introduce singly. ("+SUGG_SRC+")"},
                    {name:"Finned fish", tier:"ok", why:"Shellfish and fish do NOT cross-react — separate allergen, introduce on its own. ("+SUGG_SRC+")"} ],
  "Tree nuts":    [ {name:"A different single tree nut", tier:"care", why:"⚠ Very high within tree nuts (cashew↔pistachio & walnut↔pecan 75–100%). Tolerating one does NOT clear another — introduce each tree nut separately. ("+SUGG_SRC+")"},
                    {name:"Peanut (thinned)", tier:"care", why:"20–60% cross-reactivity between tree nuts and peanut — introduce carefully if not already tolerated. ("+SUGG_SRC+")"} ],
  "Sesame":       [ {name:"Hummus", tier:"ok", why:"Contains tahini — keeps sesame in rotation, plus chickpea (legume). Introduce the chickpea part mindful it's new too."} ],
  "Healthy fats": [ {name:"Nut/seed butters (thinned)", tier:"care", why:"These ARE allergens (tree nut / sesame) — treat as careful single introductions, not just 'more healthy fats'."} ]
};

/* ---------- Signs of a reaction (shown in-app) ---------- */
const REACTION_SIGNS = [
  "Hives, redness, or a rash (especially spreading)",
  "Swelling of lips, face, tongue, or eyes",
  "Vomiting or lots of drooling/gagging after the food",
  "Coughing, wheezing, or trouble breathing",
  "Sudden sleepiness, floppiness, or pale skin"
];
const EMERGENCY_TEXT = "Trouble breathing, swelling of the face/tongue, or sudden floppiness/paleness can be a severe allergic reaction (anaphylaxis) — call emergency services (911) right away. For milder signs, stop the food and call your pediatrician.";

/* ---------- helpers over the data ---------- */
function allItems(){
  // unified list of foods + allergens with a common shape
  return FOODS.map(f=>({ ...f, isAllergen:false }))
    .concat(ALLERGENS.map(a=>({ ...a, isAllergen:true, stage:"Allergen (step "+a.week+")" })));
}
function itemByName(name){
  return allItems().find(i=>i.name.toLowerCase()===String(name||"").toLowerCase()) || null;
}

/* ---------- Per-food 3-day watch template (used inside a week) ---------- */
function makeIntroDays(label){
  return [
    { day:1, items:[
      {id:"d1-morning", text:`Offer ${label} in the morning (small amount)`},
      {id:"d1-watch",   text:`Watch for 2+ hours after offering`},
      {id:"d1-note",    text:`Note how it went / any reaction`}
    ]},
    { day:2, items:[
      {id:"d2-offer", text:`Offer ${label} again (slightly more if Day 1 was fine)`},
      {id:"d2-watch", text:`Watch for reaction`},
      {id:"d2-note",  text:`Note how it went`}
    ]},
    { day:3, items:[
      {id:"d3-offer", text:`Offer ${label} once more to confirm it's well tolerated`},
      {id:"d3-watch", text:`Watch for reaction`},
      {id:"d3-done",  text:`Mark ${label} as introduced ✅ (keep offering regularly)`}
    ]}
  ];
}
