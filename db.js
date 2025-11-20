const sqlite3 = require("sqlite3").verbose();
const db = new sqlite3.Database("octom.db");

// Tạo bảng nếu chưa có
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password TEXT
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    text TEXT,
    status TEXT,
    user TEXT
  )`);
});

module.exports = db;
