const host = "https://cryptodailymint.onrender.com";

async function loadAdmin() {
  const res = await fetch(`${host}/admin/data`);
  const data = await res.json();

  renderUsers(data.users);
  renderDeposits(data.deposits);
  renderMessages(data.messages);
}

function renderUsers(users) {
  const table = document.getElementById("usersTable");
  table.innerHTML = `
    <tr>
      <th>User</th>
      <th>Balance</th>
      <th>Mining</th>
      <th>Role</th>
      <th>Actions</th>
    </tr>
  `;

  users.forEach(u => {
    table.innerHTML += `
      <tr>
        <td>${u.username}</td>
        <td>${u.balance}</td>
        <td>${u.isMining ? "🟢" : "🔴"}</td>
        <td>${u.role || "user"}</td>
        <td>
          <button onclick="adjustBalance('${u._id}', 50)">+50</button>
          <button onclick="adjustBalance('${u._id}', -50)">-50</button>
          <button onclick="toggleMining('${u._id}', ${!u.isMining})">
            ${u.isMining ? "Stop Mining" : "Start Mining"}
          </button>
          <button onclick="banUser('${u._id}', ${!u.banned})">
            ${u.banned ? "Unban" : "Ban"}
          </button>
          <button onclick="setRole('${u._id}', 'admin')">Make Admin</button>
        </td>
      </tr>
    `;
  });
}

async function adjustBalance(id, amount) {
  await fetch(`${host}/admin/user/balance`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: id, amount })
  });
  loadAdmin();
}

async function toggleMining(id, isMining) {
  await fetch(`${host}/admin/user/mining`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: id, isMining })
  });
  loadAdmin();
}

async function banUser(id, banned) {
  await fetch(`${host}/admin/user/ban`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: id, banned })
  });
  loadAdmin();
}

async function setRole(id, role) {
  await fetch(`${host}/admin/user/role`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: id, role })
  });
  loadAdmin();
}

function renderDeposits(deps) {
  const div = document.getElementById("deposits");
  div.innerHTML = "";

  deps.forEach(d => {
    div.innerHTML += `
      <div style="margin-bottom:10px;">
        <strong>${d.username}</strong> — ${d.amount} — ${d.status}
        ${
          d.status === "pending"
            ? `<button onclick="approveDeposit('${d._id}')">Approve</button>`
            : ""
        }
      </div>
    `;
  });
}



async function approveDeposit(depositId) {
  const res = await fetch(`${host}/admin/approve/${depositId}`, {
    method: "POST"
  });

  const data = await res.json();
  alert(data.message);

  loadAdmin();
}



function renderMessages(msgs) {
  const div = document.getElementById("messages");
  div.innerHTML = "";

  msgs.forEach(m => {
    div.innerHTML += `
      <div>
        <b>${m.username}</b>: ${m.message}
        <button onclick="deleteMessage('${m._id}')">Delete</button>
      </div>
    `;
  });
}

async function deleteMessage(id) {
  await fetch(`${host}/admin/message/delete`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: id })
  });
  loadAdmin();
}

loadAdmin();


const btn = document.getElementById("adminLoginBtn");
const msg = document.getElementById("loginMsg");

if (btn) {
btn.addEventListener("click", async () => {
  const username = document.getElementById("admin-username").value.trim();
  const password = document.getElementById("admin-password").value.trim();

  const res = await fetch(`${host}/admin/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password })
  });

  const data = await res.json();

  if (data.success) {
    localStorage.setItem("adminLoggedIn", "true");
    window.location.href = "https://cryptodailymint.onrender.com/admin";
  } else {
    msg.textContent = data.message;
    msg.style.color = "red";
  }
});
}


const logoutBtn = document.getElementById("adminLogoutBtn");

if (logoutBtn) {
  logoutBtn.addEventListener("click", () => {
    localStorage.removeItem("adminLoggedIn");
    window.location.href = "https://cryptodailymint.onrender.com/admin/login";
  });
}
