// Use configuration from config.js
const SUPABASE_URL = CURRENT_CONFIG.supabaseUrl;
const SUPABASE_ANON_KEY = CURRENT_CONFIG.supabaseAnonKey;
const DASHBOARD_URL = CURRENT_CONFIG.dashboardUrl;

const content = document.getElementById("content");

async function init() {
  const { session } = await chrome.storage.local.get("session");
  if (session?.access_token) {
    showLoggedIn(session);
  } else {
    showLogin();
  }
}

function showLogin() {
  content.innerHTML = `
    <div id="error" class="error" style="display:none"></div>
    <input type="email" id="email" placeholder="Email address" />
    <input type="password" id="password" placeholder="Password" />
    <button class="btn-primary" id="loginBtn">Sign in</button>
    <p class="hint">Use your JobHunt France credentials</p>
  `;
  document.getElementById("loginBtn").addEventListener("click", handleLogin);
}

function showLoggedIn(session) {
  content.innerHTML = `
    <div class="logged-in">
      <div class="status"><span class="status-dot"></span> Connected</div>
      <p class="email">${session.user?.email || ""}</p>
      <p class="hint" style="margin-bottom:12px">
        Visit a LinkedIn or WTTJ job page to see the "Save to JobHunt" button
      </p>
      <button class="btn-primary" id="dashboardBtn">View Dashboard</button>
      <button class="btn-outline" id="logoutBtn">Sign out</button>
    </div>
  `;
  document.getElementById("dashboardBtn").addEventListener("click", openDashboard);
  document.getElementById("logoutBtn").addEventListener("click", handleLogout);
}

function openDashboard() {
  chrome.tabs.create({ url: DASHBOARD_URL });
}

async function handleLogin() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  const errorEl = document.getElementById("error");
  errorEl.style.display = "none";

  try {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error_description || data.msg || "Login failed");

    const session = {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      user: data.user,
    };

    await chrome.storage.local.set({ session });
    // Notify content scripts (ignore errors if content script isn't loaded)
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.tabs.sendMessage(tabs[0].id, { type: "AUTH_UPDATED", session }, () => {
          // Ignore errors - content script may not be loaded
          if (chrome.runtime.lastError) {
            console.log('Content script not loaded, which is fine');
          }
        });
      }
    });
    showLoggedIn(session);
  } catch (err) {
    errorEl.textContent = err.message;
    errorEl.style.display = "block";
  }
}

async function handleLogout() {
  await chrome.storage.local.remove("session");
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]?.id) {
      chrome.tabs.sendMessage(tabs[0].id, { type: "AUTH_UPDATED", session: null }, () => {
        // Ignore errors - content script may not be loaded
        if (chrome.runtime.lastError) {
          console.log('Content script not loaded, which is fine');
        }
      });
    }
  });
  showLogin();
}

init();
