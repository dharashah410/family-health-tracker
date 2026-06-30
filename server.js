'use strict';

const express          = require('express');
const path             = require('path');
const https            = require('https');
const fs               = require('fs');
const os               = require('os');
const { execSync }     = require('child_process');
const cron             = require('node-cron');
const webpush          = require('web-push');
const { DatabaseSync } = require('node:sqlite');

// ─── Grocery WhatsApp config ───────────────────────────────────────────────

const VENDOR_PHONE = '919818882261'; // vegetable vendor
const PLAN_START   = new Date('2026-06-15T00:00:00'); // Week 1 Monday

const GROCERY_VENDOR = [
  // Week 1 (Jun 15–21)
  {
    'Vegetables': ['Spinach / palak 500g','Lauki / bottle gourd 500g','Baingan / eggplant 400g','Cauliflower 500g','Broccoli 300g','Sweet potato 600g','Tomatoes 500g','Cucumber 500g','Capsicum (mix) 400g','Onion 1kg','Garlic 2 bulbs','Ginger 100g','Green chillies 50g','Coriander 2 bunches','Bok choy 200g','Mushrooms 200g','Drumstick / moringa 300g'],
    'Fruits':     ['Bananas 1.5kg','Papaya 1kg','Guava 500g','Pears 600g','Lemon 250g','Avocado 400g','Jackfruit (raw) 500g'],
  },
  // Week 2 (Jun 22–28)
  {
    'Vegetables': ['Spinach / palak 500g','Dudhi / bottle gourd 500g','Bhindi / okra 300g','Methi leaves 200g','Cauliflower 500g','Broccoli 300g','Sweet potato 600g','Butternut squash 500g','Mushrooms 200g','Bok choy 200g','Capsicum (mix) 400g','Tomatoes 500g','Cucumber 500g','Onion 1kg','Garlic 2 bulbs','Ginger 100g','Coriander 2 bunches','Peas (fresh/frozen) 200g'],
    'Fruits':     ['Bananas 1.5kg','Papaya 1kg','Guava 500g','Pears 600g','Lemon 250g','Avocado 400g','Berries (frozen) 250g','Mango 600g'],
  },
  // Week 3 (Jun 29–Jul 5)
  {
    'Vegetables': ['Spinach / palak 500g','Baingan / brinjal 400g','Drumstick / moringa 300g','Beetroot 400g','Capsicum (yellow, red, green) 600g','Mushrooms 250g','Carrot 400g','Broccoli 300g','Sweet potato 600g','Bok choy 200g','Cabbage 300g','Spring onion 1 bunch','Edamame (frozen) 200g','Tomatoes 500g','Cucumber 500g','Onion 1kg','Garlic 2 bulbs','Ginger 100g','Coriander 2 bunches','Sorakkai / bottle gourd 500g','Pumpkin / kaddu 300g'],
    'Fruits':     ['Bananas 1.5kg','Papaya 1kg','Guava 500g','Pears 600g','Lemon 250g','Avocado 400g','Jackfruit (raw) 500g','Mango 600g'],
  },
  // Week 4 (Jul 6–12)
  {
    'Vegetables': ['Spinach / palak 500g','Lauki / bottle gourd 500g','Karela / bitter gourd 400g','Potato 600g','Bhindi / okra 300g','Methi leaves 200g','Mushrooms 200g','Bok choy 200g','Broccoli 300g','Sweet potato 600g','Capsicum (mix) 400g','Tomatoes 500g','Cucumber 500g','Onion 1kg','Garlic 2 bulbs','Ginger 100g','Coriander 2 bunches','Drumstick / moringa 300g'],
    'Fruits':     ['Bananas 1.5kg','Papaya 1kg','Guava 500g','Pears 600g','Lemon 250g','Avocado 400g','Jackfruit (raw) 500g','Mango 600g'],
  },
];

function groceryWhatsAppUrl() {
  const now   = new Date();
  const start = new Date(PLAN_START); start.setHours(0,0,0,0);
  const diff  = Math.round((now - start) / 86400000);
  const curWi = Math.max(0, Math.min(3, Math.floor(diff / 7)));
  const wi    = Math.min(3, curWi + 1); // always next week

  const weekStart = new Date(PLAN_START);
  weekStart.setDate(weekStart.getDate() + wi * 7);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const fmt = d => `${d.getDate()} ${months[d.getMonth()]}`;

  const list = GROCERY_VENDOR[wi] || GROCERY_VENDOR[3];
  const lines = [
    `🥦 *Grocery Order — Week ${wi+1} (${fmt(weekStart)}–${fmt(weekEnd)})*`,
    '',
  ];
  Object.entries(list).forEach(([cat, items]) => {
    lines.push(`*${cat}*`);
    items.forEach(i => lines.push(`• ${i}`));
    lines.push('');
  });
  lines.push('Please deliver by Saturday morning. Thank you! 🙏');

  const msg = lines.join('\n').trim();
  return `https://wa.me/${VENDOR_PHONE}?text=${encodeURIComponent(msg)}`;
}

const app  = express();
const PORT = process.env.PORT || 3000;

// ─── SQLite ────────────────────────────────────────────────────────────────

const DB_DIR = process.env.DATA_DIR || __dirname;
const db = new DatabaseSync(path.join(DB_DIR, 'health.db'));

db.exec(`
  CREATE TABLE IF NOT EXISTS logs (
    id      INTEGER PRIMARY KEY AUTOINCREMENT,
    person  TEXT    NOT NULL,
    date    TEXT    NOT NULL,
    weight  REAL,
    sleep   REAL,
    energy  TEXT,
    meals   TEXT,
    ts      INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS config (
    key TEXT PRIMARY KEY,
    val TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS subscriptions (
    endpoint TEXT PRIMARY KEY,
    data     TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS reminders (
    id      TEXT PRIMARY KEY,
    person  TEXT NOT NULL,
    label   TEXT NOT NULL,
    days    TEXT NOT NULL,
    time    TEXT NOT NULL,
    enabled INTEGER NOT NULL DEFAULT 1,
    message TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS snoozes (
    id        TEXT PRIMARY KEY,
    fire_at   INTEGER NOT NULL
  );
`);

// ─── VAPID keys (generate once, persist in DB) ────────────────────────────

let vapidKeys;
// Prefer env vars (set VAPID_PUBLIC_KEY + VAPID_PRIVATE_KEY in Railway to survive redeploys)
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  vapidKeys = { publicKey: process.env.VAPID_PUBLIC_KEY, privateKey: process.env.VAPID_PRIVATE_KEY };
} else {
  const storedKeys = db.prepare("SELECT val FROM config WHERE key = 'vapid'").get();
  if (storedKeys) {
    vapidKeys = JSON.parse(storedKeys.val);
  } else {
    vapidKeys = webpush.generateVAPIDKeys();
    db.prepare("INSERT INTO config (key, val) VALUES ('vapid', ?)").run(JSON.stringify(vapidKeys));
  }
}
webpush.setVapidDetails('mailto:health@family.local', vapidKeys.publicKey, vapidKeys.privateKey);

// ─── Seed default reminders ────────────────────────────────────────────────

const reminderCount = db.prepare('SELECT COUNT(*) as n FROM reminders').get().n;
if (reminderCount === 0) {
  const ins = db.prepare(
    'INSERT OR IGNORE INTO reminders (id,person,label,days,time,enabled,message) VALUES (?,?,?,?,?,?,?)'
  );
  [
    ['d3',       'all', 'Vitamin D (Sunday)',        '[0]',             '13:30', 1, 'Time for your Vitamin D 🌞 — take with lunch'],
    ['b12',      'all', 'Vitamin B12',               '[0,3]',           '20:00', 1, 'Time for your B12 500 mcg 💊 — sublingual, after dinner'],
    ['log_r',    'R',   'Daily log — Ritvij',        '[0,1,2,3,4,5,6]', '19:00', 1, 'Log your day, Ritvij — weight, sleep, energy 📋'],
    ['log_d',    'D',   'Daily log — Dhara',         '[0,1,2,3,4,5,6]', '19:00', 1, 'Log your day, Dhara — weight, sleep, energy 📋'],
    ['grocery',  'all', 'Grocery reminder',          '[3]',             '18:00', 1, 'Time to send the grocery list to vendor 🥬'],
    ['prep_fri', 'all', 'Cook prep — Friday',        '[5]',             '09:00', 1, 'Prep day — share cook instructions with Babli Aunty 🍳'],
    ['prep_sat', 'all', 'Cook prep — Saturday',      '[6]',             '09:00', 1, "Babli Aunty's second session — check prep is on track 🌿"],
    ['weigh_r',  'R',   'Weigh-in — Ritvij',         '[0,1,2,3,4,5,6]', '07:00', 1, 'Good morning, Ritvij — quick weigh-in before breakfast ⚖️'],
    ['weigh_d',  'D',   'Weigh-in — Dhara',          '[0,1,2,3,4,5,6]', '07:00', 1, 'Good morning, Dhara — quick weigh-in before breakfast ⚖️'],
    ['blood_r',  'R',   'Blood test — Ritvij',       '[]',              '09:00', 0, 'Blood test reminder for Ritvij — book your appointment 🩸'],
    ['reorder',  'all', 'Supplement reorder',        '[]',              '10:00', 0, 'Time to reorder supplements — stock running low 💊'],
  ].forEach(r => ins.run(...r));
}

// ─── One-time migrations ────────────────────────────────────────────────────
// Update B12 reminder to 500 mcg, Sun+Wed only
db.prepare(`UPDATE reminders SET days='[0,3]', message='Time for your B12 500 mcg 💊 — sublingual, after dinner' WHERE id='b12'`).run();

// ─── Push helper ────────────────────────────────────────────────────────────

function pushAll(payload) {
  const subs = db.prepare('SELECT data FROM subscriptions').all();
  subs.forEach(({ data }) => {
    webpush.sendNotification(JSON.parse(data), JSON.stringify(payload))
      .catch(err => {
        if (err.statusCode === 410 || err.statusCode === 404) {
          db.prepare('DELETE FROM subscriptions WHERE endpoint = ?')
            .run(JSON.parse(data).endpoint);
        }
      });
  });
}

// ─── Cron: fire reminders every minute ─────────────────────────────────────

const TIMEZONE = process.env.TZ || 'Asia/Kolkata';

function nowInTZ() {
  const now = new Date();
  // Use Intl explicitly — avoids relying on Node's process TZ being set correctly
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: TIMEZONE,
    hour: '2-digit', minute: '2-digit', hour12: false,
    weekday: 'short',
  }).formatToParts(now);
  const get = type => parts.find(p => p.type === type).value;
  const day = { Sun:0, Mon:1, Tue:2, Wed:3, Thu:4, Fri:5, Sat:6 }[get('weekday')];
  const time = `${get('hour').padStart(2,'0')}:${get('minute').padStart(2,'0')}`;
  return { day, time };
}

cron.schedule('* * * * *', () => {
  const { day, time } = nowInTZ();
  console.log(`[cron] ${time} day=${day} tz=${TIMEZONE}`);

  // Regular schedule-based reminders
  db.prepare('SELECT * FROM reminders WHERE enabled = 1').all().forEach(r => {
    const days = JSON.parse(r.days);
    if (!days.includes(day) || r.time !== time) return;
    console.log(`[cron] firing reminder: ${r.id} (${r.label}) at ${time}`);
    const payload = { title: 'Family Health', body: r.message, reminderId: r.id, tag: r.id };
    if (r.id === 'grocery') payload.url = groceryWhatsAppUrl();
    pushAll(payload);
  });

  // One-off snooze reminders
  const nowMs = Date.now();
  db.prepare('SELECT * FROM snoozes WHERE fire_at <= ?').all(nowMs).forEach(s => {
    const r = db.prepare('SELECT * FROM reminders WHERE id = ?').get(s.id);
    if (r) pushAll({ title: 'Family Health', body: r.message, reminderId: r.id, tag: r.id });
    db.prepare('DELETE FROM snoozes WHERE id = ?').run(s.id);
  });
});

// ─── API ───────────────────────────────────────────────────────────────────

app.use(express.json());

// Logs
app.get('/api/logs', (req, res) => {
  res.json(db.prepare('SELECT * FROM logs ORDER BY ts DESC').all());
});
app.delete('/api/logs/:ts', (req, res) => {
  db.prepare('DELETE FROM logs WHERE ts = ?').run(Number(req.params.ts));
  res.json({ ok: true });
});
app.post('/api/logs', (req, res) => {
  const { person, date, weight, sleep, energy, meals, ts } = req.body;
  if (!person || !date || !ts) return res.status(400).json({ error: 'person, date and ts are required' });
  const result = db.prepare(
    'INSERT INTO logs (person,date,weight,sleep,energy,meals,ts) VALUES (?,?,?,?,?,?,?)'
  ).run(person, date, weight ?? null, sleep ?? null, energy ?? '', meals ?? '', ts);
  res.status(201).json(db.prepare('SELECT * FROM logs WHERE id = ?').get(result.lastInsertRowid));
});

// VAPID public key
app.get('/api/vapid-key', (req, res) => {
  res.json({ publicKey: vapidKeys.publicKey });
});


// Push subscription
app.post('/api/subscribe', (req, res) => {
  const sub = req.body;
  db.prepare('INSERT OR REPLACE INTO subscriptions (endpoint, data) VALUES (?, ?)')
    .run(sub.endpoint, JSON.stringify(sub));
  res.json({ ok: true });
});

// Reminders — list
app.get('/api/reminders', (req, res) => {
  res.json(db.prepare('SELECT * FROM reminders ORDER BY time').all());
});

// Reminders — update (toggle/time)
app.patch('/api/reminders/:id', (req, res) => {
  const { enabled, time, days } = req.body;
  const r = db.prepare('SELECT * FROM reminders WHERE id = ?').get(req.params.id);
  if (!r) return res.status(404).json({ error: 'not found' });
  db.prepare('UPDATE reminders SET enabled=?, time=?, days=? WHERE id=?').run(
    enabled ?? r.enabled,
    time    ?? r.time,
    days    ?? r.days,
    req.params.id
  );
  res.json(db.prepare('SELECT * FROM reminders WHERE id = ?').get(req.params.id));
});

// Snooze
app.post('/api/snooze', (req, res) => {
  const { reminderId, minutes } = req.body;
  const fireAt = Date.now() + minutes * 60 * 1000;
  db.prepare('INSERT OR REPLACE INTO snoozes (id, fire_at) VALUES (?, ?)').run(reminderId, fireAt);
  res.json({ ok: true, fireAt });
});

// WhatsApp grocery URL for vendor
app.get('/api/grocery-whatsapp', (req, res) => {
  res.json({ url: groceryWhatsAppUrl() });
});

// Debug — shows server time, timezone, subscribers, enabled reminders
app.get('/api/debug', (req, res) => {
  const { day, time } = nowInTZ();
  const subscribers = db.prepare('SELECT COUNT(*) as n FROM subscriptions').get().n;
  const reminders = db.prepare('SELECT id, label, time, days, enabled FROM reminders').all();
  res.json({
    serverTime: time,
    serverDay: day,
    timezone: TIMEZONE,
    utcTime: new Date().toISOString(),
    subscribers,
    reminders,
  });
});

// Test push — fires immediately to all subscribers
app.post('/api/test-push', (req, res) => {
  const subs = db.prepare('SELECT data FROM subscriptions').all();
  if (!subs.length) return res.status(400).json({ error: 'No subscribers yet — enable notifications first' });
  pushAll({ title: '🔔 Test', body: 'Push notifications are working! 🎉', reminderId: 'test', tag: 'test' });
  res.json({ ok: true, sent: subs.length });
});

// ─── Static ─────────────────────────────────────────────────────────────────

app.use(express.static(path.join(__dirname, 'public')));
app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

// ─── HTTP server ─────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`\n🌿 Family Health — http://localhost:${PORT}`);
});

// ─── HTTPS server (required for push notifications on phone) ─────────────────

const CERT_DIR  = path.join(__dirname, 'cert');
const KEY_FILE  = path.join(CERT_DIR, 'key.pem');
const CERT_FILE = path.join(CERT_DIR, 'cert.pem');
const HTTPS_PORT = process.env.HTTPS_PORT || 3443;

if (!fs.existsSync(KEY_FILE) || !fs.existsSync(CERT_FILE)) {
  fs.mkdirSync(CERT_DIR, { recursive: true });
  try {
    execSync(
      `openssl req -x509 -newkey rsa:2048 -keyout "${KEY_FILE}" -out "${CERT_FILE}" -days 730 -nodes -subj "/CN=family-health"`,
      { stdio: 'ignore' }
    );
    console.log('🔑 HTTPS cert auto-generated in ./cert/');
  } catch (e) {
    console.warn('⚠️  Could not generate HTTPS cert:', e.message);
  }
}

if (fs.existsSync(KEY_FILE) && fs.existsSync(CERT_FILE)) {
  https.createServer({ key: fs.readFileSync(KEY_FILE), cert: fs.readFileSync(CERT_FILE) }, app)
    .listen(HTTPS_PORT, () => {
      const ips = Object.values(os.networkInterfaces()).flat()
        .filter(i => i.family === 'IPv4' && !i.internal)
        .map(i => i.address);
      console.log(`\n🔒 Open THIS on your phone (for push notifications):`);
      ips.forEach(ip => console.log(`   https://${ip}:${HTTPS_PORT}`));
      console.log(`   ↑ Accept the security warning once, then tap 🔔 and enable notifications.\n`);
    });
}
