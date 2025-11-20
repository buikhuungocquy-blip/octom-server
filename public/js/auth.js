function login() {
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;
  fetch("/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password })
  })
    .then(res => res.text())
    .then(msg => {
      alert(msg);
      if (msg.includes("thành công")) {
        window.location.href = "/index.html";
      }
    });
}

function register() {
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;
  fetch("/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password })
  })
    .then(res => res.text())
    .then(msg => {
      alert(msg);
      if (msg.includes("thành công")) {
        window.location.href = "/index.html";
      }
    });
}
