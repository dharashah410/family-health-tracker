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
console.log('VAPID public key: ', vapidKeys.publicKey);
console.log('VAPID private key:', vapidKeys.privateKey);

// ─── Seed default reminders ────────────────────────────────────────────────

const reminderCount = db.prepare('SELECT COUNT(*) as n FROM reminders').get().n;
if (reminderCount === 0) {
  const ins = db.prepare(
    'INSERT OR IGNORE INTO reminders (id,person,label,days,time,enabled,message) VALUES (?,?,?,?,?,?,?)'
  );
  [
    ['d3',       'all', 'Vitamin D (Sunday)',        '[0]',             '13:30', 1, 'Time for your Vitamin D 🌞 — take with lunch'],
    ['b12',      'all', 'Vitamin B12',               '[0,2,4]',         '20:00', 1, 'Time for your B12 💊 — sublingual, after dinner'],
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

cron.schedule('* * * * *', () => {
  const now  = new Date();
  const day  = now.getDay();
  const time = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;

  // Regular schedule-based reminders
  db.prepare('SELECT * FROM reminders WHERE enabled = 1').all().forEach(r => {
    const days = JSON.parse(r.days);
    if (!days.includes(day) || r.time !== time) return;
    pushAll({ title: 'Family Health', body: r.message, reminderId: r.id, tag: r.id });
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

// TEMPORARY — copy keys into Railway env vars then delete this route
app.get('/api/vapid-debug', (req, res) => {
  res.json({ publicKey: vapidKeys.publicKey, privateKey: vapidKeys.privateKey });
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
