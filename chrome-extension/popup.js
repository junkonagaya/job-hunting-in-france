const SUPABASE_URL = "https://dzvilnveshfhxcmmpipo.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR6dmlsbnZlc2hmaHhjbW1waXBvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI5Nzc4NDcsImV4cCI6MjA4ODU1Mzg0N30.Pj7k9ZYMK-jSDl2QBhco6nIpqMPYvIw0UqHde7px1lY";

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
