const API_URL = "http://127.0.0.1:8000";

// ---------- Session (who is logged in) ----------
function saveSession(token, user) {
  localStorage.setItem("fittrack_token", token);
  localStorage.setItem("fittrack_user", JSON.stringify(user));
}

function getToken() {
  return localStorage.getItem("fittrack_token");
}

function getUser() {
  try {
    return JSON.parse(localStorage.getItem("fittrack_user"));
  } catch (e) {
    return null;
  }
}

function clearSession() {
  localStorage.removeItem("fittrack_token");
  localStorage.removeItem("fittrack_user");
}

// ---------- Talking to the backend ----------
async function apiRequest(path, options = {}) {
  const headers = { "Content-Type": "application/json" };
  const token = getToken();
  if (token) {
    headers["Authorization"] = "Bearer " + token;
  }

  let response;
  try {
    response = await fetch(API_URL + path, { ...options, headers });
  } catch (e) {
    throw new Error("Cannot reach the server. Is the backend running?");
  }

  if (response.status === 204) {
    return null;
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    let message = "Something went wrong. Please try again.";
    if (data && typeof data.detail === "string") {
      message = data.detail;
    } else if (data && Array.isArray(data.detail)) {
      message = "Please check the information you entered.";
    }
    throw new Error(message);
  }

  return data;
}