# Family Health Tracker

Daily tracker for Ritvij & Dhara — weight, sleep, energy, meals, supplements, meal plan, grocery list.

## Features
- 📋 **Today tab** — log weight, sleep, energy, meals for R or D separately
- 🥗 **Meals tab** — full weekly WFPB meal plan with JF powder reminders built in
- 📈 **Progress tab** — weight trend charts + history log for both
- 🛒 **Grocery tab** — interactive checklist, persists across sessions
- 💊 Supplement reminders (B12, Vit D) — shows if due today
- 🌿 Jackfruit powder reminders built into each day's meals
- 📱 Installs as a home screen app (PWA) — works offline

## Storage
All data stored locally on the device using **IndexedDB** — nothing leaves your phone.

## Setup (one time — ~2 minutes)

```bash
cd family-health-tracker
npm install
npm start
```

Then open **http://localhost:3000** in Chrome on your phone (or computer).

## Install on phone (recommended)

**iPhone (Safari):**
1. Open http://localhost:3000 in Safari
2. Tap the Share button → "Add to Home Screen"
3. App icon appears — tap it to open like a native app

**Android (Chrome):**
1. Open http://localhost:3000 in Chrome
2. Tap the 3-dot menu → "Add to Home Screen" (or look for the install banner)

> If running on your laptop and want to open on phone: both devices must be on the same WiFi. Use your laptop's local IP instead of localhost — e.g. http://192.168.x.x:3000

## Daily use (2 minutes/day)
1. Open the app
2. Tap **R** or **D** to select who you're logging for
3. Enter weight, sleep, energy, meals → Save
4. Repeat for the other person
5. Check supplements as taken

## Data backup
Your data lives in IndexedDB on the device. To back up, open browser DevTools → Application → IndexedDB → export manually, or ask Claude Code to add an export-to-CSV feature.
