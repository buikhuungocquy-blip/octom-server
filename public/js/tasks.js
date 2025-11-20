function allowDrop(ev) { ev.preventDefault(); }
function drag(ev) { ev.dataTransfer.setData("text/plain", ev.currentTarget.dataset.id); }
function drop(ev) {
  ev.preventDefault();
  const list = ev.target.closest(".task-list");
  if (!list) return;
  const status = list.id;
  const id = ev.dataTransfer.getData("text/plain");
  fetch(`/tasks/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status })
  }).then(() => loadTasks());
}

function addTask() {
  const text = document.getElementById("taskInput").value.trim();
  const deadline = document.getElementById("deadlineInput").value || "";
  if (!text) return;
  fetch("/tasks", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, status: "todo", deadline })
  }).then(() => {
    document.getElementById("taskInput").value = "";
    document.getElementById("deadlineInput").value = "";
    loadTasks();
  });
}

function editTask(id, oldText) {
  const newText = prompt("Sửa công việc:", oldText);
  if (!newText || !newText.trim()) return;
  fetch(`/tasks/${id}/edit`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text: newText.trim() })
  }).then(() => loadTasks());
}

function deleteTask(id) {
  fetch(`/tasks/${id}`, { method: "DELETE" }).then(() => loadTasks());
}

function updateStats() {
  fetch("/tasks/stats")
    .then(res => {
      if (res.status === 401) {
        document.getElementById("stats").textContent = "Chưa đăng nhập";
        return {};
      }
      return res.json();
    })
    .then(stats => {
      if (stats.todo !== undefined) {
        document.getElementById("stats").textContent =
          `Todo: ${stats.todo} | Doing: ${stats.doing} | Done: ${stats.done}`;
      }
    });
}

function createTaskNode(task) {
  const div = document.createElement("div");
  div.className = "task";
  div.draggable = true;
  div.dataset.id = task.id;
  div.addEventListener("dragstart", drag);

  const p = document.createElement("p");
  p.textContent = task.text;

  const small = document.createElement("small");
  small.textContent = `Hạn: ${task.deadline || "—"}`;

  const btnEdit = document.createElement("button");
  btnEdit.textContent = "Sửa";
  btnEdit.onclick = () => editTask(task.id, task.text);

  const btnDelete = document.createElement("button");
  btnDelete.textContent = "Xóa";
  btnDelete.onclick = () => deleteTask(task.id);

  div.appendChild(p);
  div.appendChild(small);
  div.appendChild(document.createElement("br"));
  div.appendChild(btnEdit);
  div.appendChild(btnDelete);

  return div;
}

function renderTasks(tasks) {
  ["todo", "doing", "done"].forEach(status => {
    document.getElementById(status).innerHTML = "";
  });
  tasks.forEach(task => {
    const list = document.getElementById(task.status);
    if (list) list.appendChild(createTaskNode(task));
  });
  updateStats();
}

function filterByDate() {
  const day = document.getElementById("filterDate").value;
  if (!day) return;
  fetch(`/tasks/date/${day}`)
    .then(res => res.json())
    .then(renderTasks);
}

function filterByRange() {
  const start = document.getElementById("startDate").value;
  const end = document.getElementById("endDate").value;
  if (!start || !end) return;
  fetch(`/tasks/range?start=${start}&end=${end}`)
    .then(res => res.json())
    .then(renderTasks);
}

document.querySelectorAll(".task-list").forEach(list => {
  list.addEventListener("dragover", allowDrop);
  list.addEventListener("drop", drop);
});

function loadTasks() {
  fetch("/tasks")
    .then(res => {
      if (res.status === 401) {
        window.location.href = "/login.html";
        return [];
      }
      return res.json();
    })
    .then(renderTasks);
}

loadTasks();
