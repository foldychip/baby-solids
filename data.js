/* =====================================================================
   Little Bites — data
   General, commonly-cited first-foods guidance (AAP-style). NOT medical
   advice. Confirm everything — especially allergen timing and when to move
   to finger foods / strips — with your pediatrician.

   Each food carries:
     group     - food group (for "try next" + pantry logic)
     ageBand   - one of AGE_BANDS keys (for the age filter)
     ageText   - plain-language "generally introduced around ..."
     nutrients - key vitamins/minerals (for the nutrition filter)
   Age guidance is GENERAL and about readiness/texture, not a hard rule —
   babies vary and your pediatrician's advice wins.
   ===================================================================== */

/* Age bands used for filtering */
const AGE_BANDS = {
  "6m":   "~6 months (first foods)",
  "6-9m": "~6–9 months",
  "9-12m":"~9–12 months",
  "12m+": "12 months and up"
};

/* Nutrient keys (label -> emoji) */
const NUTRIENTS = {
  "Iron":"🩸", "Vitamin A":"🥕", "Vitamin C":"🍊", "Vitamin D":"☀️",
  "Vitamin E":"🌰", "B vitamins":"🌾", "Calcium":"🦴", "Potassium":"🍌",
  "Zinc":"🛡️", "Fiber":"🌱", "Protein":"💪", "Healthy fats":"🥑",
  "Omega-3":"🐟", "Folate":"🥬", "Antioxidants":"🫐"
};

/* ---------- Recommended foods ---------- */
const FOODS = [
  { name:"Avocado", emoji:"🥑", group:"Healthy fats", groupEmoji:"🥑",
    ageBand:"6m", ageText:"From ~6 months (one of the easiest first foods).",
    cook:"No cooking needed.", temp:"Room temperature.",
    texture:"Mash smooth; thin with breast milk/formula. For 9m+ offer ripe spears to self-feed.",
    amount:"1–2 teaspoons to start, building up.",
    tips:"Soft, mild, healthy fats. Pick one that yields to gentle pressure.",
    nutrients:["Healthy fats","Vitamin E","Potassium","Fiber","Folate"] },

  { name:"Sweet potato", emoji:"🍠", group:"Orange veg", groupEmoji:"🍠",
    ageBand:"6m", ageText:"From ~6 months.",
    cook:"Peel, cube, steam/boil 15–20 min until very soft, or bake 400°F (205°C) ~45 min.",
    temp:"Cool to lukewarm (test on your wrist).",
    texture:"Mash/purée smooth. For 9m+ offer soft roasted wedges as a finger food.",
    amount:"1–2 teaspoons to start.",
    tips:"Naturally sweet. Freezes well in cubes.",
    nutrients:["Vitamin A","Vitamin C","Fiber","Potassium"] },

  { name:"Banana", emoji:"🍌", group:"Soft fruit", groupEmoji:"🍌",
    ageBand:"6m", ageText:"From ~6 months.",
    cook:"No cooking needed.", temp:"Room temperature.",
    texture:"Mash very ripe banana smooth. For 9m+ offer a whole peeled banana or thick spears.",
    amount:"1–2 teaspoons to start.",
    tips:"Use a ripe (spotty) banana. Can firm up stools.",
    nutrients:["Potassium","Vitamin C","B vitamins","Fiber"] },

  { name:"Butternut squash", emoji:"🎃", group:"Orange veg", groupEmoji:"🍠",
    ageBand:"6m", ageText:"From ~6 months.",
    cook:"Peel, cube, steam/boil 15–20 min, or roast 400°F (205°C) ~30 min.",
    temp:"Serve lukewarm.",
    texture:"Purée smooth. For 9m+ soft roasted pieces to self-feed.",
    amount:"1–2 teaspoons to start.", tips:"Mild and sweet. Freezes well.",
    nutrients:["Vitamin A","Vitamin C","Potassium","Fiber"] },

  { name:"Carrot", emoji:"🥕", group:"Orange veg", groupEmoji:"🍠",
    ageBand:"6m", ageText:"From ~6 months (cooked soft). Raw sticks are a choking risk — wait until much older.",
    cook:"Peel, slice, steam/boil 15–20 min until fork-tender.",
    temp:"Serve lukewarm.",
    texture:"Purée smooth. For 9m+ offer very soft cooked batons — never raw/crunchy.",
    amount:"1–2 teaspoons to start.",
    tips:"Cook until mushy; raw carrot is a choking hazard for babies.",
    nutrients:["Vitamin A","Fiber","Potassium"], choke:true },

  { name:"Apple", emoji:"🍎", group:"Soft fruit", groupEmoji:"🍌",
    ageBand:"6m", ageText:"From ~6 months (cooked). Raw apple is a choking risk — grate or cook until older.",
    cook:"Peel, core, cube; steam/simmer 10–15 min until soft.",
    temp:"Serve lukewarm.",
    texture:"Purée smooth (unsweetened). For 9m+ grated raw apple or soft-cooked pieces.",
    amount:"1–2 teaspoons to start.",
    tips:"Homemade unsweetened applesauce. Hard raw apple chunks are a choking hazard.",
    nutrients:["Vitamin C","Fiber"], choke:true },

  { name:"Pear", emoji:"🍐", group:"Soft fruit", groupEmoji:"🍌",
    ageBand:"6m", ageText:"From ~6 months.",
    cook:"Ripe pear raw; firmer pear steam 5–10 min.",
    temp:"Room temp or lukewarm.",
    texture:"Mash/purée smooth. For 9m+ ripe soft spears.",
    amount:"1–2 teaspoons to start.", tips:"Gentle and sweet; well tolerated early.",
    nutrients:["Vitamin C","Fiber","Potassium"] },

  { name:"Oatmeal (iron-fortified)", emoji:"🥣", group:"Grains", groupEmoji:"🌾",
    ageBand:"6m", ageText:"From ~6 months — a common iron-rich first food.",
    cook:"Mix iron-fortified baby oat cereal with warm breast milk/formula/water.",
    temp:"Serve lukewarm.",
    texture:"Thin at first; thicken over time.",
    amount:"Start with a few teaspoons.",
    tips:"Iron matters a lot at 6 months.",
    nutrients:["Iron","B vitamins","Fiber","Zinc"] },

  { name:"Rice cereal (iron-fortified)", emoji:"🍚", group:"Grains", groupEmoji:"🌾",
    ageBand:"6m", ageText:"From ~6 months.",
    cook:"Mix iron-fortified baby rice cereal with warm breast milk/formula/water.",
    temp:"Serve lukewarm.", texture:"Thin at first; thicken over time.",
    amount:"Start with a few teaspoons.",
    tips:"Rarely cross-reacts with wheat (<5%). Vary with oats so it isn't the only grain.",
    nutrients:["Iron","B vitamins","Zinc"] },

  { name:"Green peas", emoji:"🫛", group:"Green veg", groupEmoji:"🥬",
    ageBand:"6m", ageText:"From ~6 months.",
    cook:"Steam/boil 5–8 min until very soft.",
    temp:"Serve lukewarm.",
    texture:"Purée smooth and sieve to remove skins. For 9m+ offer whole soft peas (lightly smashed).",
    amount:"1–2 teaspoons to start.", tips:"Strain out tough skins for purée.",
    nutrients:["Vitamin C","Folate","Fiber","Protein","Vitamin A"] },

  { name:"Green beans", emoji:"🫛", group:"Green veg", groupEmoji:"🥬",
    ageBand:"6-9m", ageText:"From ~6–9 months (steamed very soft).",
    cook:"Steam/boil 10–15 min until very soft.",
    temp:"Serve lukewarm.", texture:"Purée smooth; sieve strings. For 9m+ soft whole beans to self-feed.",
    amount:"1–2 teaspoons to start.", tips:"Mild green veg, variety pick like peas.",
    nutrients:["Vitamin C","Vitamin A","Fiber","Folate"] },

  { name:"Zucchini", emoji:"🥒", group:"Green veg", groupEmoji:"🥬",
    ageBand:"6m", ageText:"From ~6 months.",
    cook:"Steam 5–8 min until soft (peel for youngest).",
    temp:"Serve lukewarm.", texture:"Mash/purée smooth. For 9m+ soft cooked batons.",
    amount:"1–2 teaspoons to start.", tips:"Soft, mild, cooks fast.",
    nutrients:["Vitamin C","Potassium","Fiber"] },

  { name:"Spinach (cooked)", emoji:"🥬", group:"Green veg", groupEmoji:"🥬",
    ageBand:"6-9m", ageText:"From ~6–9 months, cooked and well blended.",
    cook:"Steam/boil until wilted and soft, 3–5 min.",
    temp:"Serve lukewarm.", texture:"Purée smooth; blend well (leaves can be stringy).",
    amount:"1–2 teaspoons mixed with a mild veg.",
    tips:"Iron + folate. Serve freshly cooked; don't reheat repeatedly.",
    nutrients:["Iron","Folate","Vitamin A","Vitamin C"] },

  { name:"Pumpkin", emoji:"🎃", group:"Orange veg", groupEmoji:"🍠",
    ageBand:"6m", ageText:"From ~6 months.",
    cook:"Steam/boil 15–20 min, or roast 400°F (205°C) ~30 min.",
    temp:"Serve lukewarm.", texture:"Purée smooth.",
    amount:"1–2 teaspoons to start.", tips:"Plain pumpkin, not pie filling.",
    nutrients:["Vitamin A","Vitamin C","Fiber","Potassium"] },

  { name:"Mango", emoji:"🥭", group:"Orange veg", groupEmoji:"🍠",
    ageBand:"6m", ageText:"From ~6 months (very ripe).",
    cook:"No cooking if ripe.", temp:"Room temperature.",
    texture:"Mash/purée very ripe mango. For 9m+ soft ripe spears.",
    amount:"1–2 teaspoons to start.", tips:"Use a soft, ripe mango.",
    nutrients:["Vitamin A","Vitamin C","Folate","Fiber"] },

  { name:"Peach (ripe/steamed)", emoji:"🍑", group:"Soft fruit", groupEmoji:"🍌",
    ageBand:"6m", ageText:"From ~6 months (peeled; steam if firm).",
    cook:"Ripe peach raw; firmer: steam 5 min. Peel first.",
    temp:"Room temp or lukewarm.", texture:"Mash/purée smooth.",
    amount:"1–2 teaspoons to start.",
    tips:"A Rosaceae fruit (apple, pear, cherry, plum family) — ~50% share cross-reactivity, so offer one at a time.",
    nutrients:["Vitamin C","Vitamin A","Fiber"] },

  { name:"Strawberry", emoji:"🍓", group:"Berries", groupEmoji:"🫐",
    ageBand:"6m", ageText:"From ~6 months. Not a top-9 allergen, but a common cause of mild rash around the mouth (contact, not a true allergy) — introduce on its own.",
    cook:"No cooking; use ripe, soft berries.",
    temp:"Room temperature.",
    texture:"Mash/purée smooth for 6m. For 9m+ offer large, soft, flattened pieces. Whole small berries are a choking risk — quarter them.",
    amount:"1–2 teaspoons mashed to start.",
    tips:"Acidic — can cause a harmless red mouth-rash. Watch, but it's usually not allergy.",
    nutrients:["Vitamin C","Fiber","Folate","Antioxidants"], choke:true },

  { name:"Blueberries", emoji:"🫐", group:"Berries", groupEmoji:"🫐",
    ageBand:"6m", ageText:"From ~6 months (always smashed — whole blueberries are a choking hazard).",
    cook:"No cooking; use ripe berries.",
    temp:"Room temperature.",
    texture:"Mash/smash every berry for 6m. For 9m+ still smash or halve — never whole until much older.",
    amount:"1–2 teaspoons smashed to start.",
    tips:"⚠ Whole blueberries are a choking hazard — always smash or quarter.",
    nutrients:["Vitamin C","Fiber","Antioxidants"], choke:true },

  { name:"Blackberries", emoji:"🫐", group:"Berries", groupEmoji:"🫐",
    ageBand:"6-9m", ageText:"From ~6–9 months, mashed well (seeds and size).",
    cook:"No cooking; use ripe, soft berries.",
    temp:"Room temperature.",
    texture:"Mash/purée and press through a sieve to reduce seeds. Quarter for older babies.",
    amount:"1–2 teaspoons mashed to start.",
    tips:"Seedy and tart — purée smooth for the youngest. Choking risk whole.",
    nutrients:["Vitamin C","Fiber","Antioxidants"], choke:true },

  { name:"Tomato", emoji:"🍅", group:"Other veg/fruit", groupEmoji:"🍅",
    ageBand:"6m", ageText:"From ~6 months. Acidic — like strawberry it can cause a harmless mouth-rash; introduce singly.",
    cook:"Raw ripe tomato can be puréed; or roast/steam to soften and peel.",
    temp:"Room temp or lukewarm.",
    texture:"Peel, deseed, and purée for 6m. For 9m+ soft quartered cherry tomatoes (never whole — choking risk).",
    amount:"1–2 teaspoons to start.",
    tips:"⚠ Whole cherry/grape tomatoes are a choking hazard — always quarter.",
    nutrients:["Vitamin C","Vitamin A","Potassium","Antioxidants"], choke:true },

  { name:"Cucumber", emoji:"🥒", group:"Other veg/fruit", groupEmoji:"🍅",
    ageBand:"6-9m", ageText:"From ~6–9 months. Great cold teething food as a large spear (supervised).",
    cook:"No cooking; peel for youngest.",
    temp:"Cool/room temp (chilled spear soothes gums).",
    texture:"Purée or grate for 6–9m. For 9m+ large peeled spears to gnaw. Avoid thin coins — choking risk.",
    amount:"A few teaspoons / one spear.",
    tips:"Mostly water, very mild. Offer big spears, not round slices.",
    nutrients:["Vitamin C","Potassium","Fiber"], choke:true },

  { name:"Bread (soft)", emoji:"🍞", group:"Grains", groupEmoji:"🌾",
    ageBand:"6-9m", ageText:"From ~6–9 months. Contains WHEAT (a top allergen) — treat the first serving as a wheat introduction.",
    cook:"Use soft bread; lightly toast so it doesn't gum into a paste. Spread thinly with a safe purée if you like.",
    temp:"Room temperature.",
    texture:"Offer strips/fingers of lightly-toasted bread for 6–9m. Avoid thick fresh white bread (can ball up and gum).",
    amount:"A strip or two to start.",
    tips:"⚠ Introduces wheat — watch for a reaction the first few times. Lightly toasting reduces gumming.",
    nutrients:["B vitamins","Iron","Fiber"] },

  { name:"Chicken (well-cooked)", emoji:"🍗", group:"Meat / protein", groupEmoji:"🍗",
    ageBand:"6-9m", ageText:"From ~6–9 months (puréed); soft shreds for 9m+.",
    cook:"Cook thoroughly to 165°F (74°C), then purée.",
    temp:"Cool to lukewarm.",
    texture:"Purée smooth with broth for 6–9m. For 9m+ finely shredded; for 12m+ soft strips.",
    amount:"1–2 teaspoons to start.", tips:"Good iron source. Blend with a familiar veggie if new.",
    nutrients:["Protein","Iron","Zinc","B vitamins"] },

  { name:"Turkey (puréed)", emoji:"🦃", group:"Meat / protein", groupEmoji:"🍗",
    ageBand:"6-9m", ageText:"From ~6–9 months (puréed).",
    cook:"Cook thoroughly to 165°F (74°C), then purée.",
    temp:"Cool to lukewarm.",
    texture:"Purée smooth with broth/water. Blend with a familiar veg if the texture is new.",
    amount:"1–2 teaspoons to start.", tips:"Lean poultry like chicken — good iron, mild.",
    nutrients:["Protein","Iron","Zinc","B vitamins"] },

  { name:"Turkey strips (finger food)", emoji:"🦃", group:"Meat / protein", groupEmoji:"🍗",
    ageBand:"9-12m", ageText:"From ~9–12 months, once baby manages soft finger foods — an alternative to purée.",
    cook:"Cook thoroughly to 165°F (74°C). Keep it moist (poach or braise) so strips aren't dry/tough.",
    temp:"Cool to lukewarm.",
    texture:"Cut into soft finger-length strips baby can hold and gnaw; or thin slices of moist meatballs. Avoid dry, firm chunks.",
    amount:"One or two strips to start.",
    tips:"Moist cooking matters — dry meat is hard to manage. Always supervise finger foods.",
    nutrients:["Protein","Iron","Zinc","B vitamins"] },

  { name:"Beef (puréed)", emoji:"🥩", group:"Meat / protein", groupEmoji:"🍗",
    ageBand:"6-9m", ageText:"From ~6–9 months (puréed) — an excellent iron source.",
    cook:"Cook thoroughly (well-done, no pink) to 160°F (71°C), then purée.",
    temp:"Cool to lukewarm.",
    texture:"Purée very smooth with broth or a familiar veggie for 6–9m.",
    amount:"1–2 teaspoons to start.",
    tips:"Rich in iron & zinc. Only ~10% of milk-allergic babies react to beef.",
    nutrients:["Iron","Zinc","Protein","B vitamins"] },

  { name:"Beef strips / soft meatball (finger food)", emoji:"🥩", group:"Meat / protein", groupEmoji:"🍗",
    ageBand:"9-12m", ageText:"From ~9–12 months, once baby handles soft finger foods — alternative to purée.",
    cook:"Cook thoroughly to 160°F (71°C). Choose tender cuts/ground beef and keep moist (stew, braise, or soft meatball).",
    texture:"Soft finger-length strips, or a soft meatball squashed flat / cut into graspable pieces. Avoid firm, dry chunks.",
    temp:"Cool to lukewarm.",
    amount:"One strip or a small soft meatball to start.",
    tips:"Ground/soft-cooked beef is easiest to manage. Always supervise; keep baby upright.",
    nutrients:["Iron","Zinc","Protein","B vitamins"] },

  { name:"Lentils (soft)", emoji:"🫘", group:"Meat / protein", groupEmoji:"🍗",
    ageBand:"6-9m", ageText:"From ~6–9 months.",
    cook:"Rinse red/green lentils, simmer 20–25 min until very soft.",
    temp:"Serve lukewarm.", texture:"Mash/purée smooth; thin with water/broth.",
    amount:"1–2 teaspoons to start.",
    tips:"Plant protein + iron. A legume — low cross-reactivity with peanut (<5%).",
    nutrients:["Protein","Iron","Folate","Fiber","Zinc"] },

  { name:"Chickpea / hummus", emoji:"🧆", group:"Meat / protein", groupEmoji:"🍗",
    ageBand:"6-9m", ageText:"From ~6–9 months.",
    cook:"Soft-cook or use canned (no-salt) chickpeas; blend with water. Hummus also contains tahini (sesame).",
    temp:"Room temp or lukewarm.",
    texture:"Purée very smooth; whole chickpeas are a choking risk.",
    amount:"1–2 teaspoons to start.",
    tips:"Legume, low peanut cross-reactivity. Hummus introduces sesame too — watch separately.",
    nutrients:["Protein","Iron","Folate","Fiber"], choke:true }
];

/* ---------- Allergen introduction schedule ----------
   Introduce ONE allergen at a time, early (~6 months once a few first foods
   are tolerated), in the morning, on a day you can watch for several hours.
   Keep tolerated allergens in rotation. ORDER/TIMING IS A STARTING POINT —
   your pediatrician may change it. */
const ALLERGENS = [
  { name:"Peanut", emoji:"🥜", week:1, group:"Peanut", groupEmoji:"🥜",
    ageBand:"6m", ageText:"From ~6 months (thinned — never whole).",
    how:"Smooth peanut butter thinned with warm water/milk to a loose purée, or a dissolvable peanut puff. NEVER whole peanuts or thick globs (choking).",
    amount:"Start ~1/4 tsp thinned peanut butter; if no reaction after ~10 min, a little more.",
    watch:"Watch 2+ hours. Keep offering 2–3x/week once tolerated.",
    note:"Early peanut introduction is specifically recommended by many guidelines. Severe eczema or egg allergy? ASK YOUR DOCTOR FIRST.",
    nutrients:["Protein","Healthy fats","Vitamin E","B vitamins"], choke:true },
  { name:"Egg", emoji:"🥚", week:2, group:"Egg", groupEmoji:"🥚",
    ageBand:"6m", ageText:"From ~6 months (fully cooked).",
    how:"Fully cooked egg — hard-boiled mashed or well-scrambled, no runny parts.",
    amount:"~1/4 tsp cooked egg, increasing gradually.",
    watch:"Watch 2+ hours. Keep in rotation once tolerated.",
    note:"Must be fully cooked. Introduce whole egg (yolk + white).",
    nutrients:["Protein","Vitamin D","B vitamins","Iron","Healthy fats"] },
  { name:"Dairy (yogurt/cheese)", emoji:"🧀", week:3, group:"Dairy", groupEmoji:"🧀",
    ageBand:"6m", ageText:"Yogurt/cheese from ~6 months. Cow's MILK as a drink waits until 12 months.",
    how:"Plain whole-milk yogurt or a little soft cheese.",
    amount:"~1 tsp plain whole-milk yogurt.",
    watch:"Watch 2+ hours.",
    note:"No added sugar. Whole-milk (full-fat) dairy for babies.",
    nutrients:["Calcium","Protein","Vitamin D","B vitamins"] },
  { name:"Wheat", emoji:"🌾", week:4, group:"Grains", groupEmoji:"🌾",
    ageBand:"6m", ageText:"From ~6 months.",
    how:"Iron-fortified wheat baby cereal, or a little soft bread/pasta.",
    amount:"A few teaspoons of thinned wheat cereal.",
    watch:"Watch 2+ hours.", note:"Often introduced via cereal to control the amount.",
    nutrients:["B vitamins","Iron","Fiber"] },
  { name:"Soy", emoji:"🫘", week:5, group:"Soy", groupEmoji:"🫘",
    ageBand:"6m", ageText:"From ~6 months.",
    how:"Plain soft/silken tofu mashed, or plain soy yogurt.",
    amount:"~1 tsp mashed soft tofu.", watch:"Watch 2+ hours.",
    note:"Soft/silken tofu mashes smooth.",
    nutrients:["Protein","Calcium","Iron","Folate"] },
  { name:"Tree nuts", emoji:"🌰", week:6, group:"Tree nuts", groupEmoji:"🌰",
    ageBand:"6m", ageText:"From ~6 months (thinned butter — never whole).",
    how:"Smooth almond/cashew butter thinned to a loose purée. NEVER whole nuts (choking).",
    amount:"~1/4 tsp thinned nut butter.",
    watch:"Watch 2+ hours. Introduce one tree nut at a time.",
    note:"Thin thoroughly. Whole nuts are a choking hazard until ~4 years.",
    nutrients:["Healthy fats","Vitamin E","Protein","Calcium"], choke:true },
  { name:"Almond (butter, thinned)", emoji:"🌰", week:6, group:"Tree nuts", groupEmoji:"🌰",
    ageBand:"6m", ageText:"From ~6 months as thinned butter.",
    how:"Smooth almond butter thinned with water/milk to a loose purée.",
    amount:"~1/4 tsp to start.", watch:"Watch 2+ hours.",
    note:"A single tree nut — tolerating almond does NOT clear cashew/walnut; introduce each separately.",
    nutrients:["Healthy fats","Vitamin E","Calcium","Protein"], choke:true },
  { name:"Cashew (butter, thinned)", emoji:"🌰", week:6, group:"Tree nuts", groupEmoji:"🌰",
    ageBand:"6m", ageText:"From ~6 months as thinned butter.",
    how:"Smooth cashew butter thinned to a loose purée.",
    amount:"~1/4 tsp to start.", watch:"Watch 2+ hours.",
    note:"Cashew↔pistachio cross-react very highly (34–100%). Introduce on its own, carefully.",
    nutrients:["Healthy fats","Protein","Zinc","Iron"], choke:true },
  { name:"Walnut (butter, thinned)", emoji:"🌰", week:6, group:"Tree nuts", groupEmoji:"🌰",
    ageBand:"6m", ageText:"From ~6 months as thinned butter.",
    how:"Smooth walnut butter thinned to a loose purée.",
    amount:"~1/4 tsp to start.", watch:"Watch 2+ hours.",
    note:"Walnut↔pecan cross-react very highly (75–100%). Introduce singly.",
    nutrients:["Healthy fats","Omega-3","Protein","Vitamin E"], choke:true },
  { name:"Fish", emoji:"🐟", week:7, group:"Fish", groupEmoji:"🐟",
    ageBand:"6m", ageText:"From ~6 months (well-cooked, boneless).",
    how:"Well-cooked, flaked, boneless mild fish (salmon, cod) to 145°F (63°C). Purée smooth.",
    amount:"~1 tsp puréed cooked fish.", watch:"Watch 2+ hours.",
    note:"Check carefully for bones. Choose low-mercury fish.",
    nutrients:["Omega-3","Protein","Vitamin D","B vitamins"] },
  { name:"Shellfish", emoji:"🦐", week:8, group:"Shellfish", groupEmoji:"🦐",
    ageBand:"6-9m", ageText:"From ~6–9 months, well-cooked and finely puréed.",
    how:"Well-cooked shellfish (e.g. shrimp), finely puréed. Cook thoroughly.",
    amount:"~1/4–1/2 tsp.", watch:"Watch 2+ hours.",
    note:"Shellfish allergy can be significant — introduce carefully, ask your doctor with family history.",
    nutrients:["Protein","Zinc","Omega-3","B vitamins"] },
  { name:"Sesame", emoji:"🌱", week:9, group:"Sesame", groupEmoji:"🌱",
    ageBand:"6m", ageText:"From ~6 months (thinned tahini).",
    how:"Tahini (sesame paste) thinned with water, or hummus (contains tahini).",
    amount:"~1/4 tsp thinned tahini.", watch:"Watch 2+ hours.",
    note:"Sesame is a recognized major allergen.",
    nutrients:["Calcium","Healthy fats","Protein","Iron"] }
];

/* ---------- "Try next" suggestions by food group (cross-reactivity-informed) ----------
   tier "ok"   🟢 low cross-reactivity — reassuring to try next
   tier "care" 🟡 high cross-reactivity — introduce one at a time
   Percentages = clinical cross-reactivity from Francis et al., "Common food
   allergens and cross-reactivity", J Food Allergy 2020 (funded by FARE).
   The numbers are factual from that review; which foods we surface is our
   editorial choice. Confirm introductions with your pediatrician. */
const SUGG_SRC = "Francis et al., J Food Allergy 2020";
const GROUP_SUGGESTIONS = {
  "Orange veg":   [ {name:"Pumpkin", tier:"ok", why:"Sweet vitamin-A veg like sweet potato & squash — variety pick, not an allergy group."},
                    {name:"Mango", tier:"ok", why:"Sweet vitamin-A/C fruit — variety pick."} ],
  "Soft fruit":   [ {name:"Peach (ripe/steamed)", tier:"care", why:"Rosaceae fruit — ~50% cross-reactivity across apple/pear/cherry/plum. Usually mild; offer on its own."} ],
  "Berries":      [ {name:"Blueberries", tier:"ok", why:"Another berry — variety pick. Always smash (choking)."},
                    {name:"Strawberry", tier:"ok", why:"Another berry; can cause a harmless acidic mouth-rash. Variety pick."} ],
  "Green veg":    [ {name:"Green beans", tier:"ok", why:"Mild green veg — variety pick like peas."},
                    {name:"Zucchini", tier:"ok", why:"Soft, mild, steams quickly — variety pick."},
                    {name:"Spinach (cooked)", tier:"ok", why:"Iron + folate — variety pick."} ],
  "Other veg/fruit":[ {name:"Cucumber", tier:"ok", why:"Mild, mostly water — variety pick and a good teething spear."} ],
  "Meat / protein":[ {name:"Turkey (puréed)", tier:"ok", why:"Lean poultry like chicken — variety pick, good iron."},
                    {name:"Beef (puréed)", tier:"care", why:"Only ~10% of milk-allergic kids react to beef — but if dairy isn't tolerated yet, offer beef on its own. ("+SUGG_SRC+")"},
                    {name:"Lentils (soft)", tier:"ok", why:"If peanut is tolerated, legumes like lentils are low-risk (<5% cross-react with peanut). ("+SUGG_SRC+")"} ],
  "Peanut":       [ {name:"Soy (tofu)", tier:"ok", why:"Legume like peanut — only <5% clinical cross-reactivity. Reassuring next step. ("+SUGG_SRC+")"},
                    {name:"Lentils (soft)", tier:"ok", why:"Other legumes cross-react with peanut only ~5% — low risk. ("+SUGG_SRC+")"},
                    {name:"Chickpea / hummus", tier:"ok", why:"Legume; low peanut cross-reactivity. (Hummus also brings in sesame — watch that separately.) ("+SUGG_SRC+")"},
                    {name:"Tree nuts", tier:"care", why:"20–60% of peanut-allergic kids also react to a tree nut — introduce each tree nut carefully, on its own. ("+SUGG_SRC+")"} ],
  "Soy":          [ {name:"Peanut", tier:"ok", why:"Legume like soy; peanut↔soy clinical cross-reactivity is <5%. Still a top allergen — go slow. ("+SUGG_SRC+")"},
                    {name:"Lentils (soft)", tier:"ok", why:"Another legume; low cross-reactivity with soy."} ],
  "Dairy":        [ {name:"Dairy (yogurt/cheese)", tier:"ok", why:"If yogurt is tolerated, soft cheese is the same cow's-milk source — a reasonable next dairy."} ],
  "Egg":          [ {name:"Egg", tier:"ok", why:"Keep egg in rotation; ~70% of egg-allergic kids tolerate baked egg, and other bird eggs rarely cross-react. ("+SUGG_SRC+")"} ],
  "Grains":       [ {name:"Rice cereal (iron-fortified)", tier:"ok", why:"If wheat is tolerated, rice almost never cross-reacts (<5%). ("+SUGG_SRC+")"},
                    {name:"Oatmeal (iron-fortified)", tier:"ok", why:"Oats rarely cross-react with wheat (<5%) — low risk. ("+SUGG_SRC+")"},
                    {name:"Bread (soft)", tier:"care", why:"Bread IS wheat — if wheat isn't tolerated yet, treat the first bread as the wheat introduction."} ],
  "Fish":         [ {name:"Shellfish", tier:"ok", why:"Fish and shellfish do NOT cross-react — a separate allergen to introduce on its own schedule. ("+SUGG_SRC+")"} ],
  "Shellfish":    [ {name:"Fish", tier:"ok", why:"Shellfish and fish do NOT cross-react — separate allergen, introduce on its own. ("+SUGG_SRC+")"} ],
  "Tree nuts":    [ {name:"Almond (butter, thinned)", tier:"care", why:"Each tree nut is separate — cashew↔pistachio & walnut↔pecan run 75–100%. Introduce one nut at a time. ("+SUGG_SRC+")"},
                    {name:"Cashew (butter, thinned)", tier:"care", why:"High within-tree-nut cross-reactivity — introduce singly, carefully. ("+SUGG_SRC+")"},
                    {name:"Walnut (butter, thinned)", tier:"care", why:"Walnut↔pecan 75–100% — introduce on its own. ("+SUGG_SRC+")"},
                    {name:"Peanut", tier:"care", why:"20–60% cross-reactivity between tree nuts and peanut — introduce carefully if not already tolerated. ("+SUGG_SRC+")"} ],
  "Sesame":       [ {name:"Chickpea / hummus", tier:"ok", why:"Hummus keeps sesame in rotation (via tahini) and adds chickpea (legume)."} ]
};

/* ---------- Signs of a reaction ---------- */
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
  return FOODS.map(f=>({ ...f, isAllergen:false }))
    .concat(ALLERGENS.map(a=>({ ...a, isAllergen:true, stage:"Allergen (step "+a.week+")" })));
}
function itemByName(name){
  return allItems().find(i=>i.name.toLowerCase()===String(name||"").toLowerCase()) || null;
}

/* ---------- per-food 3-day watch template ---------- */
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
