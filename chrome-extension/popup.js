// Use configuration from config.js
const SUPABASE_URL = CURRENT_CONFIG.supabaseUrl;
const SUPABASE_ANON_KEY = CURRENT_CONFIG.supabaseAnonKey;
const DASHBOARD_URL = CURRENT_CONFIG.dashboardUrl;

const content = document.getElementById("content");
let onboardingStep = 0;

const onboardingSlides = [
  {
    emoji: "🇫🇷",
    title: "Welcome to JobHunt France",
    description: "Save jobs from LinkedIn & Welcome to the Jungle in one click — and track your entire search from one dashboard."
  },
  {
    emoji: null,
    title: "How it works",
    description: "Three simple steps to organize your job search:",
    steps: [
      { icon: "🔍", label: "Browse jobs" },
      { icon: "💾", label: "Click Save" },
      { icon: "📊", label: "Dashboard" }
    ]
  },
  {
    emoji: "🚀",
    title: "Get Started",
    description: "Sign in with your JobHunt France account, or <a href='https://job-hunting-in-france.lovable.app' target='_blank'>create one here</a> if you're new."
  }
];

async function init() {
  const { onboarding_complete, session } = await chrome.storage.local.get(["onboarding_complete", "session"]);
  if (!onboarding_complete) {
    onboardingStep = 0;
    showOnboarding();
  } else if (session?.access_token) {
    showLoggedIn(session);
  } else {
    showLogin();
  }
}

function renderDots(current, total) {
  return `<div class="dots">${Array.from({ length: total }, (_, i) =>
    `<span class="dot${i === current ? ' active' : ''}"></span>`
  ).join("")}</div>`;
}

function showOnboarding() {
  const slide = onboardingSlides[onboardingStep];
  const isLast = onboardingStep === onboardingSlides.length - 1;

  let body = "";
  if (slide.emoji) {
    body += `<div class="onboarding-emoji">${slide.emoji}</div>`;
  }
  body += `<h2>${slide.title}</h2>`;
  body += `<p>${slide.description}</p>`;

  if (slide.steps) {
    body += `<div class="onboarding-steps">`;
    slide.steps.forEach((s, i) => {
      body += `<div class="onboarding-step">
        <div class="step-icon">${s.icon}</div>
        <div class="step-label">${s.label}</div>
      </div>`;
    });
    body += `</div>`;
  }

  body += renderDots(onboardingStep, onboardingSlides.length);
  body += `<button class="btn-primary" id="nextBtn">${isLast ? "Let's go!" : "Next"}</button>`;
  body += `<button class="skip-link" id="skipBtn">Skip</button>`;

  content.innerHTML = `<div class="onboarding">${body}</div>`;

  document.getElementById("nextBtn").addEventListener("click", async () => {
    if (isLast) {
      await finishOnboarding();
    } else {
      onboardingStep++;
      showOnboarding();
    }
  });
  document.getElementById("skipBtn").addEventListener("click", finishOnboarding);
}

async function finishOnboarding() {
  await chrome.storage.local.set({ onboarding_complete: true });
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
  const userEmail = session.user?.email || "";
  const shortEmail = userEmail.length > 25 ? userEmail.substring(0, 22) + "..." : userEmail;

  content.innerHTML = `
    <div class="logged-in">
      <div class="status"><span class="status-dot"></span> Connected</div>
      <p class="email">${userEmail}</p>
      <p class="hint" style="margin-bottom:12px">
        Visit a LinkedIn or WTTJ job page to see the "Save to JobHunt" button
      </p>
      <button class="btn-primary" id="dashboardBtn">View Dashboard (${shortEmail})</button>
      <button class="btn-outline" id="logoutBtn">Sign out</button>
    </div>
  `;
  document.getElementById("dashboardBtn").addEventListener("click", () => openDashboard(session));
  document.getElementById("logoutBtn").addEventListener("click", handleLogout);
}

function openDashboard(session) {
  // Pass auth token to dashboard via URL hash for auto-login
  const accessToken = session?.access_token || "";
  const refreshToken = session?.refresh_token || "";

  if (accessToken && refreshToken) {
    // Encode tokens in URL hash (more secure than query params)
    const authData = btoa(JSON.stringify({
      access_token: accessToken,
      refresh_token: refreshToken,
      user: session.user
    }));
    chrome.tabs.create({ url: `${DASHBOARD_URL}#auth=${authData}` });
  } else {
    chrome.tabs.create({ url: DASHBOARD_URL });
  }
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
          chrome.runtime.lastError;
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
        chrome.runtime.lastError;
      });
    }
  });
  showLogin();
}

init();
