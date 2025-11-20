const express = require("express");
const bodyParser = require("body-parser");
const session = require("express-session");
const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const app = express();
app.use(bodyParser.json());
app.use(express.static("public"));

app.use(session({
  secret: "octom-secret",
  resave: false,
  saveUninitialized: true
}));

// DB
const db = new sqlite3.Database("octom.db");
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    text TEXT NOT NULL,
    status TEXT NOT NULL CHECK(status IN ('todo','doing','done')),
    user TEXT NOT NULL,
    deadline TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  )`);
});

// Helper: user mặc định
function currentUser(req) {
  if (!req.session.user) req.session.user = "default";
  return req.session.user;
}

// API
app.get("/tasks", (req, res) => {
  const user = currentUser(req);
  db.all("SELECT * FROM tasks WHERE user = ?", [user], (err, rows) => {
    res.json(rows);
  });
});

app.post("/tasks", (req, res) => {
  const { text, status = "todo", deadline = "" } = req.body;
  const user = currentUser(req);
  db.run("INSERT INTO tasks (text, status, user, deadline) VALUES (?, ?, ?, ?)",
    [text, status, user, deadline],
    function (err) {
      if (err) return res.status(500).send("Lỗi thêm task");
      res.json({ id: this.lastID, text, status, user, deadline });
    });
});

app.put("/tasks/:id", (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const user = currentUser(req);
  db.run("UPDATE tasks SET status = ? WHERE id = ? AND user = ?",
    [status, id, user],
    function (err) {
      if (err || this.changes === 0) return res.status(404).send("Task không tồn tại");
      res.send("OK");
    });
});

app.put("/tasks/:id/edit", (req, res) => {
  const { id } = req.params;
  const { text } = req.body;
  const user = currentUser(req);
  db.run("UPDATE tasks SET text = ? WHERE id = ? AND user = ?",
    [text, id, user],
    function (err) {
      if (err || this.changes === 0) return res.status(404).send("Task không tồn tại");
      res.send("OK");
    });
});

app.delete("/tasks/:id", (req, res) => {
  const { id } = req.params;
  const user = currentUser(req);
  db.run("DELETE FROM tasks WHERE id = ? AND user = ?",
    [id, user],
    function (err) {
      if (err) return res.status(500).send("Lỗi xóa task");
      if (this.changes === 0) return res.status(404).send("Task không tồn tại");
      res.send("OK");
    });
});

app.get("/tasks/stats", (req, res) => {
  const user = currentUser(req);
  db.all("SELECT status, COUNT(*) as count FROM tasks WHERE user = ? GROUP BY status",
    [user],
    (err, rows) => {
      const stats = { todo: 0, doing: 0, done: 0 };
      rows.forEach(r => stats[r.status] = r.count);
      res.json(stats);
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server chạy tại http://localhost:${PORT}`));
