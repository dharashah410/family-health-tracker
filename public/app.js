'use strict';

// ─── DATA ──────────────────────────────────────────────────────────────────

const PEOPLE = {
  R: { name: 'Ritvij', targetWeight: 80, startWeight: 92, label: 'weight loss', color: '#D85A30', light: '#FAECE7', dark: '#993C1D' },
  D: { name: 'Dhara',  targetWeight: 52, startWeight: 43, label: 'weight gain', color: '#1D9E75', light: '#E1F5EE', dark: '#0F6E56' },
  S: { name: 'Sabi',   color: '#4A6FA5', light: '#E8EFF8', dark: '#2A4A7A' },
  V: { name: 'Vasu',   color: '#7B5EA7', light: '#EDE8F5', dark: '#4A3270' },
};

const MEDS = {
  R: [
    { name: 'Vitamin D — Cholecalciferol 60K', freq: 'Once a week (Sunday)', days: [0] },
    { name: 'Vitamin B12 — Methylcobalamin 250 mcg', freq: '2–3 times a week', days: [1,3,5] },
    { name: 'Isabgol (Psyllium Husk)', freq: 'As needed — tapering off as gut improves on WFPB', days: [] },
  ],
  D: [
    { name: 'Vitamin D — Cholecalciferol 60K', freq: 'Once a week (Sunday)', days: [0] },
    { name: 'Vitamin B12 — Methylcobalamin 500 mcg', freq: 'Daily for 3 months, then 2–3×/week', days: [0,1,2,3,4,5,6] },
  ]
};

const BLOOD_TARGETS = {
  R: {
    label: 'Ritvij',
    nextTest: 'August 2026',
    markers: [
      { name: 'CAP Score (Fatty Liver)', current: 312,   target: '< 248',     unit: 'dB/m',   ok: false },
      { name: 'HOMA-IR (Insulin Resistance)', current: 7.06,  target: '< 2.5',    unit: '',       ok: false },
      { name: 'HsCRP (Inflammation)',   current: 6.06,  target: '< 3.0',    unit: 'mg/L',   ok: false },
      { name: 'HDL Cholesterol',        current: 32,    target: '> 40',     unit: 'mg/dL',  ok: false },
      { name: 'Triglycerides',          current: 171,   target: '< 150',    unit: 'mg/dL',  ok: false },
      { name: 'Fasting Glucose',        current: 106,   target: '< 100',    unit: 'mg/dL',  ok: false },
      { name: 'Vitamin D',              current: 42.74, target: '75–130',   unit: 'nmol/L', ok: false },
    ]
  },
  D: {
    label: 'Dhara',
    nextTest: 'Pending',
    markers: [
      { name: 'Total Protein',  current: 5.30, target: '6.4–8.3', unit: 'g/dL',   ok: false },
      { name: 'Haemoglobin',    current: 12.0, target: '≥ 13.0',  unit: 'g/dL',   ok: false },
      { name: 'Sodium',         current: 136,  target: '136–145', unit: 'mEq/L',  ok: true  },
      { name: 'Calcium',        current: 8.0,  target: '8.5–10.5',unit: 'mg/dL',  ok: false },
    ]
  }
};

const PREP_TASKS = [
  { section: 'Saturday Night — Soak', emoji: '🌙', tasks: [
    'Soak red rice + urad dal (4:1 ratio) in a large pot — for idli/dosa batter',
    'Soak moong dal in a separate bowl — for chilla batter',
    'Soak chickpeas in a bowl',
    'Soak rajma in a separate bowl',
  ]},
  { section: 'Sunday Morning — Cook & Grind', emoji: '☀️', tasks: [
    'Grind dosa/idli batter. Take out 2 cups for Ritvij → stir in 1 tbsp JF powder. Set all to ferment 6–8 hrs.',
    'Grind chilla batter (soaked moong dal)',
    'Pressure cook chickpeas. Portion in labelled box.',
    'Pressure cook rajma. Portion in separate box.',
    'Make sambar base (toor dal + vegetables, no oil)',
    'Make green chutney: coriander + coconut + lime + green chilli. Store in jar.',
  ]},
  { section: 'Sunday Afternoon — Batch Prep', emoji: '🌤️', tasks: [
    'Seeds powder jar: roast flaxseed + sesame + chia. Lightly crush. Store on counter.',
    'JF roti dough: knead 1 tbsp JF powder per 2 cups atta. Cover and refrigerate.',
    'Cut salad veg: cucumber, capsicum, tomato, carrot. Store in airtight boxes.',
    'Cook large pot of millet.',
    'Make miso-ginger broth base (for Friday ramen). Store in jar in fridge.',
    'Make date-tamarind chutney for chaats.',
  ]},
];

const COOK_RULES = [
  { rule: '🌿 JF powder',   detail: 'Ritvij only. 1 tbsp/day. Add to his batter, dough, dal or smoothie — tasteless, no one will notice.' },
  { rule: '❌ Oil',          detail: 'Never add oil to anything. Use grated coconut, crushed peanuts or sesame as replacers.' },
  { rule: '❌ Dairy',        detail: 'No milk, ghee, butter, paneer in any cooked food. Plant-based curd OK for Vasu as a dipping side.' },
  { rule: '🧒 Vasu\'s plate', detail: 'Same dish — mash or soften. No added salt, no added sugar. Always serve one bridge food alongside.' },
  { rule: '🎒 Sabi tiffin',  detail: 'Pack a portion of family lunch. Add egg scramble or hard-boiled egg if time allows.' },
  { rule: '🍎 Fruits',       detail: 'Serve only on empty stomach or as a full meal. Never mix into cooked food.' },
];

// MEAL_PLAN[weekIdx][dayIdx] — 4 weeks × 7 days (Mon–Sun)
const MEAL_PLAN = [

  // ── WEEK 1 ──────────────────────────────────────────────────────────────────
  [
  { day: 'Monday', dayShort: 'Mon',
    R: { b: 'Green smoothie (spinach + banana + flaxseed powder) + fruit plate', bJF: '1 tbsp JF powder blended in',
         l: 'Chana Palak (small bowl) + 1 jowar roti + large cucumber-tomato salad', lJF: '1 tbsp JF powder in roti dough',
         s: '10 almonds + cucumber sticks + green smoothie',
         d: 'Dal Fry (masoor) + large salad + 1 small jowar roti', dJF: '1 tbsp JF powder in roti dough' },
    D: { b: 'Fluffy pancakes (banana-oat) + peanut butter + seasonal fruit',
         l: 'Chana Palak + 2 jowar rotis + steamed sweet potato',
         s: 'Soaked almonds + dried figs + coconut water',
         d: 'Dal Fry + 2 rotis + steamed broccoli + roasted peanuts' },
    S: { b: 'Banana-oat pancakes (same base as Dhara) + 3-egg veggie scramble on the side',
         l: 'School tiffin: jowar roti + chana palak + small fruit',
         s: 'Fruit plate + handful roasted peanuts',
         d: 'Dal fry + rice + papad + salad' },
    V: { b: 'Banana-oat pancake + roasted red/yellow capsicum + marinara dip', bNote: 'Take V\'s batter cup first, whisk 1 egg in — banana flavour masks it completely. R & D batter stays egg-free.',
         l: 'Soft dal-rice mash + roasted yellow capsicum fingers + small cup mango',
         s: 'Seasonal fruit + small banana pancake (leftover from morning)',
         d: 'Soft dal + plain rice + roasted red capsicum' },
    link: 'https://sharan-india.org/recipes/indian-curries/chana-palak/' },

  { day: 'Tuesday', dayShort: 'Tue',
    R: { b: 'Overnight Oats + berries + seeds powder', bJF: '1 tbsp JF powder stirred in the night before',
         l: 'Bhindi Masala + 1 roti + large salad', lJF: 'JF in roti dough',
         s: 'Moong sprout chaat + lime + coriander',
         d: 'Chole (small bowl) + salad + steamed cauliflower' },
    D: { b: 'Overnight Oats (larger) + dates + banana + chia seeds',
         l: 'Bhindi Masala + 2 rotis + moong dal + steamed sweet potato',
         s: 'Moong sprout chaat + roasted peanuts + coconut water',
         d: 'Chole + 1.5 cups brown rice + salad + roasted peanut topping' },
    S: { b: 'Overnight Oats (same base) + 3-egg veggie scramble on the side',
         l: 'School tiffin: jowar roti roll with bhindi filling + fruit',
         s: 'Moong chaat + whole wheat crackers',
         d: 'Chole + rice/roti + salad' },
    V: { b: 'Overnight Oats (small) + mini besan chilla + roasted red/yellow capsicum + marinara dip', bNote: 'Whisk 1 egg into V\'s small cup of besan batter, cook mini chilla alongside oats. Marinara = her pizza pancake.',
         l: 'Soft khichdi (moong dal + rice) + roasted capsicum + seasonal fruit',
         s: 'Banana + small date + few roasted peanuts (ground, soft)',
         d: 'Soft chole mash + plain rice + seasonal fruit' },
    link: 'https://sharan-india.org/recipes/indian-curries/bhindi-masala/' },

  { day: 'Wednesday', dayShort: 'Wed',
    R: { b: 'Instant Millet Dosa + sambar + tomato chutney + salad', bJF: '1 tbsp JF powder in dosa batter',
         l: 'Methi Palak Sweet Potato Sabzi + 1 roti + large salad', lJF: 'JF in roti dough',
         s: 'Sweet Potato Chaat + green chutney',
         d: 'Vegetable Khichdi (moong dal heavy, small bowl) + salad' },
    D: { b: 'Millet Dosa ×3 + sambar + coconut chutney + avocado slice',
         l: 'Methi Palak Sweet Potato Sabzi + 2 rotis + toor dal',
         s: 'Sweet Potato Chaat + roasted peanuts + coconut water',
         d: 'Vegetable Khichdi (large) + roasted peanut topping + coconut chutney' },
    S: { b: 'Millet Dosa (same base as family) + 3-egg scramble on the side',
         l: 'School tiffin: roti + sabzi roll + small fruit',
         s: 'Sweet potato chaat + fruit',
         d: 'Khichdi + papad + salad' },
    V: { b: 'Mini millet dosa ×2 + roasted red/yellow capsicum + marinara dip', bNote: 'Pour V\'s dosa batter first, whisk 1 egg in — make her dosas first. R & D batter stays egg-free.',
         l: 'Soft sweet potato mash + plain dal + small dosa piece',
         s: 'Soft steamed sweet potato cubes + seasonal fruit',
         d: 'Soft khichdi + mashed banana + seasonal fruit' },
    link: 'https://sharan-india.org/recipes/breakfast/red-rice-idli-or-dosa/' },

  { day: 'Thursday', dayShort: 'Thu',
    R: { b: 'Thalipeeth (savoury multigrain pancake) + green chutney', bJF: '1 tbsp JF powder in batter',
         l: 'Jackfruit Sambar + small millet rice + salad',
         s: '10 walnuts + guava/pear (with skin)',
         d: 'Baingan Bharta + 1 roti + salad', dJF: 'JF in roti dough' },
    D: { b: 'Thalipeeth ×2 + peanut butter + banana',
         l: 'Jackfruit Sambar + 1.5 cups millet rice + tofu stir-fry side',
         s: 'Soaked almonds + dried apricots + makhana',
         d: 'Baingan Bharta + 2 rotis + toor dal + sesame seeds side' },
    S: { b: 'Thalipeeth (same base as family) + 3-egg scramble on the side',
         l: 'School tiffin: sambar rice packed warm + papad + fruit',
         s: 'Whole wheat toast + peanut butter + banana',
         d: 'Baingan bharta + roti + dal' },
    V: { b: 'Mini thalipeeth + mashed banana + marinara dip', bNote: 'Mix 1 egg into V\'s small thalipeeth dough before shaping — ragi+jowar flavour masks egg completely.',
         l: 'Soft rice + sambar (thin) + mango slice',
         s: 'Soft banana pancake (mini, from batch) + seasonal fruit',
         d: 'Plain dal + rice + roasted red capsicum strips' },
    link: 'https://sharan-india.org/recipes/indian-curries/jackfruit-sambar/' },

  { day: 'Friday', dayShort: 'Fri',
    R: { b: 'Red Rice Idli ×2 + sambar + tomato chutney + salad', bJF: '1 tbsp JF powder in idli batter',
         l: 'Dhansak Dal + salad + 1 roti', lJF: 'JF in roti dough',
         s: 'Green smoothie + guava',
         d: 'Ramen bowl: miso broth + tofu + bok choy + brown rice noodles + mushroom' },
    D: { b: 'Red Rice Idli ×4 + sambar + coconut chutney + avocado',
         l: 'Dhansak Dal + 2 rotis + steamed sweet potato + hemp seeds',
         s: 'Ragi porridge with banana + sesame seeds',
         d: 'Ramen bowl (large) + extra noodles + extra tofu + sesame topping' },
    S: { b: 'Red Rice Idli (same base) + 3-egg masala scramble on the side',
         l: 'School tiffin: dhansak dal rice + fruit',
         s: 'Chickpea Masala Chaat + fruit',
         d: 'Ramen bowl + extra noodles' },
    V: { b: 'Soft idli ×2 + mini besan chilla + marinara dip + papaya', bNote: 'Idli batter is steamed so egg can\'t be added — make V a quick besan chilla (1 egg in batter) alongside. Marinara = pizza pancake.',
         l: 'Soft dal-rice + mashed sweet potato + seasonal fruit',
         s: 'Soft ragi porridge (mild, no sugar) + banana slices',
         d: 'Soft rice noodles + mild tofu + carrot + mild broth' },
    link: 'https://sharan-india.org/recipes/breakfast/red-rice-idli-or-dosa/' },

  { day: 'Saturday', dayShort: 'Sat',
    R: { b: 'Vegetable Poha + green chutney + small fruit plate',
         l: 'Cauliflower Masala + 1 roti + large salad', lJF: 'JF in roti dough',
         s: 'Chickpea Masala Chaat',
         d: '🫓 DOSA NIGHT — Millet Dosa + sambar + coconut chutney + salad', dJF: 'JF in dosa batter — Ritvij served first from same batter' },
    D: { b: 'Vegetable Poha (large) + coconut milk + banana + peanuts',
         l: 'Cauliflower Masala + 2 rotis + toor dal + roasted peanuts',
         s: 'Chickpea Masala Chaat + roasted peanuts + coconut water',
         d: '🫓 DOSA NIGHT — Millet Dosa ×3 + sambar + coconut chutney + roasted sesame' },
    S: { b: 'Vegetable Poha (same base as family) + 3-egg scramble on the side',
         l: 'Cauliflower masala + roti + dal',
         s: 'Whole wheat pizza slice (SHARAN style) + fruit',
         d: '🫓 DOSA NIGHT — Dosa ×2 + sambar + chutney' },
    V: { b: 'Soft poha + mini besan chilla + roasted red/yellow capsicum + marinara dip', bNote: 'Whisk 1 egg into V\'s besan batter cup, cook mini chilla alongside poha. Marinara dip = her pizza pancake.',
         l: 'Soft cauliflower mash + plain dal + rice + seasonal fruit',
         s: 'Soft banana + dates (1, mashed) + peanut butter on mini roti',
         d: '🫓 DOSA NIGHT — Mini soft dosa ×2 + thin sambar for dipping + mango' },
    link: 'https://sharan-india.org/recipes/indian-snacks/chickpea-masala-chaat/' },

  { day: 'Sunday', dayShort: 'Sun',
    R: { b: 'Fruit plate (papaya + guava + pear with skin) + flaxseed water',
         l: 'Jackfruit Sambar + small millet rice + large salad',
         s: '10 almonds + 2 dates',
         d: 'Dhansak Dal + salad + 1 roti', dJF: '1 tbsp JF powder stirred into dal while cooking' },
    D: { b: 'Tofu Scramble + whole wheat toast + avocado + hemp seeds',
         l: 'Jackfruit Sambar + 1.5 cups millet rice + tofu stir-fry',
         s: 'Soaked figs + almonds + flaxseed laddoo',
         d: 'Dhansak Dal + 2 rotis + sweet potato + extra legumes' },
    S: { b: '3-egg french toast (whole wheat, egg custard) + banana + seasonal fruit',
         l: 'Sambar rice + papad + salad',
         s: 'Healthy Bhel + fruit',
         d: 'Dhansak dal + roti + rice' },
    V: { b: 'Mini whole wheat french toast + mashed banana + marinara dip', bNote: 'V shares S\'s egg custard — bread soaks up egg completely, zero taste. Add marinara on the side.',
         l: 'Soft rice + sambar (thin) + seasonal fruit',
         s: 'Mashed banana + date (1) + small cup seasonal fruit',
         d: 'Soft dal + plain rice + roasted red capsicum' },
    link: 'https://sharan-india.org/recipes/indian-curries/jackfruit-sambar/' },
  ],

  // ── WEEK 2 ──────────────────────────────────────────────────────────────────
  [
  { day: 'Monday', dayShort: 'Mon',
    R: { b: 'Chilla (moong dal) + green chutney + salad', bJF: '1 tbsp JF powder in chilla batter',
         l: 'Mixed Vegetable Sabzi + 1 roti + large salad', lJF: 'JF in roti dough',
         s: 'Green smoothie + pear',
         d: 'Chettinad Curry + salad + 1 small roti', dJF: 'JF in roti dough' },
    D: { b: 'Chilla ×3 + peanut butter + banana + seeds powder',
         l: 'Mixed Vegetable Sabzi + 2 rotis + toor dal + roasted sesame',
         s: 'Ragi Porridge + banana + coconut flakes',
         d: 'Chettinad Curry + 1.5 cups brown rice + steamed broccoli' },
    S: { b: 'Moong Chilla (same base as family) + 3-egg scramble on the side',
         l: 'School tiffin: vegetable sabzi roti roll + fruit',
         s: 'Corn Bhel + fruit',
         d: 'Chettinad curry + rice + papad' },
    V: { b: 'Mini moong chilla + roasted yellow/red capsicum + marinara dip', bNote: 'Ladle V\'s chilla batter first, whisk 1 egg in — moong dal flavour masks egg. R & D batter stays egg-free.',
         l: 'Soft mixed veg mash + dal + rice + seasonal fruit',
         s: 'Soft ragi porridge (mild) + mashed banana',
         d: 'Mild chettinad (less spice) + rice + roasted capsicum' },
    link: 'https://sharan-india.org/recipes/breakfast/chilla-or-pudlas-or-pesarattu/' },

  { day: 'Tuesday', dayShort: 'Tue',
    R: { b: 'Savoury Bajra Sevai Upma + green chutney', bJF: '1 tbsp JF in upma mix',
         l: 'Dal Makhani (SHARAN oil-free) + 1 roti + salad', lJF: 'JF in roti dough',
         s: 'Sweet Potato Chaat + lime',
         d: 'Chana Palak + salad + 1 roti', dJF: 'JF in roti dough' },
    D: { b: 'Bajra Sevai Upma (large) + peanuts + coconut milk + banana',
         l: 'Dal Makhani + 2 rotis + steamed sweet potato',
         s: 'Sweet Potato Chaat + peanuts + coconut water',
         d: 'Chana Palak + 2 rotis + millet rice + hemp seeds' },
    S: { b: 'Bajra Sevai Upma (same base as family) + 3-egg scramble on the side',
         l: 'School tiffin: dal makhani + rice + fruit',
         s: 'Alu Tikki (SHARAN baked) + chutney',
         d: 'Chana palak + roti + rice' },
    V: { b: 'Soft bajra upma + mini besan chilla + roasted red/yellow capsicum + marinara dip', bNote: 'Whisk 1 egg into V\'s besan batter cup, cook mini chilla alongside upma. Marinara = her pizza pancake.',
         l: 'Soft rajma-dal mash + plain rice + mango',
         s: 'Soft steamed sweet potato + mashed banana',
         d: 'Soft chana mash + dal + rice + roasted red capsicum' },
    link: 'https://sharan-india.org/recipes/indian-curries/chana-palak/' },

  { day: 'Wednesday', dayShort: 'Wed',
    R: { b: 'Colourful Millet Upma + green chutney + fruit plate', bJF: '1 tbsp JF in upma',
         l: 'Dudhi Chana Subzi + 1 roti + large salad', lJF: 'JF in roti dough',
         s: 'Moong Chaat + lime + coriander',
         d: 'Cauliflower Masala + 1 roti + salad', dJF: 'JF in roti dough' },
    D: { b: 'Colourful Millet Upma (large) + avocado + banana',
         l: 'Dudhi Chana Subzi + 2 rotis + toor dal',
         s: 'Moong Chaat + roasted peanuts + coconut water',
         d: 'Cauliflower Masala + 2 rotis + dal + roasted peanuts' },
    S: { b: 'Colourful Millet Upma (same base as family) + 3-egg scramble on the side',
         l: 'School tiffin: dudhi chana + roti roll + fruit',
         s: 'Khaman Dhokla + green chutney',
         d: 'Cauliflower masala + rice + roti' },
    V: { b: 'Soft millet upma + mini besan chilla + roasted red/yellow capsicum + marinara dip', bNote: 'Whisk 1 egg into V\'s besan batter cup, cook mini chilla alongside upma. Marinara = her pizza pancake.',
         l: 'Soft dudhi-dal mash + rice + seasonal fruit',
         s: 'Soft steamed dhokla piece (mild) + banana',
         d: 'Soft cauliflower mash + dal + rice + seasonal fruit' },
    link: null },

  { day: 'Thursday', dayShort: 'Thu',
    R: { b: 'Red Rice Idli ×2 + sambar + tomato chutney', bJF: 'JF in idli batter',
         l: 'Methi Matar Malai (SHARAN oil-free) + 1 roti + salad', lJF: 'JF in roti dough',
         s: '10 almonds + guava',
         d: 'Bhindi Masala + 1 roti + salad', dJF: 'JF in roti dough' },
    D: { b: 'Red Rice Idli ×4 + sambar + coconut chutney + seeds powder',
         l: 'Methi Matar Malai + 2 rotis + steamed sweet potato',
         s: 'Overnight oats cup + dried figs + chia seeds',
         d: 'Bhindi Masala + 2 rotis + toor dal + sesame' },
    S: { b: 'Red Rice Idli (same base) + 3-egg masala scramble on the side',
         l: 'School tiffin: methi matar + roti + fruit',
         s: 'Frankie (whole wheat) + fruit',
         d: 'Bhindi masala + roti + rice' },
    V: { b: 'Soft idli ×2 + mini besan chilla + marinara dip + papaya', bNote: 'Idli is steamed so egg can\'t be added to batter — quick besan chilla (1 egg) alongside. Marinara = pizza pancake.',
         l: 'Soft peas-potato mash + dal + rice + mango',
         s: 'Mashed banana + date (1) + soft ragi biscuit (no sugar)',
         d: 'Plain dal + rice + roasted yellow capsicum + banana' },
    link: 'https://sharan-india.org/recipes/breakfast/red-rice-idli-or-dosa/' },

  { day: 'Friday', dayShort: 'Fri',
    R: { b: 'Cracked Wheat Porridge with Coconut Milk & Ginger', bJF: '1 tbsp JF in porridge',
         l: 'Chole + salad + 1 roti', lJF: 'JF in roti dough',
         s: 'Green smoothie + guava (with skin)',
         d: 'Ramen bowl: miso broth + tofu + bok choy + brown rice noodles + mushroom' },
    D: { b: 'Cracked Wheat Porridge (large) + banana + peanut butter + seeds',
         l: 'Chole + 1.5 cups brown rice + steamed broccoli + peanuts',
         s: 'Avocado Breakfast Superbowl (as snack)',
         d: 'Ramen bowl (large) + extra tofu + sesame + noodles' },
    S: { b: 'Cracked Wheat Porridge (same base) + 3-egg veggie scramble on the side',
         l: 'School tiffin: chole rice + papad + fruit',
         s: 'Garbanzo Waffles + fruit',
         d: 'Ramen bowl (same family meal)' },
    V: { b: 'Soft cracked wheat porridge + mini besan chilla + marinara dip + roasted capsicum', bNote: 'Whisk 1 egg into V\'s besan batter, cook mini chilla alongside. Coconut milk porridge + marinara chilla = toddler win.',
         l: 'Soft chole mash + plain rice + seasonal fruit',
         s: 'Soft banana pancake + seasonal fruit',
         d: 'Mild noodle broth + soft tofu + carrot + courgette (cut small)' },
    link: null },

  { day: 'Saturday', dayShort: 'Sat',
    R: { b: 'Fermented Rice Porridge (Kanji) + green chutney', bJF: '1 tbsp JF stirred in',
         l: 'Mixed Vegetable Undhiyo + 1 roti + salad', lJF: 'JF in roti dough',
         s: 'Grain Free Papdi Chaat',
         d: '🫓 DOSA NIGHT — Red Rice Dosa + sambar + tomato chutney + salad', dJF: 'JF in dosa batter' },
    D: { b: 'Kanji (large) + peanut butter + banana + seeds powder',
         l: 'Mixed Vegetable Undhiyo + 2 rotis + toor dal',
         s: 'Grain Free Papdi Chaat + coconut water + peanuts',
         d: '🫓 DOSA NIGHT — Red Rice Dosa ×3 + sambar + coconut chutney + avocado' },
    S: { b: 'Kanji (same base as family) + 3-egg scramble with spinach + mushroom on the side',
         l: 'Undhiyo + roti + rice',
         s: 'Whole Wheat Pizza (SHARAN) + fruit',
         d: '🫓 DOSA NIGHT — Red Rice Dosa ×2 + sambar + chutney' },
    V: { b: 'Soft kanji + mini besan chilla + roasted red/yellow capsicum + marinara dip', bNote: 'Whisk 1 egg into V\'s besan batter, cook mini chilla alongside kanji. Fermented kanji = probiotic benefit too.',
         l: 'Soft undhiyo vegetables mashed + dal + rice + seasonal fruit',
         s: 'Soft mashed banana + date + small roti piece with peanut butter',
         d: '🫓 DOSA NIGHT — Mini soft red rice dosa + thin sambar + papaya' },
    link: 'https://sharan-india.org/recipes/breakfast/red-rice-idli-or-dosa/' },

  { day: 'Sunday', dayShort: 'Sun',
    R: { b: 'Tropical Breakfast Parfait (Raw) + flaxseed water',
         l: 'Appam And Stew (SHARAN style) + salad',
         s: '10 walnuts + pear',
         d: 'Baingan Bharta + 1 roti + salad', dJF: 'JF in roti dough' },
    D: { b: 'Tropical Breakfast Parfait + seeds powder + banana + peanut butter',
         l: 'Appam And Stew + extra coconut milk + roasted peanuts',
         s: 'Soaked figs + almonds + flaxseed laddoo',
         d: 'Baingan Bharta + 2 rotis + dal + sesame seeds' },
    S: { b: '3-egg french toast (whole wheat, egg custard) + seasonal fruit',
         l: 'Appam + stew + rice',
         s: 'Corn Bhel + fruit',
         d: 'Baingan bharta + roti + dal + rice' },
    V: { b: 'Mini whole wheat french toast + mashed banana + marinara dip', bNote: 'V shares S\'s egg custard — bread soaks up egg, zero taste. Marinara dip on the side.',
         l: 'Soft appam + mild stew (veg) + seasonal fruit',
         s: 'Banana + soft date + seasonal fruit',
         d: 'Soft dal + rice + roasted red capsicum + banana' },
    link: null },
  ],

  // ── WEEK 3 ──────────────────────────────────────────────────────────────────
  [
  { day: 'Monday', dayShort: 'Mon',
    R: { b: 'Vegan Masala Omelette + green chutney + salad', bJF: '1 tbsp JF in batter',
         l: 'Chickpea Curry + 1 roti + large salad', lJF: 'JF in roti dough',
         s: 'Green smoothie + guava',
         d: 'Jackfruit Sambar + small millet rice + salad' },
    D: { b: 'Vegan Masala Omelette ×2 + whole wheat toast + avocado',
         l: 'Chickpea Curry + 2 rotis + steamed sweet potato + peanuts',
         s: 'Muesli (SHARAN) + plant milk + banana',
         d: 'Jackfruit Sambar + 1.5 cups millet rice + roasted peanuts' },
    S: { b: 'Vegan Masala Omelette (same base as family) + 3-egg masala scramble on the side',
         l: 'School tiffin: chickpea curry + roti + fruit',
         s: 'Dhokla Sandwich + fruit',
         d: 'Sambar rice + papad + salad' },
    V: { b: 'Mini vegan masala omelette (besan base) + roasted red/yellow capsicum + marinara dip', bNote: 'Vegan omelette is besan-based — whisk 1 egg into V\'s cup. Besan + spices mask egg taste completely.',
         l: 'Soft chickpea mash + dal + rice + seasonal fruit',
         s: 'Soft steamed dhokla (mild) + banana',
         d: 'Soft rice + thin sambar + seasonal fruit' },
    link: 'https://sharan-india.org/recipes/indian-curries/jackfruit-sambar/' },

  { day: 'Tuesday', dayShort: 'Tue',
    R: { b: 'Pumpkin Porridge + seeds powder', bJF: '1 tbsp JF in porridge',
         l: 'French Beans Tossed with Peanut and Coconut + 1 roti + salad', lJF: 'JF in roti dough',
         s: 'Moong Chaat + lime',
         d: 'Dal Fry (masoor) + 1 roti + large salad', dJF: 'JF in roti dough' },
    D: { b: 'Pumpkin Porridge (large) + banana + peanut butter + chia seeds',
         l: 'French Beans + Peanut Coconut + 2 rotis + toor dal',
         s: 'Moong Chaat + peanuts + coconut water',
         d: 'Dal Fry + 2 rotis + steamed sweet potato + hemp seeds' },
    S: { b: 'Pumpkin Porridge (same base) + 3-egg veggie scramble on the side',
         l: 'School tiffin: french beans + roti + fruit',
         s: 'Garbanzo Waffles + fruit',
         d: 'Dal fry + rice + roti + salad' },
    V: { b: 'Soft pumpkin porridge + mini besan chilla + marinara dip + mashed banana', bNote: 'Whisk 1 egg into V\'s besan batter, cook mini chilla alongside porridge. Pumpkin sweetness + marinara = toddler-friendly.',
         l: 'Soft french beans mash + coconut + dal + rice + mango',
         s: 'Soft banana + date + small peanut butter roti',
         d: 'Soft dal + rice + roasted red capsicum + banana' },
    link: 'https://sharan-india.org/recipes/indian-curries/masoor-dal/' },

  { day: 'Wednesday', dayShort: 'Wed',
    R: { b: 'Instant Millet Dosa + sambar + green chutney + salad', bJF: 'JF in dosa batter',
         l: 'Chickpea & Vegetable Kurma + 1 roti + salad', lJF: 'JF in roti dough',
         s: 'Sweet Potato Chaat',
         d: 'Brinjal and Drumstick Spicy Curry + 1 roti + salad', dJF: 'JF in roti dough' },
    D: { b: 'Millet Dosa ×3 + sambar + coconut chutney + avocado',
         l: 'Chickpea & Vegetable Kurma + 2 rotis + millet rice',
         s: 'Sweet Potato Chaat + peanuts + coconut water',
         d: 'Brinjal Drumstick Curry + 2 rotis + dal + roasted sesame' },
    S: { b: 'Millet Dosa (same base as family) + 3-egg scramble on the side',
         l: 'School tiffin: kurma + roti roll + fruit',
         s: 'Ameri Khaman + green chutney + fruit',
         d: 'Brinjal drumstick + roti + rice' },
    V: { b: 'Mini millet dosa + roasted red/yellow capsicum + marinara dip', bNote: 'Pour V\'s dosa batter first, whisk 1 egg in — make her dosas first. R & D batter stays egg-free.',
         l: 'Soft kurma vegetables + dal + rice + seasonal fruit',
         s: 'Soft steamed sweet potato + banana',
         d: 'Plain dal + rice + roasted yellow capsicum + seasonal fruit' },
    link: 'https://sharan-india.org/recipes/breakfast/red-rice-idli-or-dosa/' },

  { day: 'Thursday', dayShort: 'Thu',
    R: { b: 'Bread Upma + green chutney + fruit', bJF: '1 tbsp JF stirred into upma',
         l: 'Bhindi Kadhi + 1 roti + salad', lJF: 'JF in roti dough',
         s: '10 almonds + pear (with skin)',
         d: 'Mangalorean Soy Chunks Curry + 1 roti + salad', dJF: 'JF in roti dough' },
    D: { b: 'Bread Upma (large) + banana + peanut butter + seeds',
         l: 'Bhindi Kadhi + 2 rotis + toor dal + sweet potato',
         s: 'Overnight Oats cup + dried figs + banana',
         d: 'Mangalorean Soy Chunks Curry + 2 rotis + steamed broccoli' },
    S: { b: 'Bread Upma (same base as family) + 3-egg veggie scramble on the side',
         l: 'School tiffin: kadhi + rice + roti + fruit',
         s: 'Raw Banana Tikkis + chutney',
         d: 'Soy chunks curry + rice + roti' },
    V: { b: 'Soft bread upma + mini besan chilla + roasted red/yellow capsicum + marinara dip', bNote: 'Whisk 1 egg into V\'s besan batter, cook mini chilla alongside upma. Both ready in 8 min.',
         l: 'Soft plain dal + rice + roasted capsicum + banana',
         s: 'Soft mashed banana + date + small soft ragi pancake',
         d: 'Soft soy chunks (cut tiny) + rice + thin sambar + seasonal fruit' },
    link: 'https://sharan-india.org/recipes/indian-curries/bhindi-masala/' },

  { day: 'Friday', dayShort: 'Fri',
    R: { b: 'Red Rice Idli ×2 + sambar + green chutney', bJF: 'JF in idli batter',
         l: 'Delicious Kootu Curry + 1 roti + salad', lJF: 'JF in roti dough',
         s: 'Green smoothie + seasonal fruit',
         d: 'Ramen bowl: miso broth + tofu + bok choy + rice noodles + mushroom' },
    D: { b: 'Red Rice Idli ×4 + sambar + coconut chutney + seeds powder',
         l: 'Kootu Curry + 2 rotis + millet rice + peanuts',
         s: 'Ragi Porridge + coconut milk + banana + chia seeds',
         d: 'Ramen bowl (large) + extra tofu + extra noodles + sesame' },
    S: { b: 'Red Rice Idli (same base) + 3-egg veggie scramble on the side',
         l: 'School tiffin: kootu curry + rice + fruit',
         s: 'Masala Idli + fruit',
         d: 'Ramen bowl (same family)' },
    V: { b: 'Soft idli ×2 + mini besan chilla + marinara dip + papaya', bNote: 'Quick besan chilla (1 egg in batter) alongside the idli. Marinara = pizza pancake.',
         l: 'Soft kootu mash + rice + roasted capsicum + mango',
         s: 'Soft ragi porridge (mild) + mashed banana',
         d: 'Mild noodle broth + soft tofu + carrot (cut small)' },
    link: 'https://sharan-india.org/recipes/breakfast/red-rice-idli-or-dosa/' },

  { day: 'Saturday', dayShort: 'Sat',
    R: { b: 'Avocado Breakfast Superbowl + green smoothie',
         l: 'Chettinad Sorakkai Kurma + 1 roti + salad', lJF: 'JF in roti dough',
         s: 'Chickpea Masala Chaat',
         d: '🫓 DOSA NIGHT — Thalipeeth dosa + sambar + green chutney + salad', dJF: 'JF in thalipeeth batter' },
    D: { b: 'Avocado Breakfast Superbowl (large) + whole wheat toast + seeds powder',
         l: 'Chettinad Sorakkai Kurma + 2 rotis + toor dal',
         s: 'Chickpea Masala Chaat + peanuts + coconut water',
         d: '🫓 DOSA NIGHT — Thalipeeth ×3 + sambar + coconut chutney' },
    S: { b: 'Avocado Breakfast Superbowl (same base) + 3-egg veggie scramble on the side',
         l: 'Kurma + roti + rice',
         s: 'Vegan Banana Muffins + fruit',
         d: '🫓 DOSA NIGHT — Thalipeeth ×2 + sambar + chutney' },
    V: { b: 'Mashed avocado on small roti + mini besan chilla + marinara dip', bNote: 'Whisk 1 egg into V\'s besan batter, cook mini chilla alongside. Avocado on roti is her safe food — egg is in the chilla.',
         l: 'Soft kurma veg mash + rice + seasonal fruit',
         s: 'Banana muffin (half, no sugar — made with dates) + seasonal fruit',
         d: '🫓 DOSA NIGHT — Mini soft thalipeeth + thin sambar + mango' },
    link: 'https://sharan-india.org/recipes/indian-snacks/chickpea-masala-chaat/' },

  { day: 'Sunday', dayShort: 'Sun',
    R: { b: 'Fruit plate (papaya + pear + guava) + flaxseed water + green smoothie',
         l: 'Jackfruit Sambar + small millet rice + salad',
         s: '10 almonds + 2 dates',
         d: 'Dal Makhani (oil-free) + 1 roti + salad', dJF: 'JF in roti dough' },
    D: { b: 'Tofu Akuri (scrambled tofu) + whole wheat toast + banana',
         l: 'Jackfruit Sambar + 1.5 cups millet rice + tofu stir-fry',
         s: 'Soaked figs + almonds + ragi laddoo',
         d: 'Dal Makhani + 2 rotis + steamed sweet potato + hemp seeds' },
    S: { b: '3-egg akuri (Parsi scrambled egg, same spices as Dhara\'s tofu akuri) + toast + fruit',
         l: 'Sambar rice + papad + salad',
         s: 'Vegan Burger (SHARAN) + fruit',
         d: 'Dal makhani + roti + rice' },
    V: { b: 'Soft banana-oat pancake + roasted red/yellow capsicum + marinara dip', bNote: 'Whisk 1 egg into V\'s banana-oat batter — banana sweetness masks egg completely. R & D batter stays egg-free.',
         l: 'Soft rice + thin sambar + seasonal fruit',
         s: 'Soft banana + date (1) + small ragi pancake',
         d: 'Soft dal + plain rice + roasted red capsicum + banana' },
    link: 'https://sharan-india.org/recipes/indian-curries/jackfruit-sambar/' },
  ],

  // ── WEEK 4 ──────────────────────────────────────────────────────────────────
  [
  { day: 'Monday', dayShort: 'Mon',
    R: { b: 'Chilla (besan) + green chutney + salad', bJF: '1 tbsp JF in batter',
         l: 'Mixed Vegetable Makhanwala (SHARAN, oil-free) + 1 roti + salad', lJF: 'JF in roti dough',
         s: 'Moong Chaat + lime + coriander',
         d: 'Chole + salad + 1 roti', dJF: 'JF in roti dough' },
    D: { b: 'Besan Chilla ×3 + peanut butter + banana + coconut chutney',
         l: 'Mixed Veg Makhanwala + 2 rotis + steamed sweet potato',
         s: 'Moong Chaat + roasted peanuts + coconut water',
         d: 'Chole + 2 rotis + brown rice + roasted peanuts' },
    S: { b: 'Besan Chilla (same base as family) + 3-egg veggie scramble on the side',
         l: 'School tiffin: makhanwala + roti roll + fruit',
         s: 'Khaman Dhokla + chutney + fruit',
         d: 'Chole + roti + rice + salad' },
    V: { b: 'Mini besan chilla + roasted red/yellow capsicum + marinara dip', bNote: 'Ladle V\'s chilla batter, whisk 1 egg in — besan + spices mask egg taste completely. Marinara = pizza pancake.',
         l: 'Soft mixed veg mash + dal + rice + seasonal fruit',
         s: 'Soft steamed dhokla (mild) + banana',
         d: 'Soft chole mash + plain rice + roasted yellow capsicum' },
    link: 'https://sharan-india.org/recipes/breakfast/chilla-or-pudlas-or-pesarattu/' },

  { day: 'Tuesday', dayShort: 'Tue',
    R: { b: 'Overnight Oats + berries + seeds powder', bJF: 'JF stirred in night before',
         l: 'Bitter Gourd (Karela) and Potato Mash + 1 roti + salad', lJF: 'JF in roti dough',
         s: 'Green smoothie + pear (with skin)',
         d: 'Dudhi/Lauki Ki Sabzi + 1 roti + salad', dJF: 'JF in roti dough' },
    D: { b: 'Overnight Oats (large) + banana + peanut butter + dried figs + chia',
         l: 'Bitter Gourd Potato Mash + 2 rotis + toor dal + sweet potato',
         s: 'Creamy Oatmeal Porridge + banana + sunflower seeds',
         d: 'Dudhi Sabzi + 2 rotis + moong dal + roasted peanuts' },
    S: { b: 'Overnight Oats (same base) + 3-egg scramble with capsicum + spinach on the side',
         l: 'School tiffin: potato mash + roti (skip karela if disliked) + fruit',
         s: 'Adzuki Bean Burger (SHARAN) + fruit',
         d: 'Dudhi sabzi + roti + rice' },
    V: { b: 'Overnight Oats (small) + mini besan chilla + roasted red/yellow capsicum + marinara dip', bNote: 'Whisk 1 egg into V\'s besan batter, cook mini chilla alongside oats. Marinara = pizza pancake.',
         l: 'Soft potato mash + dal + rice + mango (skip bitter gourd)',
         s: 'Soft ragi porridge + mashed banana + roasted capsicum',
         d: 'Soft dudhi mash + dal + rice + seasonal fruit' },
    link: null },

  { day: 'Wednesday', dayShort: 'Wed',
    R: { b: 'Instant Millet Dosa + sambar + tomato chutney + salad', bJF: 'JF in dosa batter',
         l: 'Chana Palak + 1 roti + large salad', lJF: 'JF in roti dough',
         s: 'Chickpea Masala Chaat',
         d: 'Methi Palak Sweet Potato Sabzi + 1 roti + salad', dJF: 'JF in roti dough' },
    D: { b: 'Millet Dosa ×3 + sambar + coconut chutney + avocado + seeds',
         l: 'Chana Palak + 2 rotis + steamed sweet potato + peanuts',
         s: 'Chickpea Masala Chaat + coconut water + peanuts',
         d: 'Methi Palak Sweet Potato Sabzi + 2 rotis + toor dal + sesame' },
    S: { b: 'Millet Dosa (same base as family) + 3-egg scramble on the side',
         l: 'School tiffin: chana palak + roti + fruit',
         s: 'Quesadilla with Mushrooms (SHARAN) + fruit',
         d: 'Methi palak + roti + rice' },
    V: { b: 'Mini soft millet dosa + roasted red/yellow capsicum + marinara dip', bNote: 'Pour V\'s dosa batter first, whisk 1 egg in — make her dosas before R & D. Same batter, one extra step.',
         l: 'Soft chana mash + dal + rice + roasted capsicum',
         s: 'Soft banana + date + small soft roti piece',
         d: 'Soft sweet potato + plain dal + rice + seasonal fruit' },
    link: 'https://sharan-india.org/recipes/indian-curries/chana-palak/' },

  { day: 'Thursday', dayShort: 'Thu',
    R: { b: 'Ragi Porridge + seeds powder + banana', bJF: '1 tbsp JF in porridge',
         l: 'Bhindi Masala + 1 roti + large salad', lJF: 'JF in roti dough',
         s: '10 walnuts + guava',
         d: 'Chettinad Curry + 1 roti + salad', dJF: 'JF in roti dough' },
    D: { b: 'Ragi Porridge (large) + banana + peanut butter + coconut milk + dates',
         l: 'Bhindi Masala + 2 rotis + toor dal + sesame + sweet potato',
         s: 'Soaked almonds + dried apricots + flaxseed laddoo',
         d: 'Chettinad Curry + 1.5 cups brown rice + broccoli + peanuts' },
    S: { b: 'Ragi Porridge (same base) + 3-egg veggie scramble on the side',
         l: 'School tiffin: bhindi + roti roll + fruit',
         s: 'Healthy Non-Fried Batata Vada + chutney + fruit',
         d: 'Chettinad + rice + papad' },
    V: { b: 'Soft ragi porridge + mini besan chilla + roasted red/yellow capsicum + marinara dip', bNote: 'Whisk 1 egg into V\'s besan batter, cook mini chilla alongside porridge. Ragi calcium + egg protein = winner.',
         l: 'Plain dal + rice + roasted yellow capsicum + banana',
         s: 'Soft mashed banana + date + small peanut butter roti',
         d: 'Mild chettinad (less spice) + rice + roasted red capsicum' },
    link: 'https://sharan-india.org/recipes/indian-curries/bhindi-masala/' },

  { day: 'Friday', dayShort: 'Fri',
    R: { b: 'Red Rice Idli ×2 + sambar + green chutney + salad', bJF: 'JF in idli batter',
         l: 'Jackfruit Sambar + small millet rice + salad',
         s: 'Green smoothie + seasonal fruit',
         d: 'Ramen bowl: miso broth + tofu + bok choy + noodles + mushroom' },
    D: { b: 'Red Rice Idli ×4 + sambar + coconut chutney + avocado + seeds',
         l: 'Jackfruit Sambar + 1.5 cups millet rice + tofu toss + peanuts',
         s: 'Bhaidku (Spicy Porridge) + coconut milk',
         d: 'Ramen bowl (large) + extra noodles + tofu + sesame' },
    S: { b: 'Red Rice Idli (same base) + 3-egg masala scramble on the side',
         l: 'School tiffin: sambar rice + papad + fruit',
         s: 'Vegan Banana Muffins + fruit',
         d: 'Ramen bowl (same family)' },
    V: { b: 'Soft idli ×2 + mini besan chilla + marinara dip + papaya/mango', bNote: 'Quick besan chilla (1 egg in batter) alongside idli. Marinara = pizza pancake.',
         l: 'Soft rice + thin sambar + seasonal fruit',
         s: 'Banana muffin (half, date-sweetened) + seasonal fruit',
         d: 'Mild noodle broth + soft tofu + carrot strips + courgette' },
    link: 'https://sharan-india.org/recipes/indian-curries/jackfruit-sambar/' },

  { day: 'Saturday', dayShort: 'Sat',
    R: { b: 'Colourful Millet Upma + green chutney + fruit plate', bJF: 'JF in upma',
         l: 'Chickpea Curry + 1 roti + large salad', lJF: 'JF in roti dough',
         s: 'Grain Free Papdi Chaat',
         d: '🫓 DOSA NIGHT — Chilla dosa (besan) + sambar + green chutney + salad', dJF: 'JF in chilla batter' },
    D: { b: 'Colourful Millet Upma (large) + banana + peanut butter + seeds',
         l: 'Chickpea Curry + 2 rotis + dal + steamed sweet potato + peanuts',
         s: 'Grain Free Papdi Chaat + peanuts + coconut water',
         d: '🫓 DOSA NIGHT — Chilla ×3 + sambar + coconut chutney + avocado' },
    S: { b: 'Colourful Millet Upma (same base as family) + 3-egg scramble on the side',
         l: 'Chickpea curry + roti + rice',
         s: 'Quesadilla with Mushrooms (SHARAN) + fruit',
         d: '🫓 DOSA NIGHT — Chilla ×2 + sambar + chutney (fun variety!)' },
    V: { b: 'Soft millet upma + mini besan chilla + roasted red/yellow capsicum + marinara dip', bNote: 'Whisk 1 egg into V\'s besan batter, cook mini chilla alongside upma. Colourful upma + marinara pizza chilla = happy toddler.',
         l: 'Soft chickpea mash + dal + rice + seasonal fruit',
         s: 'Soft banana + date + peanut butter small roti',
         d: '🫓 DOSA NIGHT — Mini soft chilla + thin sambar + papaya' },
    link: 'https://sharan-india.org/recipes/breakfast/chilla-or-pudlas-or-pesarattu/' },

  { day: 'Sunday', dayShort: 'Sun',
    R: { b: 'Fruit plate (papaya + guava + pear) + green smoothie',
         l: 'Jackfruit Sambar + small millet rice + salad',
         s: '10 almonds + 2 dates',
         d: 'Dal Fry (masoor) + 1 roti + salad', dJF: 'JF powder stirred into dal' },
    D: { b: 'Tofu Scramble + whole wheat toast + avocado + hemp seeds + banana',
         l: 'Jackfruit Sambar + 1.5 cups millet rice + tofu stir-fry + peanuts',
         s: 'Soaked figs + almonds + ragi laddoo',
         d: 'Dal Fry + 2 rotis + sweet potato + hemp seeds + sesame' },
    S: { b: '3-egg akuri (Parsi scrambled egg, same spices as Dhara\'s tofu scramble) + toast + fruit',
         l: 'Sambar rice + papad + salad',
         s: 'Creamy Spinach And Corn Casserole (SHARAN) + fruit',
         d: 'Dal fry + roti + rice + salad' },
    V: { b: 'Mini whole wheat french toast + mashed banana + marinara dip', bNote: 'V shares S\'s egg custard — bread soaks up egg completely, zero taste. Marinara dip on the side.',
         l: 'Soft rice + thin sambar + mango',
         s: 'Soft spinach-corn casserole (small portion, mild) + banana', sNote: 'Hidden spinach + corn — nutrient dense, appealing to toddlers',
         d: 'Soft dal + plain rice + roasted red capsicum + banana' },
    link: 'https://sharan-india.org/recipes/indian-curries/jackfruit-sambar/' },
  ],
];

const GROCERY = {
  'Fruits (organic)': ['Bananas ×14','Papaya ×2','Guava ×6','Pears ×6','Apples ×6','Watermelon ×1 small','Lemon ×10','Avocado ×4','Berries (frozen) 250g'],
  'Vegetables': ['Spinach / palak 500g','Bok choy 250g','Broccoli 500g','Cauliflower ×1','Bhindi 300g','Tomatoes ×10','Cucumber ×8','Capsicum ×4','Mushrooms 300g','Sweet potato ×6','Onion 1kg','Garlic ×2 bulbs','Ginger ×1 piece','Methi leaves 200g','Coriander 2 bunches','Carrot ×6','Jackfruit (raw, for Sunday sambar) ×1 small'],
  'Grains & millets': ['Millet (bajra/jowar) 1kg','Ragi flour 500g','Brown rice 1kg','Whole wheat flour 1kg','Red rice 500g','Oats (rolled) 500g','Brown rice noodles 200g'],
  'Legumes & pulses': ['Masoor dal 500g','Moong dal 500g','Chana (chickpeas) 500g','Rajma 500g','Toor dal 500g','Moong sprouts 300g'],
  'Nuts & seeds': ['Almonds 200g','Walnuts 150g','Peanuts (raw) 500g','Flaxseed (whole) 200g','Sesame seeds 200g','Chia seeds 100g','Hemp seeds 100g','Dried figs 150g','Dates 200g','Dry apricots 100g'],
  'Proteins': ['Tofu (firm) ×3 packs (400g each)','Tempeh ×1 pack (optional)'],
  'Pantry': ['Miso paste 200g','Tamarind paste 100g','Coconut (grated fresh or frozen) 200g','Whole grain bread (or homemade)','Almond / peanut butter 200g','Mustard seeds','Cumin seeds','Turmeric','Coriander powder','Green chillies ×10'],
  '🌿 Jackfruit powder — Ritvij only': ['Green jackfruit powder 200g (1 tbsp/day in food, ~3-week supply)'],
  'Supplements (both)': ['Methylcobalamin B12 — Nurokind or Methycobal','Cholecalciferol 60K Vitamin D'],
};

// ─── API (logs — shared via SQLite on server) ──────────────────────────────

async function fetchLogs() {
  const res = await fetch('/api/logs');
  if (!res.ok) throw new Error('Failed to load logs');
  return res.json();
}

async function postLog(entry) {
  const res = await fetch('/api/logs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(entry),
  });
  if (!res.ok) throw new Error('Failed to save log');
  return res.json();
}

// ─── DB (IndexedDB — grocery & prefs only) ─────────────────────────────────

let db;
const DB_NAME = 'FamilyHealth', DB_VER = 1;

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VER);
    req.onupgradeneeded = e => {
      const d = e.target.result;
      if (!d.objectStoreNames.contains('logs')) {
        const s = d.createObjectStore('logs', { keyPath: 'id', autoIncrement: true });
        s.createIndex('person_date', ['person','date'], { unique: false });
      }
      if (!d.objectStoreNames.contains('grocery')) {
        d.createObjectStore('grocery', { keyPath: 'key' });
      }
      if (!d.objectStoreNames.contains('prefs')) {
        d.createObjectStore('prefs', { keyPath: 'key' });
      }
    };
    req.onsuccess = e => { db = e.target.result; resolve(db); };
    req.onerror = () => reject(req.error);
  });
}

function dbPut(store, obj) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, 'readwrite');
    const req = tx.objectStore(store).put(obj);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function dbGetAll(store) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, 'readonly');
    const req = tx.objectStore(store).getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function dbGet(store, key) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, 'readonly');
    const req = tx.objectStore(store).get(key);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

// ─── STATE ─────────────────────────────────────────────────────────────────

let activePerson = 'R';
let energyLevel = 0;
let allLogs = [];
let groceryState = {};
let chartR = null, chartD = null;

// ─── INIT ──────────────────────────────────────────────────────────────────

async function init() {
  try {
    await openDB();

    // Check first launch
    const launched = await dbGet('prefs', 'launched');
    if (!launched) {
      document.getElementById('onboarding').style.display = 'flex';
      await dbPut('prefs', { key: 'launched', val: true });
    }

    // Set today's date
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('log-date').value = today;

    // Load data
    allLogs = await fetchLogs();
    const grocItems = await dbGetAll('grocery');
    grocItems.forEach(i => { groceryState[i.key] = i.checked; });

    // Header date
    const dayNames = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
    const now = new Date();
    document.getElementById('header-sub').textContent = `${dayNames[now.getDay()]}, ${now.getDate()} ${now.toLocaleString('en-IN',{month:'long'})}`;

    // Build screens
    buildMealTabs();
    buildGrocery();
    updateWeightCards();
    buildMedList();
    buildJFReminder();

    renderProgress();
    initPush();
  } catch (err) {
    console.error('Init error:', err);
  } finally {
    // Always dismiss loading splash, even if something fails
    const loader = document.getElementById('loading');
    if (loader) {
      loader.classList.add('out');
      setTimeout(() => loader.remove(), 380);
    }
  }
}

function closeOnboarding() {
  document.getElementById('onboarding').style.display = 'none';
}

// ─── NAVIGATION ────────────────────────────────────────────────────────────

function showScreen(name) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.getElementById('screen-' + name).classList.add('active');
  document.getElementById('tab-' + name).classList.add('active');

  const titles = { today: 'Today', meals: 'Weekly meal plan', progress: 'Progress', grocery: 'Grocery list', prep: 'Meal prep guide' };
  document.getElementById('header-title').textContent = titles[name];

  if (name === 'progress') renderProgress();
  if (name === 'prep') buildPrepScreen();
}

function setPerson(p) {
  activePerson = p;
  document.getElementById('ptog-r').classList.toggle('active', p === 'R');
  document.getElementById('ptog-d').classList.toggle('active', p === 'D');
  document.getElementById('active-person-label').textContent = PEOPLE[p].name;
  document.getElementById('save-btn').className = 'btn btn-primary' + (p === 'D' ? ' d' : '');
  buildMedList();
  // Reset energy
  energyLevel = 0;
  [1,2,3,4].forEach(i => document.getElementById('en'+i).classList.remove('active'));
}

function setEnergy(n) {
  energyLevel = n;
  [1,2,3,4].forEach(i => document.getElementById('en'+i).classList.toggle('active', i === n));
}

// ─── LOGGING ───────────────────────────────────────────────────────────────

async function saveLog() {
  const date = document.getElementById('log-date').value;
  const weight = parseFloat(document.getElementById('log-weight').value) || null;
  const sleep = parseFloat(document.getElementById('log-sleep').value) || null;
  const meals = document.getElementById('log-meals').value.trim();
  const eLabels = ['','Low','OK','Good','Great'];

  const entry = { person: activePerson, date, weight, sleep, energy: eLabels[energyLevel] || '', meals, ts: Date.now() };
  await postLog(entry);
  allLogs = await fetchLogs();

  // Reset form
  document.getElementById('log-weight').value = '';
  document.getElementById('log-sleep').value = '';
  document.getElementById('log-meals').value = '';
  energyLevel = 0;
  [1,2,3,4].forEach(i => document.getElementById('en'+i).classList.remove('active'));
  document.querySelectorAll('.check-circle').forEach(c => c.classList.remove('done'));

  updateWeightCards();
  showToast(`${PEOPLE[activePerson].name}'s entry saved ✓`);
}

function showToast(msg) {
  const t = document.createElement('div');
  t.style.cssText = 'position:fixed;bottom:80px;left:50%;transform:translateX(-50%);background:#1a1a1a;color:#fff;padding:10px 20px;border-radius:20px;font-size:14px;z-index:9999;pointer-events:none';
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 2200);
}

// ─── WEIGHT CARDS ──────────────────────────────────────────────────────────

function updateWeightCards() {
  ['R','D'].forEach(p => {
    const logs = allLogs.filter(l => l.person === p && l.weight).sort((a,b) => b.date.localeCompare(a.date));
    const last = logs[0];
    const { startWeight, targetWeight } = PEOPLE[p];
    const isLoss = p === 'R';

    const el = document.getElementById('last-weight-' + p);
    const sub = document.getElementById('weight-sub-' + p);
    const prog = document.getElementById('prog-' + p.toLowerCase());

    if (!last) {
      el.textContent = '—';
      sub.textContent = `Target: ${targetWeight} kg`;
      if (prog) prog.style.width = '0%';
      return;
    }

    el.textContent = last.weight.toFixed(1);

    const totalChange = Math.abs(startWeight - targetWeight);
    const achieved = isLoss ? (startWeight - last.weight) : (last.weight - startWeight);
    const pct = Math.max(0, Math.min(100, (achieved / totalChange) * 100));
    if (prog) prog.style.width = Math.round(pct) + '%';

    const remaining = Math.abs(last.weight - targetWeight).toFixed(1);
    const prev = logs[1];
    let weekDiff = '';
    if (prev) {
      const diff = (last.weight - prev.weight).toFixed(1);
      const arrow = diff > 0 ? '↑' : '↓';
      weekDiff = ` · ${arrow}${Math.abs(diff)} recent`;
    }
    sub.textContent = `Target: ${targetWeight} kg · ${remaining} to go${weekDiff}`;
  });
}

// ─── MEAL PLAN ─────────────────────────────────────────────────────────────

let activeWeekIdx = 0;
let activeDayIdx = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1;
let activePrepWeekIdx = 0;

function buildMealTabs() {
  // Week tabs
  const weekTabs = document.getElementById('week-tabs');
  weekTabs.innerHTML = '';
  ['Week 1','Week 2','Week 3','Week 4'].forEach((label, wi) => {
    const btn = document.createElement('button');
    btn.className = 'inner-tab' + (wi === activeWeekIdx ? ' active' : '');
    btn.textContent = label;
    btn.onclick = () => {
      activeWeekIdx = wi;
      weekTabs.querySelectorAll('.inner-tab').forEach((b,j) => b.classList.toggle('active', j===wi));
      renderMealDay();
    };
    weekTabs.appendChild(btn);
  });

  // Day tabs
  const dayTabs = document.getElementById('day-tabs');
  dayTabs.innerHTML = '';
  MEAL_PLAN[0].forEach((day, di) => {
    const btn = document.createElement('button');
    btn.className = 'inner-tab' + (di === activeDayIdx ? ' active' : '');
    btn.textContent = day.dayShort;
    btn.onclick = () => {
      activeDayIdx = di;
      dayTabs.querySelectorAll('.inner-tab').forEach((b,j) => b.classList.toggle('active', j===di));
      renderMealDay();
    };
    dayTabs.appendChild(btn);
  });

  renderMealDay();
}

function renderMealDay() {
  const day = MEAL_PLAN[activeWeekIdx][activeDayIdx];
  const c = document.getElementById('meal-content');
  c.innerHTML = '';

  const dayHeader = document.createElement('div');
  dayHeader.style.cssText = 'font-size:17px;font-weight:600;margin-bottom:12px;color:var(--text)';
  dayHeader.textContent = day.day;
  c.appendChild(dayHeader);

  const slots = [
    { key: 'b', label: 'Breakfast' },
    { key: 'l', label: 'Lunch' },
    { key: 's', label: 'Snack' },
    { key: 'd', label: 'Dinner' },
  ];

  slots.forEach(slot => {
    const card = document.createElement('div');
    card.className = 'card';
    card.style.marginBottom = '10px';

    const slotLabel = document.createElement('div');
    slotLabel.className = 'meal-slot';
    slotLabel.textContent = slot.label;
    card.appendChild(slotLabel);

    ['R','D','S','V'].forEach(p => {
      const meal = day[p] && day[p][slot.key];
      if (!meal) return;
      const jf   = day[p][slot.key + 'JF'];
      const note = day[p][slot.key + 'Note'];

      const mp = document.createElement('div');
      mp.className = 'meal-person';
      mp.style.borderLeft = `3px solid ${PEOPLE[p].color}`;
      mp.style.borderRadius = '0 8px 8px 0';

      mp.innerHTML = `<span class="badge badge-${p.toLowerCase()}">${PEOPLE[p].name}</span>
        <div class="meal-text" style="margin-top:5px">${meal}</div>
        ${jf   ? `<div class="jf-note">🌿 ${jf}</div>` : ''}
        ${note ? `<div class="vasu-note">💡 ${note}</div>` : ''}`;
      card.appendChild(mp);
    });

    c.appendChild(card);
  });

  if (day.link) {
    const lnk = document.createElement('a');
    lnk.href = day.link;
    lnk.target = '_blank';
    lnk.style.cssText = 'font-size:12px;color:var(--teal);display:inline-block;margin-top:4px';
    lnk.textContent = 'SHARAN recipe ↗';
    c.appendChild(lnk);
  }
}

// ─── JF REMINDER ──────────────────────────────────────────────────────────

function buildJFReminder() {
  const dayIdx = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1;
  const day = MEAL_PLAN[activeWeekIdx][dayIdx];
  const jfMeals = [];
  ['b','l','d'].forEach(k => { if (day.R[k+'JF']) jfMeals.push(day.R[k+'JF']); });

  const banner = document.getElementById('jf-reminder');
  if (jfMeals.length) {
    banner.style.display = 'block';
    banner.innerHTML = `<strong>🌿 Cook reminder for today:</strong><br>${jfMeals.join('<br>')}`;
  } else {
    banner.style.display = 'none';
  }
}

// ─── SUPPLEMENTS ──────────────────────────────────────────────────────────

function buildMedList() {
  const c = document.getElementById('med-list');
  c.innerHTML = '';
  const today = new Date().getDay();
  const meds = MEDS[activePerson];

  meds.forEach((med, i) => {
    const isDueToday = med.days.includes(today);
    const row = document.createElement('div');
    row.className = 'check-row';
    row.innerHTML = `
      <div class="check-info">
        <div class="check-name">${med.name}</div>
        <div class="check-freq">${med.freq}${isDueToday ? ' · <strong style="color:var(--coral)">due today</strong>' : ''}</div>
      </div>
      <div class="check-circle" onclick="this.classList.toggle('done')" title="Mark taken">✓</div>`;
    c.appendChild(row);
  });
}

// ─── PROGRESS ─────────────────────────────────────────────────────────────

function renderProgress() {
  ['R','D'].forEach(p => {
    const logs = allLogs.filter(l => l.person === p && l.weight).sort((a,b) => a.date.localeCompare(b.date));
    const labels = logs.map(l => l.date.slice(5)); // MM-DD
    const data = logs.map(l => parseFloat(l.weight.toFixed(1)));
    const color = PEOPLE[p].color;
    const canvasId = 'chart-' + p.toLowerCase();
    const statsId = p.toLowerCase() + '-stats';

    const existingChart = p === 'R' ? chartR : chartD;
    if (existingChart) existingChart.destroy();

    if (data.length < 2) {
      document.getElementById(statsId).textContent = 'Log at least 2 entries to see a chart.';
      return;
    }

    const ctx = document.getElementById(canvasId).getContext('2d');
    const newChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: PEOPLE[p].name,
          data,
          borderColor: color,
          backgroundColor: color + '22',
          fill: true,
          tension: 0.3,
          pointRadius: 3,
          pointBackgroundColor: color,
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: { ticks: { callback: v => v.toFixed(1) + ' kg', font: { size: 11 } }, grid: { color: 'rgba(0,0,0,0.06)' } },
          x: { ticks: { font: { size: 10 }, maxRotation: 45, autoSkip: true, maxTicksLimit: 8 }, grid: { display: false } }
        }
      }
    });

    if (p === 'R') chartR = newChart; else chartD = newChart;

    const first = data[0], last = data[data.length - 1];
    const diff = (last - first).toFixed(1);
    const sign = diff > 0 ? '+' : '';
    document.getElementById(statsId).textContent = `${data.length} entries · ${first} → ${last} kg (${sign}${diff} kg total)`;
  });

  // Blood test targets
  ['R','D'].forEach(p => {
    const bt = BLOOD_TARGETS[p];
    const el = document.getElementById('blood-targets-' + p.toLowerCase());
    if (!el) return;
    el.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
        <span class="badge badge-${p.toLowerCase()}">${bt.label}</span>
        <span style="font-size:11px;color:var(--text-muted)">Next test: ${bt.nextTest}</span>
      </div>
      <table style="width:100%;border-collapse:collapse;font-size:12px">
        <thead>
          <tr style="color:var(--text-muted);text-align:left;border-bottom:1px solid var(--border)">
            <th style="padding:4px 0;font-weight:500">Marker</th>
            <th style="padding:4px 0;text-align:right;font-weight:500">Current</th>
            <th style="padding:4px 0;text-align:right;font-weight:500">Target</th>
          </tr>
        </thead>
        <tbody>
          ${bt.markers.map(m => `
            <tr style="border-bottom:0.5px solid var(--border)">
              <td style="padding:6px 0;color:var(--text)">${m.name}</td>
              <td style="padding:6px 0;text-align:right;color:${m.ok ? 'var(--teal)' : 'var(--coral)'}">
                ${m.current}${m.unit ? ' ' + m.unit : ''}
              </td>
              <td style="padding:6px 0;text-align:right;color:var(--text-muted)">${m.target}${m.unit ? ' ' + m.unit : ''}</td>
            </tr>`).join('')}
        </tbody>
      </table>`;
  });

  // Sleep & energy log
  const sleepEl = document.getElementById('sleep-log');
  const recent = [...allLogs].sort((a,b) => b.date.localeCompare(a.date)).slice(0,10);
  if (!recent.length) {
    sleepEl.innerHTML = '<div class="empty">No logs yet</div>';
  } else {
    sleepEl.innerHTML = recent.map(l => {
      const p = PEOPLE[l.person];
      return `<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:0.5px solid var(--border)">
        <div>
          <span class="badge badge-${l.person.toLowerCase()}" style="margin-right:6px">${p.name}</span>
          <span style="font-size:13px;color:var(--text-muted)">${l.date}</span>
        </div>
        <div style="text-align:right;font-size:13px">
          ${l.sleep ? `💤 ${l.sleep}h` : ''}
          ${l.energy ? `&nbsp; ⚡ ${l.energy}` : ''}
        </div>
      </div>`;
    }).join('');
  }

  // History
  const histEl = document.getElementById('log-history');
  const hist = [...allLogs].sort((a,b) => b.date.localeCompare(a.date)).slice(0,20);
  if (!hist.length) {
    histEl.innerHTML = '<div class="empty">No entries yet — start logging from the Today tab.</div>';
    return;
  }
  histEl.innerHTML = hist.map(l => `
    <div class="log-entry">
      <div class="log-meta">
        <span class="log-date">${l.date}</span>
        <span class="badge badge-${l.person.toLowerCase()}">${PEOPLE[l.person].name}</span>
        ${l.weight ? `<span class="log-stat">⚖ ${l.weight} kg</span>` : ''}
        ${l.sleep ? `<span class="log-stat">💤 ${l.sleep} hrs</span>` : ''}
        ${l.energy ? `<span class="log-stat">⚡ ${l.energy}</span>` : ''}
      </div>
      ${l.meals ? `<div class="log-meals">${l.meals}</div>` : ''}
    </div>`).join('');
}

// ─── MEAL PREP ────────────────────────────────────────────────────────────

function buildPrepScreen() {
  // Week tabs
  const weekTabs = document.getElementById('prep-week-tabs');
  weekTabs.innerHTML = '';
  ['Week 1','Week 2','Week 3','Week 4'].forEach((label, wi) => {
    const btn = document.createElement('button');
    btn.className = 'inner-tab' + (wi === activePrepWeekIdx ? ' active' : '');
    btn.textContent = label;
    btn.onclick = () => {
      activePrepWeekIdx = wi;
      weekTabs.querySelectorAll('.inner-tab').forEach((b,j) => b.classList.toggle('active', j === wi));
      renderPrepContent();
    };
    weekTabs.appendChild(btn);
  });
  renderPrepContent();
}

function renderPrepContent() {
  const c = document.getElementById('prep-content');
  c.innerHTML = '';

  // ── Batch prep checklist ──
  PREP_TASKS.forEach((section, si) => {
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `<div class="card-title">${section.emoji} ${section.section}</div>`;
    section.tasks.forEach((task, ti) => {
      const id = `prep-${si}-${ti}`;
      const row = document.createElement('div');
      row.className = 'check-row';
      row.innerHTML = `
        <div class="check-info"><div class="check-name" style="font-size:13px;line-height:1.4">${task}</div></div>
        <div class="check-circle" id="${id}" onclick="this.classList.toggle('done')" title="Done">✓</div>`;
      card.appendChild(row);
    });
    c.appendChild(card);
  });

  // ── This week's meals ──
  const weekCard = document.createElement('div');
  weekCard.className = 'card';
  weekCard.innerHTML = '<div class="card-title">📋 This week\'s meals</div>';
  const week = MEAL_PLAN[activePrepWeekIdx];
  const table = document.createElement('table');
  table.style.cssText = 'width:100%;border-collapse:collapse;font-size:12px';
  table.innerHTML = `<thead><tr style="color:var(--text-muted);border-bottom:1px solid var(--border)">
    <th style="text-align:left;padding:4px 0;font-weight:500">Day</th>
    <th style="text-align:left;padding:4px 6px;font-weight:500">Lunch</th>
    <th style="text-align:left;padding:4px 0;font-weight:500">Dinner</th>
  </tr></thead>`;
  const tbody = document.createElement('tbody');
  week.forEach(day => {
    const tr = document.createElement('tr');
    tr.style.borderBottom = '0.5px solid var(--border)';
    tr.innerHTML = `
      <td style="padding:6px 0;color:var(--text-muted);white-space:nowrap;font-weight:500">${day.dayShort}</td>
      <td style="padding:6px 6px;color:var(--text)">${day.R.l}</td>
      <td style="padding:6px 0;color:var(--text)">${day.R.d}</td>`;
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);
  weekCard.appendChild(table);
  c.appendChild(weekCard);

  // ── Cook rules ──
  const rulesCard = document.createElement('div');
  rulesCard.className = 'card';
  rulesCard.innerHTML = '<div class="card-title">⚠️ Key rules — always</div>';
  COOK_RULES.forEach(r => {
    const row = document.createElement('div');
    row.style.cssText = 'padding:8px 0;border-bottom:0.5px solid var(--border);font-size:13px';
    row.innerHTML = `<strong>${r.rule}</strong><br><span style="color:var(--text-muted);line-height:1.5">${r.detail}</span>`;
    rulesCard.appendChild(row);
  });
  c.appendChild(rulesCard);
}

function copyPrepGuide(btn) {
  const week = MEAL_PLAN[activePrepWeekIdx];
  const weekLabel = `Week ${activePrepWeekIdx + 1}`;
  let text = `*Cook Prep Guide — ${weekLabel}*\n_For Babli Aunty_\n\n`;

  PREP_TASKS.forEach(section => {
    text += `*${section.emoji} ${section.section.toUpperCase()}*\n`;
    section.tasks.forEach(t => { text += `☐ ${t}\n`; });
    text += '\n';
  });

  text += `*📋 THIS WEEK'S MEALS*\n`;
  week.forEach(day => { text += `${day.day}: L — ${day.R.l} | D — ${day.R.d}\n`; });
  text += '\n';

  text += `*⚠️ KEY RULES*\n`;
  COOK_RULES.forEach(r => { text += `${r.rule}: ${r.detail}\n`; });

  const confirm = () => {
    const orig = btn.textContent;
    btn.textContent = 'Copied!';
    setTimeout(() => { btn.textContent = orig; }, 2000);
  };
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(confirm).catch(() => fallbackCopy(text, confirm));
  } else {
    fallbackCopy(text, confirm);
  }
}

// ─── PUSH NOTIFICATIONS & REMINDERS ──────────────────────────────────────

async function initPush() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;

  const reg = await navigator.serviceWorker.ready;

  // Show enable button if not yet granted
  if (Notification.permission === 'default') {
    document.getElementById('notif-enable-btn').style.display = 'block';
  }

  if (Notification.permission !== 'granted') return;

  // Already granted — subscribe silently
  await subscribePush(reg);
}

async function requestNotifPermission() {
  const permission = await Notification.requestPermission();
  if (permission === 'granted') {
    document.getElementById('notif-enable-btn').style.display = 'none';
    const reg = await navigator.serviceWorker.ready;
    await subscribePush(reg);
    loadReminders();
    showToast('Notifications enabled ✓');
  }
}

async function subscribePush(reg) {
  try {
    const { publicKey } = await fetch('/api/vapid-key').then(r => r.json());
    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    });
    await fetch('/api/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sub),
    });
  } catch (e) {
    console.warn('Push subscription failed:', e);
  }
}

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64  = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw     = atob(base64);
  return Uint8Array.from([...raw].map(c => c.charCodeAt(0)));
}

function openReminders() {
  document.getElementById('reminder-backdrop').classList.add('open');
  document.getElementById('reminder-sheet').classList.add('open');
  loadReminders();
}

function closeReminders() {
  document.getElementById('reminder-backdrop').classList.remove('open');
  document.getElementById('reminder-sheet').classList.remove('open');
}

const DAY_NAMES = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

async function loadReminders() {
  const reminders = await fetch('/api/reminders').then(r => r.json());
  const list = document.getElementById('reminder-list');
  list.innerHTML = '';

  // Show enable button state
  const enableBtn = document.getElementById('notif-enable-btn');
  enableBtn.style.display = Notification.permission === 'default' ? 'block' : 'none';

  if (Notification.permission === 'denied') {
    list.innerHTML = '<div style="color:var(--text-muted);font-size:13px;padding:12px 0">Notifications are blocked. Enable them in your browser/phone settings, then reopen this app.</div>';
    return;
  }

  reminders.forEach(r => {
    const days = JSON.parse(r.days);
    const dayLabel = days.length === 7 ? 'Every day' :
                     days.length === 0 ? 'Off' :
                     days.map(d => DAY_NAMES[d]).join(', ');

    const row = document.createElement('div');
    row.className = 'reminder-row';
    row.innerHTML = `
      <div class="reminder-info">
        <div class="reminder-label">${r.label}</div>
        <div class="reminder-meta">${dayLabel}${days.length ? ' · ' + r.time : ''}</div>
      </div>
      ${days.length ? `<input type="time" class="reminder-time" value="${r.time}" onchange="updateReminderTime('${r.id}', this.value)">` : ''}
      <label class="toggle">
        <input type="checkbox" ${r.enabled ? 'checked' : ''} onchange="toggleReminder('${r.id}', this.checked)">
        <div class="toggle-track"></div>
        <div class="toggle-thumb"></div>
      </label>`;
    list.appendChild(row);
  });
}

async function toggleReminder(id, enabled) {
  await fetch(`/api/reminders/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ enabled: enabled ? 1 : 0 }),
  });
}

async function updateReminderTime(id, time) {
  await fetch(`/api/reminders/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ time }),
  });
  showToast('Reminder time updated ✓');
}

// ─── GROCERY ──────────────────────────────────────────────────────────────

function buildGrocery() {
  const c = document.getElementById('grocery-content');
  c.innerHTML = '';
  Object.entries(GROCERY).forEach(([cat, items]) => {
    const title = document.createElement('div');
    title.className = 'grocery-cat-title';
    title.textContent = cat;
    c.appendChild(title);

    items.forEach(item => {
      const key = cat + ':' + item;
      const el = document.createElement('label');
      el.className = 'grocery-item' + (groceryState[key] ? ' checked' : '');
      el.innerHTML = `<input type="checkbox" ${groceryState[key] ? 'checked' : ''} onchange="toggleGrocery('${CSS.escape(key)}', this.checked, this.closest('label'))"> <span>${item}</span>`;
      c.appendChild(el);
    });
  });
}

async function toggleGrocery(key, checked, el) {
  groceryState[key] = checked;
  el.classList.toggle('checked', checked);
  await dbPut('grocery', { key, checked });
}

function copyGroceryList(btn) {
  const lines = [];
  Object.entries(GROCERY).forEach(([cat, items]) => {
    const unchecked = items.filter(item => !groceryState[cat + ':' + item]);
    if (unchecked.length) {
      lines.push(cat);
      unchecked.forEach(item => lines.push('• ' + item));
      lines.push('');
    }
  });
  const text = lines.join('\n').trim();

  const confirm = () => {
    const orig = btn.textContent;
    btn.textContent = 'Copied!';
    setTimeout(() => { btn.textContent = orig; }, 2000);
  };

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(confirm).catch(() => fallbackCopy(text, confirm));
  } else {
    fallbackCopy(text, confirm);
  }
}

function fallbackCopy(text, onSuccess) {
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.cssText = 'position:fixed;top:-9999px;left:-9999px;opacity:0';
  document.body.appendChild(ta);
  ta.focus();
  ta.select();
  try {
    document.execCommand('copy');
    onSuccess();
  } catch (e) {
    alert('Could not copy. Please copy manually:\n\n' + text);
  }
  document.body.removeChild(ta);
}

async function resetGrocery() {
  groceryState = {};
  await openDB();
  const tx = db.transaction('grocery', 'readwrite');
  tx.objectStore('grocery').clear();
  buildGrocery();
}

// ─── START ─────────────────────────────────────────────────────────────────

init().catch(console.error);

// ─── PULL TO REFRESH ───────────────────────────────────────────────────────

(function () {
  let startY = 0, pulling = false;

  const indicator = document.createElement('div');
  indicator.style.cssText = [
    'position:fixed', 'top:0', 'left:50%', 'transform:translateX(-50%) translateY(-60px)',
    'background:#1D9E75', 'color:white', 'padding:8px 20px', 'border-radius:0 0 20px 20px',
    'font-size:13px', 'font-weight:600', 'z-index:9000',
    'transition:transform 0.2s ease', 'pointer-events:none',
  ].join(';');
  indicator.textContent = '↓ Pull to refresh';
  document.body.appendChild(indicator);

  const container = document.getElementById('screen-container');

  container.addEventListener('touchstart', e => {
    const active = document.querySelector('.screen.active');
    if (active && active.scrollTop === 0) {
      startY = e.touches[0].clientY;
      pulling = true;
    }
  }, { passive: true });

  container.addEventListener('touchmove', e => {
    if (!pulling) return;
    const dist = e.touches[0].clientY - startY;
    if (dist > 10) {
      const pct = Math.min(dist / 90, 1);
      indicator.style.transform = `translateX(-50%) translateY(${-60 + pct * 60}px)`;
      indicator.textContent = pct >= 1 ? '↑ Release to refresh' : '↓ Pull to refresh';
    }
  }, { passive: true });

  container.addEventListener('touchend', e => {
    if (!pulling) return;
    pulling = false;
    const dist = e.changedTouches[0].clientY - startY;
    indicator.style.transform = 'translateX(-50%) translateY(-60px)';
    indicator.textContent = '↓ Pull to refresh';
    if (dist >= 90) window.location.reload();
  }, { passive: true });
}());
