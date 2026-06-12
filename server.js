'use strict';

const express = require('express');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');

const app = express();
const PORT = process.env.PORT || 3000;

// ─── SQLite setup ──────────────────────────────────────────────────────────

const db = new DatabaseSync(path.join(__dirname, 'health.db'));

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
  )
`);

// ─── API ───────────────────────────────────────────────────────────────────

app.use(express.json());

app.get('/api/logs', (req, res) => {
  const rows = db.prepare('SELECT * FROM logs ORDER BY ts DESC').all();
  res.json(rows);
});

app.post('/api/logs', (req, res) => {
  const { person, date, weight, sleep, energy, meals, ts } = req.body;
  if (!person || !date || !ts) return res.status(400).json({ error: 'person, date and ts are required' });

  const stmt = db.prepare(
    'INSERT INTO logs (person, date, weight, sleep, energy, meals, ts) VALUES (?, ?, ?, ?, ?, ?, ?)'
  );
  const result = stmt.run(person, date, weight ?? null, sleep ?? null, energy ?? '', meals ?? '', ts);

  const inserted = db.prepare('SELECT * FROM logs WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(inserted);
});

// ─── Static files ──────────────────────────────────────────────────────────

app.use(express.static(path.join(__dirname, 'public')));
app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

app.listen(PORT, () => console.log(`\n🌿 Family Health app running at http://localhost:${PORT}\n`));
