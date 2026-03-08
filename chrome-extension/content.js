// ⚠️ IMPORTANT: Replace with your actual values
const SUPABASE_URL = "YOUR_SUPABASE_URL";
const SUPABASE_ANON_KEY = "YOUR_SUPABASE_ANON_KEY";
const SAVE_JOB_URL = SUPABASE_URL + "/functions/v1/save-job";

let currentSession = null;
let buttonInjected = false;

// Get session on load
chrome.storage.local.get("session", ({ session }) => {
  currentSession = session || null;
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
  const title = document.querySelector(".job-details-jobs-unified-top-card__job-title h1, .t-24.job-details-jobs-unified-top-card__job-title")?.textContent?.trim()
    || document.querySelector("h1")?.textContent?.trim() || "";

  const company = document.querySelector(".job-details-jobs-unified-top-card__company-name a, .job-details-jobs-unified-top-card__primary-description-without-tagline a")?.textContent?.trim()
    || document.querySelector("[data-tracking-control-name='public_jobs_topcard-org-name']")?.textContent?.trim() || "";

  const location = document.querySelector(".job-details-jobs-unified-top-card__bullet")?.textContent?.trim()
    || document.querySelector(".job-details-jobs-unified-top-card__primary-description span")?.textContent?.trim() || "";

  const description = document.querySelector(".jobs-description__content, .jobs-box__html-content, #job-details")?.textContent?.trim() || "";

  return {
    job_title: title,
    company_name: company,
    location,
    job_description: description.substring(0, 5000),
    source: "linkedin",
    source_url: window.location.href.split("?")[0],
  };
}

function extractWTTJJob() {
  const title = document.querySelector("h2[data-testid='job-section-title'], h1")?.textContent?.trim() || "";
  const company = document.querySelector("[data-testid='job-header-organization-name'], .sc-dAbbOL")?.textContent?.trim()
    || document.querySelector("a[href*='/companies/']")?.textContent?.trim() || "";
  const location = document.querySelector("[data-testid='job-header-location']")?.textContent?.trim() || "";
  const description = document.querySelector("[data-testid='job-section-description'], .sc-bXCLTC")?.textContent?.trim() || "";

  return {
    job_title: title,
    company_name: company,
    location,
    job_description: description.substring(0, 5000),
    source: "welcometothejungle",
    source_url: window.location.href.split("?")[0],
  };
}

function tryInjectButton() {
  if (buttonInjected) {
    // Update existing button state
    const btn = document.getElementById("jobhunt-save-btn");
    if (btn) {
      btn.disabled = !currentSession;
      btn.title = currentSession ? "Save to JobHunt France" : "Sign in to JobHunt extension first";
    }
    return;
  }

  // Wait for job content to load
  const checkInterval = setInterval(() => {
    let anchor = null;

    if (isLinkedIn()) {
      anchor = document.querySelector(".job-details-jobs-unified-top-card__content--two-pane, .jobs-unified-top-card, .job-details-jobs-unified-top-card__container");
    } else if (isWTTJ()) {
      anchor = document.querySelector("[data-testid='job-header'], header, .sc-dAbbOL")?.parentElement;
    }

    if (anchor) {
      clearInterval(checkInterval);
      injectButton(anchor);
    }
  }, 1000);

  // Stop checking after 15s
  setTimeout(() => clearInterval(checkInterval), 15000);
}

function injectButton(anchor) {
  const wrapper = document.createElement("div");
  wrapper.id = "jobhunt-wrapper";

  const btn = document.createElement("button");
  btn.id = "jobhunt-save-btn";
  btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg> Save to JobHunt 🇫🇷`;
  btn.disabled = !currentSession;
  btn.title = currentSession ? "Save to JobHunt France" : "Sign in to JobHunt extension first";

  btn.addEventListener("click", handleSave);

  wrapper.appendChild(btn);
  anchor.insertAdjacentElement("afterend", wrapper);
  buttonInjected = true;
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
      throw new Error("Could not extract job details from page");
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
