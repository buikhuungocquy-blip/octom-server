// ================== AUTH ==================
function register() {
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;
  fetch("/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password })
  }).then(res => res.text()).then(msg => alert(msg));
}

function login() {
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;
  fetch("/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password })
  }).then(res => {
    if (!res.ok) return res.text().then(text => alert(text));
    return res.text();
  }).then(msg => {
    alert(msg);
    document.getElementById("auth").style.display = "none";
    document.getElementById("app").style.display = "block";
    loadTasks();
    showStats();
  });
}

function logout() {
  fetch("/logout").then(res => res.text()).then(msg => {
    alert(msg);
    document.getElementById("auth").style.display = "block";
    document.getElementById("app").style.display = "none";
  });
}

// ================== KANBAN BOARD ==================
let dragged = null;

function loadTasks() {
  fetch("/tasks").then(res => res.json()).then(data => {
    ["todo", "doing", "done"].forEach(col => document.getElementById(col).innerHTML = "");
    data.forEach(task => renderTask(task));
  });
}

function renderTask(task) {
  const li = document.createElement("li");
  li.textContent = task.text;
  li.draggable = true;
  li.dataset.id = task.id;
  li.addEventListener("dragstart", dragStart);

  // deadline
  if (task.deadline) {
    const span = document.createElement("span");
    span.textContent = "⏰ " + task.deadline;
    li.appendChild(span);
  }

  // nút sửa
  const editBtn = document.createElement("button");
  editBtn.textContent = "✏️";
  editBtn.onclick = () => {
    const newText = prompt("Nhập nội dung mới:", task.text);
    if (newText) editTask(task.id, newText);
  };

  // nút xóa
  const delBtn = document.createElement("button");
  delBtn.textContent = "❌";
  delBtn.onclick = () => deleteTask(task.id);

  li.appendChild(editBtn);
  li.appendChild(delBtn);
  document.getElementById(task.status).appendChild(li);
}

function addTask() {
  const text = document.getElementById("newTask").value;
  const deadline = document.getElementById("newDeadline").value;
  if (!text) return;
  fetch("/tasks", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, status: "todo", deadline })
  }).then(res => res.json()).then(task => {
    renderTask(task);
    document.getElementById("newTask").value = "";
    document.getElementById("newDeadline").value = "";
    showStats();
  });
}

function dragStart(e) { dragged = e.target; }

document.querySelectorAll("ul").forEach(ul => {
  ul.addEventListener("dragover", e => e.preventDefault());
  ul.addEventListener("drop", e => {
    e.preventDefault();
    if (dragged) {
      ul.appendChild(dragged);
      const id = dragged.dataset.id;
      const status = ul.id;
      fetch(`/tasks/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      }).then(() => showStats());
    }
  });
});

// ================== CRUD ==================
function editTask(id, newText) {
  fetch(`/tasks/${id}/edit`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text: newText })
  }).then(res => {
    if (!res.ok) return res.text().then(text => alert(text));
    return res.text();
  }).then(msg => {
    alert(msg);
    loadTasks();
  });
}

function deleteTask(id) {
  fetch(`/tasks/${id}`, { method: "DELETE" })
    .then(res => {
      if (!res.ok) return res.text().then(text => alert(text));
      return res.text();
    })
    .then(msg => {
      alert(msg);
      loadTasks();
      showStats();
    });
}

// ================== LỌC & THỐNG KÊ ==================
function filterTasks(status) {
  fetch(`/tasks/filter/${status}`)
    .then(res => res.json())
    .then(data => {
      document.getElementById(status).innerHTML = "";
      data.forEach(task => renderTask(task));
    });
}

function showStats() {
  fetch("/tasks/stats")
    .then(res => res.json())
    .then(stats => {
      document.getElementById("stats").innerHTML =
        `Todo: ${stats.todo} | Doing: ${stats.doing} | Done: ${stats.done}`;
    });
}

function filterByDate(day) {
  fetch(`/tasks/date/${day}`)
    .then(res => res.json())
    .then(data => {
      ["todo", "doing", "done"].forEach(col => document.getElementById(col).innerHTML = "");
      data.forEach(task => renderTask(task));
    });
}

function filterByRange(start, end) {
  fetch(`/tasks/range?start=${start}&end=${end}`)
    .then(res => res.json())
    .then(data => {
      ["todo", "doing", "done"].forEach(col => document.getElementById(col).innerHTML = "");
      data.forEach(task => renderTask(task));
    });
}
