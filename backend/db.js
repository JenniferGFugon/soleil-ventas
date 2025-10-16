const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const dbPath = path.join(__dirname, 'soleil.sqlite');
const db = new sqlite3.Database(dbPath);

const initSql = `
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  shipping_cost REAL DEFAULT 0,
  total REAL DEFAULT 0,
  num_products INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now','localtime'))
);

CREATE TABLE IF NOT EXISTS order_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER,
  product_name TEXT,
  cost_price REAL,
  sale_price REAL,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);
`;

db.serialize(() => {
  db.exec(initSql, (err) => {
    if (err) console.error('Error inicializando DB', err);
  });
});

module.exports = db;
