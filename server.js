const express = require("express");
const bodyParser = require("body-parser");
const session = require("express-session");
const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const bcrypt = require("bcrypt");

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
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    text TEXT NOT NULL,
    status TEXT NOT NULL CHECK(status IN ('todo','doing','done')),
    user TEXT NOT NULL,
    deadline TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  )`);
});

function currentUser(req) {
  return req.session.user || null;
}

// Auth
app.post("/register", async (req, res) => {
  const { username, password } = req.body;
  const hash = await bcrypt.hash(password, 10);
  db.run("INSERT INTO users (username, password) VALUES (?, ?)", [username, hash], function (err) {
    if (err) return res.status(400).send("Tên đã tồn tại");
    req.session.user = username;
    res.send("Đăng ký thành công");
  });
});

app.post("/login", (req, res) => {
  const { username, password } = req.body;
  db.get("SELECT * FROM users WHERE username = ?", [username], async (err, user) => {
    if (err || !user) return res.status(400).send("Sai tài khoản");
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).send("Sai mật khẩu");
    req.session.user = username;
    res.send("Đăng nhập thành công");
  });
});

app.get("/logout", (req, res) => {
  req.session.destroy(() => res.send("Đã đăng xuất"));
});

// Tasks
app.get("/tasks", (req, res) => {
  const user = currentUser(req);
  if (!user) return res.status(401).send("Chưa đăng nhập");
  db.all("SELECT * FROM tasks WHERE user = ?", [user], (err, rows) => {
    res.json(rows);
  });
});

app.post("/tasks", (req, res) => {
  const user = currentUser(req);
  if (!user) return res.status(401).send("Chưa đăng nhập");
  const { text, status = "todo", deadline = "" } = req.body;
  db.run("INSERT INTO tasks (text, status, user, deadline) VALUES (?, ?, ?, ?)",
    [text, status, user, deadline],
    function (err) {
      if (err) return res.status(500).send("Lỗi thêm task");
      res.json({ id: this.lastID, text, status, user, deadline });
    });
});

app.put("/tasks/:id", (req, res) => {
  const user = currentUser(req);
  if (!user) return res.status(401).send("Chưa đăng nhập");
  const { id } = req.params;
  const { status } = req.body;
  db.run("UPDATE tasks SET status = ? WHERE id = ? AND user = ?",
    [status, id, user],
    function (err) {
      if (err || this.changes === 0) return res.status(404).send("Task không tồn tại");
      res.send("OK");
    });
});

app.put("/tasks/:id/edit", (req, res) => {
  const user = currentUser(req);
  if (!user) return res.status(401).send("Chưa đăng nhập");
  const { id } = req.params;
  const { text } = req.body;
  db.run("UPDATE tasks SET text = ? WHERE id = ? AND user = ?",
    [text, id, user],
    function (err) {
      if (err || this.changes === 0) return res.status(404).send("Task không tồn tại");
      res.send("OK");
    });
});

app.delete("/tasks/:id", (req, res) => {
  const user = currentUser(req);
  if (!user) return res.status(401).send("Chưa đăng nhập");
  const { id } = req.params;
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
  if (!user) return res.status(401).send("Chưa đăng nhập");
  db.all("SELECT status, COUNT(*) as count FROM tasks WHERE user = ? GROUP BY status",
    [user],
    (err, rows) => {
      const stats = { todo: 0, doing: 0, done: 0 };
      rows.forEach(r => stats[r.status] = r.count);
      res.json(stats);
    });
});

app.get("/tasks/date/:day", (req, res) => {
  const user = currentUser(req);
  if (!user) return res.status(401).send("Chưa đăng nhập");
  const { day } = req.params;
  db.all("SELECT * FROM tasks WHERE user = ? AND DATE(deadline) = ? ORDER BY id ASC",
    [user, day],
    (err, rows) => {
      if (err) return res.status(500).send("Lỗi lọc theo ngày");
      res.json(rows);
    });
});

app.get("/tasks/range", (req, res) => {
  const user = currentUser(req);
  if (!user) return res.status(401).send("Chưa đăng nhập");
  const { start, end } = req.query;
  db.all("SELECT * FROM tasks WHERE user = ? AND DATE(deadline) BETWEEN ? AND ? ORDER BY id ASC",
    [user, start, end],
    (err, rows) => {
      if (err) return res.status(500).send("Lỗi lọc theo khoảng thời gian");
      res.json(rows);
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server chạy tại http://localhost:${PORT}`));
