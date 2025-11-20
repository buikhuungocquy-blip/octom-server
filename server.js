const express = require("express");
const bodyParser = require("body-parser");
const session = require("express-session");
const sqlite3 = require("sqlite3").verbose();

const app = express();
app.use(bodyParser.json());
app.use(express.static("public"));

app.use(session({
  secret: "octom-secret",
  resave: false,
  saveUninitialized: true
}));

const db = new sqlite3.Database("octom.db");

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
    user TEXT,
    deadline TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  )`);
});

app.post("/register", (req, res) => {
  const { username, password } = req.body;
  db.run("INSERT INTO users (username, password) VALUES (?, ?)", [username, password], function(err) {
    if (err) return res.status(400).send("Tên đăng nhập đã tồn tại");
    res.send("Đăng ký thành công");
  });
});

app.post("/login", (req, res) => {
  const { username, password } = req.body;
  db.get("SELECT * FROM users WHERE username = ? AND password = ?", [username, password], (err, user) => {
    if (!user) return res.status(401).send("Sai tên đăng nhập hoặc mật khẩu");
    req.session.user = username;
    res.send("Đăng nhập thành công");
  });
});

app.get("/logout", (req, res) => {
  req.session.destroy();
  res.send("Đã đăng xuất");
});

app.get("/tasks", (req, res) => {
  const user = req.session.user;
  db.all("SELECT * FROM tasks WHERE user = ?", [user], (err, rows) => {
    res.json(rows);
  });
});

app.post("/tasks", (req, res) => {
  const { text, status, deadline } = req.body;
  const user = req.session.user;
  db.run("INSERT INTO tasks (text, status, user, deadline) VALUES (?, ?, ?, ?)", [text, status, user, deadline], function(err) {
    res.json({ id: this.lastID, text, status, user, deadline });
  });
});

app.put("/tasks/:id", (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  db.run("UPDATE tasks SET status = ? WHERE id = ?", [status, id], function(err) {
    if (err || this.changes === 0) return res.status(404).send("Task không tồn tại");
    res.send("Cập nhật thành công");
  });
});

app.put("/tasks/:id/edit", (req, res) => {
  const { id } = req.params;
  const { text } = req.body;
  db.run("UPDATE tasks SET text = ? WHERE id = ?", [text, id], function(err) {
    if (err || this.changes === 0) return res.status(404).send("Task không tồn tại");
    res.send("Sửa thành công");
  });
});

app.delete("/tasks/:id", (req, res) => {
  const { id } = req.params;
  const user = req.session.user;
  db.run("DELETE FROM tasks WHERE id = ? AND user = ?", [id, user], function(err) {
    if (err) return res.status(500).send("Lỗi khi xóa task");
    if (this.changes === 0) return res.status(404).send("Task không tồn tại hoặc không thuộc user này");
    res.send("Xóa thành công");
  });
});

app.get("/tasks/filter/:status", (req, res) => {
  const user = req.session.user;
  const { status } = req.params;
  db.all("SELECT * FROM tasks WHERE user = ? AND status = ?", [user, status], (err, rows) => {
    res.json(rows);
  });
});

app.get("/tasks/stats", (req, res) => {
  const user = req.session.user;
  db.all("SELECT status, COUNT(*) as count FROM tasks WHERE user = ? GROUP BY status", [user], (err, rows) => {
    const stats = { todo: 0, doing: 0, done: 0 };
    rows.forEach(r => stats[r.status] = r.count);
    res.json(stats);
  });
});

app.get("/tasks/date/:day", (req, res) => {
  const user = req.session.user;
  const { day } = req.params;
  db.all("SELECT * FROM tasks WHERE user = ? AND DATE(created_at) = ?", [user, day], (err, rows) => {
    res.json(rows);
  });
});

app.get("/tasks/range", (req, res) => {
  const user = req.session.user;
  const { start, end } = req.query;
  db.all("SELECT * FROM tasks WHERE user = ? AND DATE(created_at) BETWEEN ? AND ?", [user, start, end], (err, rows) => {
    res.json(rows);
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server chạy tại http://localhost:${PORT}`));

