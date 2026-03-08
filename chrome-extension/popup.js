// ⚠️ IMPORTANT: Replace this with your actual Supabase URL and anon key
const SUPABASE_URL = "YOUR_SUPABASE_URL";
const SUPABASE_ANON_KEY = "YOUR_SUPABASE_ANON_KEY";

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
      <button class="btn-outline" id="logoutBtn">Sign out</button>
    </div>
  `;
  document.getElementById("logoutBtn").addEventListener("click", handleLogout);
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
    // Notify content scripts
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.tabs.sendMessage(tabs[0].id, { type: "AUTH_UPDATED", session });
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
      chrome.tabs.sendMessage(tabs[0].id, { type: "AUTH_UPDATED", session: null });
    }
  });
  showLogin();
}

init();
