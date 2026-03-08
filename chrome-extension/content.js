const SUPABASE_URL = "https://dzvilnveshfhxcmmpipo.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR6dmlsbnZlc2hmaHhjbW1waXBvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI5Nzc4NDcsImV4cCI6MjA4ODU1Mzg0N30.Pj7k9ZYMK-jSDl2QBhco6nIpqMPYvIw0UqHde7px1lY";
const SAVE_JOB_URL = SUPABASE_URL + "/functions/v1/save-job";

let currentSession = null;
let buttonInjected = false;

// Get session on load
chrome.storage.local.get("session", ({ session }) => {
  currentSession = session || null;
  console.log("[JobHunt] Extension loaded, session:", currentSession ? "found" : "none");
  tryInjectButton();
});

// Listen for auth updates from popup
chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === "AUTH_UPDATED") {
    currentSession = msg.session;
    tryInjectButton();
  }
});

function isLinkedIn() {
  return window.location.hostname.includes("linkedin.com");
}

function isWTTJ() {
  return window.location.hostname.includes("welcometothejungle.com");
}

function extractLinkedInJob() {
  // Try multiple selectors for job title - LinkedIn changes these frequently
  const titleSelectors = [
    ".job-details-jobs-unified-top-card__job-title h1",
    ".job-details-jobs-unified-top-card__job-title",
    ".t-24.job-details-jobs-unified-top-card__job-title",
    ".jobs-unified-top-card__job-title",
    "h1.t-24",
    "h1.t-20",
    "h1",
  ];

  let title = "";
  for (const sel of titleSelectors) {
    const el = document.querySelector(sel);
    if (el?.textContent?.trim()) {
      title = el.textContent.trim();
      break;
    }
  }

  // Company name selectors
  const companySelectors = [
    ".job-details-jobs-unified-top-card__company-name a",
    ".job-details-jobs-unified-top-card__company-name",
    ".job-details-jobs-unified-top-card__primary-description-without-tagline a",
    ".jobs-unified-top-card__company-name a",
    ".jobs-unified-top-card__company-name",
    "[data-tracking-control-name='public_jobs_topcard-org-name']",
    ".artdeco-entity-lockup__subtitle",
  ];

  let company = "";
  for (const sel of companySelectors) {
    const el = document.querySelector(sel);
    if (el?.textContent?.trim()) {
      company = el.textContent.trim();
      break;
    }
  }

  // Location selectors
  const locationSelectors = [
    ".job-details-jobs-unified-top-card__bullet",
    ".job-details-jobs-unified-top-card__primary-description span",
    ".jobs-unified-top-card__bullet",
    ".jobs-unified-top-card__workplace-type",
  ];

  let loc = "";
  for (const sel of locationSelectors) {
    const el = document.querySelector(sel);
    if (el?.textContent?.trim()) {
      loc = el.textContent.trim();
      break;
    }
  }

  // Description selectors
  const descSelectors = [
    ".jobs-description__content",
    ".jobs-description-content__text",
    ".jobs-box__html-content",
    "#job-details",
    "[class*='jobs-description']",
  ];

  let description = "";
  for (const sel of descSelectors) {
    const el = document.querySelector(sel);
    if (el?.textContent?.trim()) {
      description = el.textContent.trim();
      break;
    }
  }

  console.log("[JobHunt] Extracted:", { title, company, loc, descLength: description.length });

  return {
    job_title: title,
    company_name: company,
    location: loc,
    job_description: description.substring(0, 5000),
    source: "linkedin",
    source_url: window.location.href.split("?")[0],
  };
}

function extractWTTJJob() {
  const title = document.querySelector("h2[data-testid='job-section-title'], h1")?.textContent?.trim() || "";
  const company = document.querySelector("[data-testid='job-header-organization-name']")?.textContent?.trim()
    || document.querySelector("a[href*='/companies/']")?.textContent?.trim() || "";
  const location = document.querySelector("[data-testid='job-header-location']")?.textContent?.trim() || "";
  const description = document.querySelector("[data-testid='job-section-description']")?.textContent?.trim() || "";

  return {
    job_title: title,
    company_name: company,
    location,
    job_description: description.substring(0, 5000),
    source: "welcometothejungle",
    source_url: window.location.href.split("?")[0],
  };
}

function findLinkedInAnchor() {
  // Try many possible anchor points on LinkedIn job pages
  const selectors = [
    ".job-details-jobs-unified-top-card__content--two-pane",
    ".job-details-jobs-unified-top-card__container",
    ".jobs-unified-top-card",
    ".jobs-unified-top-card__content--two-pane",
    ".job-details-jobs-unified-top-card__primary-description-container",
    ".jobs-search__job-details--container",
    ".jobs-details__main-content",
    // Fallback: find the Apply button's parent
    ".jobs-apply-button--top-card",
  ];

  for (const sel of selectors) {
    const el = document.querySelector(sel);
    if (el) {
      console.log("[JobHunt] Found anchor:", sel);
      return el;
    }
  }

  // Ultimate fallback: find any element containing "Apply" button
  const applyBtn = document.querySelector("button[aria-label*='Apply'], .jobs-apply-button");
  if (applyBtn) {
    const parent = applyBtn.closest("div");
    if (parent) {
      console.log("[JobHunt] Found anchor via Apply button");
      return parent;
    }
  }

  console.log("[JobHunt] No anchor found");
  return null;
}

function tryInjectButton() {
  if (buttonInjected) {
    const btn = document.getElementById("jobhunt-save-btn");
    if (btn) {
      btn.disabled = !currentSession;
      btn.title = currentSession ? "Save to JobHunt France" : "Sign in to JobHunt extension first";
    }
    return;
  }

  console.log("[JobHunt] Trying to inject button...");

  let attempts = 0;
  const maxAttempts = 30; // 30 seconds

  const checkInterval = setInterval(() => {
    attempts++;
    let anchor = null;

    if (isLinkedIn()) {
      anchor = findLinkedInAnchor();
    } else if (isWTTJ()) {
      anchor = document.querySelector("[data-testid='job-header']")?.parentElement
        || document.querySelector("header")?.parentElement;
    }

    if (anchor) {
      clearInterval(checkInterval);
      injectButton(anchor);
    } else if (attempts >= maxAttempts) {
      clearInterval(checkInterval);
      console.log("[JobHunt] Gave up finding anchor after", maxAttempts, "attempts");
      // Inject as floating button instead
      injectFloatingButton();
    }
  }, 1000);
}

function injectButton(anchor) {
  const wrapper = document.createElement("div");
  wrapper.id = "jobhunt-wrapper";

  const btn = createButton();
  wrapper.appendChild(btn);

  anchor.insertAdjacentElement("afterend", wrapper);
  buttonInjected = true;
  console.log("[JobHunt] Button injected!");
}

function injectFloatingButton() {
  const wrapper = document.createElement("div");
  wrapper.id = "jobhunt-wrapper";
  wrapper.style.cssText = "position:fixed; bottom:24px; right:24px; z-index:99999;";

  const btn = createButton();
  wrapper.appendChild(btn);

  document.body.appendChild(wrapper);
  buttonInjected = true;
  console.log("[JobHunt] Floating button injected!");
}

function createButton() {
  const btn = document.createElement("button");
  btn.id = "jobhunt-save-btn";
  btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg> Save to JobHunt 🇫🇷`;
  btn.disabled = !currentSession;
  btn.title = currentSession ? "Save to JobHunt France" : "Sign in to JobHunt extension first";
  btn.addEventListener("click", handleSave);
  return btn;
}

async function handleSave() {
  const btn = document.getElementById("jobhunt-save-btn");
  if (!currentSession?.access_token) {
    btn.textContent = "⚠ Sign in first";
    setTimeout(() => { btn.innerHTML = `Save to JobHunt 🇫🇷`; }, 2000);
    return;
  }

  btn.disabled = true;
  btn.textContent = "Saving...";

  try {
    const jobData = isLinkedIn() ? extractLinkedInJob() : extractWTTJJob();

    if (!jobData.job_title && !jobData.company_name) {
      throw new Error("Could not extract job details");
    }

    const res = await fetch(SAVE_JOB_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${currentSession.access_token}`,
        apikey: SUPABASE_ANON_KEY,
      },
      body: JSON.stringify(jobData),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to save");

    btn.innerHTML = `✓ Saved!`;
    btn.classList.add("jobhunt-saved");
    setTimeout(() => {
      btn.innerHTML = `Save to JobHunt 🇫🇷`;
      btn.classList.remove("jobhunt-saved");
      btn.disabled = false;
    }, 3000);
  } catch (err) {
    console.error("[JobHunt] Save error:", err);
    btn.textContent = `✗ ${err.message}`;
    setTimeout(() => {
      btn.innerHTML = `Save to JobHunt 🇫🇷`;
      btn.disabled = false;
    }, 3000);
  }
}

// Re-inject on SPA navigation (LinkedIn uses SPA)
let lastUrl = location.href;
new MutationObserver(() => {
  if (location.href !== lastUrl) {
    lastUrl = location.href;
    buttonInjected = false;
    const old = document.getElementById("jobhunt-wrapper");
    if (old) old.remove();
    setTimeout(tryInjectButton, 1500);
  }
}).observe(document.body, { subtree: true, childList: true });
