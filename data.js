/* =====================================================================
   Little Bites — data
   General, commonly-cited first-foods guidance (AAP-style, ~6 months).
   NOT medical advice. Confirm everything, especially allergens, with
   your pediatrician.
   ===================================================================== */

/* ---------- Recommended first foods ---------- */
const FOODS = [
  {
    name:"Avocado", emoji:"🥑", allergen:false, stage:"Stage 1 (first foods)",
    cook:"No cooking needed.",
    temp:"Serve at room temperature.",
    texture:"Mash with a fork until smooth; thin with a little breast milk or formula if needed.",
    amount:"Start with 1–2 teaspoons, once a day. Build up as baby takes more.",
    tips:"Soft, mild, full of healthy fats. Pick one that gives slightly to gentle pressure."
  },
  {
    name:"Sweet potato", emoji:"🍠", allergen:false, stage:"Stage 1 (first foods)",
    cook:"Peel, cube, and steam or boil 15–20 min until very soft. Or bake at 400°F (205°C) ~45 min until soft.",
    temp:"Cool to lukewarm (test on your wrist — should feel barely warm).",
    texture:"Mash or purée smooth; add water/milk to loosen.",
    amount:"1–2 teaspoons to start, once a day.",
    tips:"Naturally sweet, usually a baby favorite. Make a batch and freeze in ice-cube trays."
  },
  {
    name:"Banana", emoji:"🍌", allergen:false, stage:"Stage 1 (first foods)",
    cook:"No cooking needed.",
    temp:"Room temperature.",
    texture:"Mash very ripe banana with a fork until smooth.",
    amount:"1–2 teaspoons to start.",
    tips:"Use a ripe (spotty) banana so it mashes smooth. Can firm up stools."
  },
  {
    name:"Butternut squash", emoji:"🎃", allergen:false, stage:"Stage 1 (first foods)",
    cook:"Peel, cube, steam/boil 15–20 min until very soft, or roast at 400°F (205°C) ~30 min.",
    temp:"Serve lukewarm.",
    texture:"Purée smooth.",
    amount:"1–2 teaspoons to start.",
    tips:"Mild and sweet. Freezes well in cubes."
  },
  {
    name:"Carrot", emoji:"🥕", allergen:false, stage:"Stage 1 (first foods)",
    cook:"Peel, slice, steam/boil 15–20 min until fork-tender.",
    temp:"Serve lukewarm.",
    texture:"Purée smooth (carrots need a thorough blend).",
    amount:"1–2 teaspoons to start.",
    tips:"Use fresh carrots for first foods; purée very smooth as they can stay fibrous."
  },
  {
    name:"Apple", emoji:"🍎", allergen:false, stage:"Stage 1 (first foods)",
    cook:"Peel, core, cube; steam or simmer 10–15 min until soft.",
    temp:"Serve lukewarm.",
    texture:"Purée smooth (unsweetened — no added sugar).",
    amount:"1–2 teaspoons to start.",
    tips:"Basically homemade unsweetened applesauce. Can loosen stools."
  },
  {
    name:"Pear", emoji:"🍐", allergen:false, stage:"Stage 1 (first foods)",
    cook:"Ripe pear needs no cooking; firmer pear: steam 5–10 min.",
    temp:"Room temp or lukewarm.",
    texture:"Mash or purée smooth.",
    amount:"1–2 teaspoons to start.",
    tips:"Gentle and sweet; often well tolerated early."
  },
  {
    name:"Oatmeal (iron-fortified)", emoji:"🥣", allergen:false, stage:"Stage 1 (first foods)",
    cook:"Mix iron-fortified baby oat cereal with warm breast milk, formula, or water per package.",
    temp:"Serve lukewarm.",
    texture:"Thin and runny at first; thicken over time.",
    amount:"Start with a few teaspoons.",
    tips:"Iron matters a lot at 6 months — iron-fortified cereals are a common first food."
  },
  {
    name:"Green peas", emoji:"🫛", allergen:false, stage:"Stage 1–2",
    cook:"Steam/boil 5–8 min until very soft.",
    temp:"Serve lukewarm.",
    texture:"Purée smooth and push through a sieve to remove skins.",
    amount:"1–2 teaspoons to start.",
    tips:"Press through a strainer so there are no tough skins."
  },
  {
    name:"Chicken (well-cooked)", emoji:"🍗", allergen:false, stage:"Stage 2 (protein / iron)",
    cook:"Cook thoroughly to an internal temp of 165°F (74°C). Then purée.",
    temp:"Cool to lukewarm before serving.",
    texture:"Purée smooth with broth or water; or finely shred for older babies.",
    amount:"1–2 teaspoons to start.",
    tips:"Good iron source. Blend with a familiar veggie if the texture is new."
  }
];

/* ---------- Allergen introduction schedule ----------
   Common guidance: introduce ONE allergen at a time, early (around 6
   months, once a few first foods are tolerated), in the MORNING, on a day
   you can watch baby for several hours. Wait ~3–5 days before the next NEW
   allergen so a reaction can be traced to one food. Once tolerated, keep
   offering it regularly (a few times a week) to maintain tolerance.
   ORDER AND TIMING ARE A STARTING POINT — your pediatrician may change them,
   especially if there's family history of allergy or any eczema. */
const ALLERGENS = [
  { name:"Peanut", emoji:"🥜", week:1,
    how:"Smooth peanut butter thinned with warm water/breast milk/formula to a loose purée, OR a peanut puff dissolved. NEVER whole peanuts or thick globs (choking).",
    amount:"Start tiny: about 1/4 teaspoon of thinned peanut butter. If no reaction after ~10 min, offer a bit more.",
    watch:"Watch 2+ hours. Keep offering 2–3x/week once tolerated.",
    note:"Early peanut introduction is specifically recommended by many guidelines. If baby has severe eczema or egg allergy, ASK YOUR DOCTOR FIRST — some babies need allergy testing before peanut." },
  { name:"Egg", emoji:"🥚", week:2,
    how:"Fully cooked egg — hard-boiled yolk+white mashed, or well-cooked scrambled, no runny parts.",
    amount:"Start with ~1/4 teaspoon of cooked egg, increase gradually.",
    watch:"Watch 2+ hours. Keep in rotation once tolerated.",
    note:"Must be fully cooked. Introduce whole egg (yolk + white)." },
  { name:"Dairy (yogurt/cheese)", emoji:"🧀", week:3,
    how:"Plain whole-milk yogurt or a little soft cheese. (Plain cow's MILK as a drink waits until 12 months — but yogurt/cheese are fine as foods earlier.)",
    amount:"Start with ~1 teaspoon plain whole-milk yogurt.",
    watch:"Watch 2+ hours.",
    note:"No added sugar. Whole-milk (full-fat) dairy for babies." },
  { name:"Wheat", emoji:"🌾", week:4,
    how:"Iron-fortified wheat baby cereal, or a small amount of soft bread/pasta purée.",
    amount:"Start with a few teaspoons of thinned wheat cereal.",
    watch:"Watch 2+ hours.",
    note:"Often introduced via cereal so it's easy to control amount." },
  { name:"Soy", emoji:"🫘", week:5,
    how:"Plain soft tofu mashed, or plain soy yogurt.",
    amount:"Start with ~1 teaspoon mashed silken/soft tofu.",
    watch:"Watch 2+ hours.",
    note:"Soft/silken tofu mashes to a smooth texture." },
  { name:"Tree nuts", emoji:"🌰", week:6,
    how:"Smooth almond or cashew butter thinned to a loose purée. NEVER whole nuts (choking).",
    amount:"Start with ~1/4 teaspoon thinned nut butter.",
    watch:"Watch 2+ hours. Introduce one tree nut at a time if your doctor advises.",
    note:"Thin thoroughly. Whole nuts are a choking hazard until ~4 years." },
  { name:"Fish", emoji:"🐟", week:7,
    how:"Well-cooked, flaked, boneless mild fish (e.g. salmon, cod) to 145°F (63°C). Purée smooth.",
    amount:"Start with ~1 teaspoon puréed cooked fish.",
    watch:"Watch 2+ hours.",
    note:"Check carefully for bones. Choose low-mercury fish." },
  { name:"Shellfish", emoji:"🦐", week:8,
    how:"Well-cooked shellfish (e.g. shrimp), finely puréed. Cook thoroughly.",
    amount:"Start with ~1/4–1/2 teaspoon.",
    watch:"Watch 2+ hours.",
    note:"Shellfish allergy can be significant — introduce carefully and ask your doctor, especially with family history." },
  { name:"Sesame", emoji:"🌱", week:9,
    how:"Tahini (sesame paste) thinned with water to a loose purée, or hummus (which contains tahini).",
    amount:"Start with ~1/4 teaspoon thinned tahini.",
    watch:"Watch 2+ hours.",
    note:"Sesame is now recognized as a major allergen." }
];

/* ---------- Signs of a reaction (shown in-app) ---------- */
const REACTION_SIGNS = [
  "Hives, redness, or a rash (especially spreading)",
  "Swelling of lips, face, tongue, or eyes",
  "Vomiting or lots of drooling/gagging after the food",
  "Coughing, wheezing, or trouble breathing",
  "Sudden sleepiness, floppiness, or pale skin"
];
const EMERGENCY_TEXT = "Trouble breathing, swelling of the face/tongue, or sudden floppiness/paleness can be a severe allergic reaction (anaphylaxis) — call emergency services (911) right away. For milder signs, stop the food and call your pediatrician.";

/* ---------- Default 3-day watch checklist template per food/allergen ---------- */
/* Each introduction becomes a Day 1 / Day 2 / Day 3 block. */
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
