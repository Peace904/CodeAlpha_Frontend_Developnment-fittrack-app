const authScreen = document.getElementById("auth-screen");
const appScreen = document.getElementById("app-screen");
const loginForm = document.getElementById("login-form");
const registerForm = document.getElementById("register-form");

// ---------- Switch between login and sign-up ----------
document.getElementById("show-register").addEventListener("click", (e) => {
  e.preventDefault();
  loginForm.classList.add("hidden");
  registerForm.classList.remove("hidden");
});

document.getElementById("show-login").addEventListener("click", (e) => {
  e.preventDefault();
  registerForm.classList.add("hidden");
  loginForm.classList.remove("hidden");
});

// ---------- Login ----------
loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const errorBox = document.getElementById("login-error");
  const button = loginForm.querySelector("button");
  errorBox.textContent = "";
  button.disabled = true;

  try {
    const data = await apiRequest("/auth/login", {
      method: "POST",
      body: JSON.stringify({
        email: document.getElementById("login-email").value,
        password: document.getElementById("login-password").value,
      }),
    });
    saveSession(data.access_token, data.user);
    loginForm.reset();
    showApp();
  } catch (err) {
    errorBox.textContent = err.message;
  } finally {
    button.disabled = false;
  }
});

// ---------- Sign up ----------
registerForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const errorBox = document.getElementById("register-error");
  const button = registerForm.querySelector("button");
  errorBox.textContent = "";
  button.disabled = true;

  try {
    const data = await apiRequest("/auth/register", {
      method: "POST",
      body: JSON.stringify({
        name: document.getElementById("register-name").value,
        email: document.getElementById("register-email").value,
        password: document.getElementById("register-password").value,
      }),
    });
    saveSession(data.access_token, data.user);
    registerForm.reset();
    showApp();
  } catch (err) {
    errorBox.textContent = err.message;
  } finally {
    button.disabled = false;
  }
});

// ---------- Main app shell ----------
function showApp() {
  const user = getUser();
  authScreen.classList.add("hidden");
  appScreen.classList.remove("hidden");

  appScreen.innerHTML = `
    <header class="app-header">
      <p class="hello">Welcome back 👋</p>
      <h1 id="header-name"></h1>
    </header>

    <main class="app-content" id="tab-content"></main>

    <nav class="bottom-nav">
      <button class="nav-btn" data-tab="home"><span class="nav-icon">🏠</span>Home</button>
      <button class="nav-btn" data-tab="add"><span class="nav-icon">➕</span>Add</button>
      <button class="nav-btn" data-tab="history"><span class="nav-icon">📋</span>History</button>
      <button class="nav-btn" data-tab="profile"><span class="nav-icon">👤</span>Profile</button>
    </nav>
  `;

  document.getElementById("header-name").textContent = user ? user.name : "";

  appScreen.querySelectorAll(".nav-btn").forEach((btn) => {
    btn.addEventListener("click", () => showTab(btn.dataset.tab));
  });

  showTab("home");
}

function showTab(tab) {
  appScreen.querySelectorAll(".nav-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.tab === tab);
  });

  const content = document.getElementById("tab-content");

  if (tab === "home") {
    renderHomeTab(content);
    renderWeekCard(content);
  } else if (tab === "add") {
    renderAddTab(content);
  } else if (tab === "history") {
    renderHistoryTab(content);
  } else if (tab === "profile") {
    renderProfileTab(content);
  }
}

// ---------- Helpers ----------
function todayString() {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
}

// ---------- Add tab ----------
function renderAddTab(content) {
  content.innerHTML = `
    <div class="card">
      <h2>Log an activity</h2>
      <form id="add-form">
        <label>Date
          <input type="date" id="add-date" required />
        </label>

        <label>Exercise type
          <select id="add-type">
            <option>Running</option>
            <option>Walking</option>
            <option>Cycling</option>
            <option>Gym</option>
            <option>Yoga</option>
            <option>Other</option>
          </select>
        </label>

        <label>Duration (minutes)
          <input type="number" id="add-duration" min="0" max="1440" required />
        </label>

        <label>Steps
          <input type="number" id="add-steps" min="0" value="0" />
        </label>

        <label>Calories burned
          <input type="number" id="add-calories" min="0" required />
        </label>

        <p class="form-error" id="add-error"></p>
        <button type="submit" class="primary-btn">Save activity</button>
      </form>
    </div>`;

  document.getElementById("add-date").value = todayString();

  const form = document.getElementById("add-form");
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const errorBox = document.getElementById("add-error");
    const button = form.querySelector("button");
    errorBox.style.color = "";
    errorBox.textContent = "";
    button.disabled = true;

    try {
      await apiRequest("/activities", {
        method: "POST",
        body: JSON.stringify({
          date: document.getElementById("add-date").value,
          type: document.getElementById("add-type").value,
          duration: Number(document.getElementById("add-duration").value) || 0,
          steps: Number(document.getElementById("add-steps").value) || 0,
          calories: Number(document.getElementById("add-calories").value) || 0,
        }),
      });
      form.reset();
      document.getElementById("add-date").value = todayString();
      errorBox.style.color = "#2e7d32";
      errorBox.textContent = "Activity saved ✅";
    } catch (err) {
      errorBox.textContent = err.message;
    } finally {
      button.disabled = false;
    }
  });
}

// ---------- History tab ----------
async function renderHistoryTab(content) {
  content.innerHTML = `
    <div class="card">
      <h2>History</h2>
      <div id="history-list"><p class="empty-text">Loading...</p></div>
    </div>`;
  const list = document.getElementById("history-list");

  try {
    const activities = await apiRequest("/activities");

    if (activities.length === 0) {
      list.innerHTML = `<p class="empty-text">No workouts yet. Tap Add to log your first one!</p>`;
      return;
    }

    list.innerHTML = "";
    activities.forEach((a) => {
      const item = document.createElement("div");
      item.className = "history-item";

      const info = document.createElement("div");

      const title = document.createElement("p");
      title.className = "history-title";
      title.textContent = a.type;

      const meta = document.createElement("p");
      meta.className = "history-meta";
      meta.textContent = `${a.date} · ${a.duration} min · ${a.steps} steps · ${a.calories} kcal`;

      info.appendChild(title);
      info.appendChild(meta);

      const del = document.createElement("button");
      del.className = "delete-btn";
      del.textContent = "Delete";
      del.addEventListener("click", async () => {
        if (!confirm("Delete this workout?")) return;
        try {
          await apiRequest(`/activities/${a.id}`, { method: "DELETE" });
          renderHistoryTab(content);
        } catch (err) {
          alert(err.message);
        }
      });

      item.appendChild(info);
      item.appendChild(del);
      list.appendChild(item);
    });
  } catch (err) {
    list.innerHTML = "";
    const msg = document.createElement("p");
    msg.className = "form-error";
    msg.textContent = err.message;
    list.appendChild(msg);
  }
}

// ---------- Home tab: rings ----------
function ringHTML(label, value, goal, unit, color) {
  const radius = 34;
  const circumference = 2 * Math.PI * radius;
  const fraction = goal > 0 ? Math.min(value / goal, 1) : 0;
  const offset = circumference * (1 - fraction);
  const percent = Math.round(fraction * 100);

  return `
    <div class="ring">
      <svg viewBox="0 0 80 80" width="92" height="92">
        <circle cx="40" cy="40" r="${radius}" fill="none" stroke="#e3edf3" stroke-width="8"></circle>
        <circle cx="40" cy="40" r="${radius}" fill="none" stroke="${color}" stroke-width="8"
          stroke-linecap="round" stroke-dasharray="${circumference}" stroke-dashoffset="${offset}"
          transform="rotate(-90 40 40)"></circle>
        <text x="40" y="45" text-anchor="middle" font-size="16" font-weight="700" fill="#12293a">${percent}%</text>
      </svg>
      <p class="ring-value">${value}</p>
      <p class="ring-label">${label}</p>
      <p class="ring-goal">goal ${goal} ${unit}</p>
    </div>`;
}

async function renderHomeTab(content) {
  content.innerHTML = `
    <div class="card">
      <h2>Today</h2>
      <div id="home-rings"><p class="empty-text">Loading...</p></div>
    </div>`;
  const box = document.getElementById("home-rings");

  try {
    const today = todayString();
    const activities = await apiRequest(`/activities?start=${today}&end=${today}`);
    const user = getUser();

    const totals = activities.reduce(
      (sum, a) => ({
        steps: sum.steps + a.steps,
        calories: sum.calories + a.calories,
        minutes: sum.minutes + a.duration,
      }),
      { steps: 0, calories: 0, minutes: 0 }
    );

    box.innerHTML = `
      <div class="rings">
        ${ringHTML("Steps", totals.steps, user.steps_goal, "", "#14b8a6")}
        ${ringHTML("Calories", totals.calories, user.calories_goal, "kcal", "#1d6a96")}
        ${ringHTML("Minutes", totals.minutes, user.minutes_goal, "min", "#0b3c5d")}
      </div>
      <p class="today-count">${activities.length} workout${activities.length === 1 ? "" : "s"} logged today</p>
    `;
  } catch (err) {
    box.innerHTML = "";
    const msg = document.createElement("p");
    msg.className = "form-error";
    msg.textContent = err.message;
    box.appendChild(msg);
  }
}

// ---------- Home tab: weekly chart ----------
let weekChart = null;

async function renderWeekCard(content) {
  content.insertAdjacentHTML(
    "beforeend",
    `<div class="card">
      <h2>Last 7 days</h2>
      <canvas id="week-chart" height="220"></canvas>
      <p class="form-error" id="week-note"></p>
    </div>`
  );

  // The last 7 days, oldest first, as YYYY-MM-DD
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    days.push(d.toISOString().slice(0, 10));
  }

  try {
    const activities = await apiRequest(`/activities?start=${days[0]}&end=${days[6]}`);

    const canvas = document.getElementById("week-chart");
    if (!canvas) return; // the user already left the Home tab

    const calories = days.map((day) =>
      activities.filter((a) => a.date === day).reduce((sum, a) => sum + a.calories, 0)
    );
    const labels = days.map((day) => day.slice(5));

    if (weekChart) weekChart.destroy();
    weekChart = new Chart(canvas, {
      type: "bar",
      data: {
        labels: labels,
        datasets: [
          {
            label: "Calories burned",
            data: calories,
            backgroundColor: "#14b8a6",
            borderRadius: 6,
          },
        ],
      },
      options: {
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true } },
      },
    });
  } catch (err) {
    const note = document.getElementById("week-note");
    if (note) note.textContent = err.message;
  }
}

// ---------- Profile tab ----------
function renderProfileTab(content) {
  const user = getUser();

  content.innerHTML = `
    <div class="card">
      <h2>My profile</h2>
      <p class="profile-name" id="profile-name"></p>
      <p class="history-meta" id="profile-email"></p>
    </div>

    <div class="card">
      <h2>Daily goals</h2>
      <form id="goals-form">
        <label>Steps per day
          <input type="number" id="goal-steps" min="100" max="100000" required />
        </label>

        <label>Calories per day
          <input type="number" id="goal-calories" min="50" max="20000" required />
        </label>

        <label>Active minutes per day
          <input type="number" id="goal-minutes" min="5" max="1440" required />
        </label>

        <p class="form-error" id="goals-msg"></p>
        <button type="submit" class="primary-btn">Save goals</button>
      </form>
    </div>

    <button id="logout-btn" class="secondary-btn">Log out</button>`;

  document.getElementById("profile-name").textContent = user.name;
  document.getElementById("profile-email").textContent = user.email;
  document.getElementById("goal-steps").value = user.steps_goal;
  document.getElementById("goal-calories").value = user.calories_goal;
  document.getElementById("goal-minutes").value = user.minutes_goal;

  document.getElementById("logout-btn").addEventListener("click", logout);

  const form = document.getElementById("goals-form");
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const msg = document.getElementById("goals-msg");
    const button = form.querySelector("button");
    msg.style.color = "";
    msg.textContent = "";
    button.disabled = true;

    try {
      const updated = await apiRequest("/auth/goals", {
        method: "PUT",
        body: JSON.stringify({
          steps_goal: Number(document.getElementById("goal-steps").value),
          calories_goal: Number(document.getElementById("goal-calories").value),
          minutes_goal: Number(document.getElementById("goal-minutes").value),
        }),
      });
      saveSession(getToken(), updated);
      msg.style.color = "#2e7d32";
      msg.textContent = "Goals saved ✅ Steps goal is now " + updated.steps_goal;
    } catch (err) {
      msg.textContent = err.message;
    } finally {
      button.disabled = false;
    }
  });
}

// ---------- Log out ----------
function logout() {
  clearSession();
  appScreen.classList.add("hidden");
  appScreen.innerHTML = "";
  authScreen.classList.remove("hidden");
}

// ---------- On page load: stay logged in if we have a token ----------
if (getToken()) {
  showApp();
}