function allowDrop(ev) {
  ev.preventDefault();
}

function drag(ev) {
  ev.dataTransfer.setData("text", ev.target.id);
}

function drop(ev) {
  ev.preventDefault();
  const id = ev.dataTransfer.getData("text");
  const status = ev.target.id || ev.target.parentElement.id;
  fetch(`/tasks/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status })
  }).then(() => loadTasks());
}

function addTask() {
  const text = document.getElementById("taskInput").value;
  const deadline = document.getElementById("deadlineInput").value;
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
  if (newText) {
    fetch(`/tasks/${id}/edit`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: newText })
    }).then(() => loadTasks());
  }
}

function deleteTask(id) {
  fetch(`/tasks/${id}`, { method: "DELETE" }).then(() => loadTasks());
}

function filterByDate() {
  const day = document.getElementById("filterDate").value;
  fetch(`/tasks/date/${day}`)
    .then(res => res.json())
    .then(renderTasks);
}

function filterByRange() {
  const start = document.getElementById("startDate").value;
  const end = document.getElementById("endDate").value;
  fetch(`/tasks/range?start=${start}&end=${end}`)
    .then(res => res.json())
    .then(renderTasks);
}

function logout() {
  fetch("/logout").then(() => location.reload());
}

function updateStats() {
  fetch("/tasks/stats")
    .then(res => res.json())
    .then(stats => {
      document.getElementById("stats").textContent =
        `Todo: ${stats.todo} | Doing: ${stats.doing} | Done: ${stats.done}`;
    });
}

function renderTasks(tasks) {
  ["todo", "doing", "done"].forEach(status => {
    document.getElementById(status).innerHTML = "";
  });

  tasks.forEach(task => {
    const div = document.createElement("div");
    div.className = "task";
    div.id = task.id;
    div.draggable = true;
    div.ondragstart = drag;
    div.innerHTML = `
      <p>${task.text}</p>
      <small>Hạn: ${task.deadline}</small><br/>
      <button onclick="editTask(${task.id}, '${task.text}')">Sửa</button>
      <button onclick="deleteTask(${task.id})">Xóa</button>
    `;
    document.getElementById(task.status).appendChild(div);
  });

  updateStats();
}

function loadTasks() {
  fetch("/tasks")
    .then(res => res.json())
    .then(renderTasks);
}

loadTasks();
