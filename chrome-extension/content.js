const SUPABASE_URL = "https://dzvilnveshfhxcmmpipo.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR6dmlsbnZlc2hmaHhjbW1waXBvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI5Nzc4NDcsImV4cCI6MjA4ODU1Mzg0N30.Pj7k9ZYMK-jSDl2QBhco6nIpqMPYvIw0UqHde7px1lY";
const SAVE_JOB_URL = SUPABASE_URL + "/functions/v1/save-job";

let currentSession = null;
let buttonInjected = false;
let savedJobs = [];

// DEBUG: Log that content script loaded
console.log("[JobHunt] Content script loaded on:", window.location.href);

// Get session and saved jobs on load
chrome.storage.local.get(["session", "savedJobs"], ({ session, savedJobs: saved }) => {
  currentSession = session || null;
  savedJobs = saved || [];
  console.log("[JobHunt] Session retrieved:", currentSession ? "Yes" : "No");
  console.log("[JobHunt] Saved jobs count:", savedJobs.length);
  console.log("[JobHunt] Is job page?", isJobPage());
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
  return window.location.hostname.includes("welcometothejungle");
}

function isJobPage() {
  if (isLinkedIn()) return window.location.pathname.includes("/jobs");
  if (isWTTJ()) return window.location.pathname.includes("/jobs/");
  return false;
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
  console.log("[JobHunt] Extracting WTTJ job data...");

  // Title - try multiple selectors
  const titleSelectors = [
    "h1",
    "h2",
    "h3",
    "h2[data-testid='job-section-title']",
    "[data-testid='job-header-title']",
    "h1[class*='Title']",
    "h2[class*='Title']",
    "[class*='JobHeader'] h1",
    "[class*='JobHeader'] h2",
  ];
  let title = "";
  for (const sel of titleSelectors) {
    const el = document.querySelector(sel);
    if (el?.textContent?.trim() && el.textContent.trim().length > 3) {
      title = el.textContent.trim();
      console.log("[JobHunt] Found title with selector:", sel, "=>", title);
      break;
    }
  }

  // Company
  const companySelectors = [
    "[data-testid='job-header-organization-name']",
    "a[href*='/companies/']",
    "a[href*='/companies/'] span",
    "[class*='organization'] a",
    "[class*='Company'] a",
    "a[class*='company']",
  ];
  let company = "";
  for (const sel of companySelectors) {
    const el = document.querySelector(sel);
    if (el?.textContent?.trim() && el.textContent.trim().length > 1) {
      company = el.textContent.trim();
      console.log("[JobHunt] Found company with selector:", sel, "=>", company);
      break;
    }
  }

  // Location
  const locationSelectors = [
    "[data-testid='job-header-location']",
    "[class*='location']",
    "i[name='location'] + span",
  ];
  let location = "";
  for (const sel of locationSelectors) {
    const el = document.querySelector(sel);
    if (el?.textContent?.trim()) { location = el.textContent.trim(); break; }
  }

  // Description
  const descSelectors = [
    "[data-testid='job-section-description']",
    "[class*='description'] [class*='content']",
    "section[class*='description']",
    "article",
  ];
  let description = "";
  for (const sel of descSelectors) {
    const el = document.querySelector(sel);
    if (el?.textContent?.trim() && el.textContent.trim().length > 50) {
      description = el.textContent.trim();
      break;
    }
  }

  console.log("[JobHunt] Extracted WTTJ data:", { title, company, location });

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
  console.log("[JobHunt] tryInjectButton called, buttonInjected:", buttonInjected);

  // Check if button already exists (prevent duplicates)
  const existing = document.getElementById("jobhunt-save-btn");
  if (existing) {
    console.log("[JobHunt] Button already exists, skipping injection");
    return;
  }

  if (!isJobPage()) {
    console.log("[JobHunt] Not a job page, skipping injection");
    return;
  }

  console.log("[JobHunt] Injecting button...");
  // Try to inject inline near job title first, fallback to floating if fails
  if (!injectInlineButton()) {
    injectFloatingButton();
  }
}

function injectInlineButton() {
  console.log("[JobHunt] injectInlineButton called");

  let titleContainer = null;
  let insertionStyle = "display:inline-flex; margin-left:12px; vertical-align:middle;";

  // Check if we're on WTTJ or LinkedIn
  if (isWTTJ()) {
    console.log("[JobHunt] Detected WTTJ page");
    // For WTTJ, look for the main job title h1
    const h1Elements = document.querySelectorAll("h1");
    for (const h1 of h1Elements) {
      const text = h1.textContent?.trim();
      // Find h1 that looks like a job title (not navigation text)
      if (text && text.length > 5 && text.length < 100) {
        titleContainer = h1;
        console.log("[JobHunt] Found WTTJ title:", text.substring(0, 50));
        // For WTTJ, use block display and margin-top
        insertionStyle = "display:block; margin-top:16px;";
        break;
      }
    }
  } else if (isLinkedIn()) {
    console.log("[JobHunt] Detected LinkedIn page");
    // LinkedIn selectors
    const linkedInSelectors = [
      ".job-details-jobs-unified-top-card__job-title",
      ".jobs-unified-top-card__job-title",
      ".job-details-jobs-unified-top-card__container--two-pane",
      ".jobs-unified-top-card__content--two-pane",
    ];

    for (const sel of linkedInSelectors) {
      const el = document.querySelector(sel);
      if (el) {
        titleContainer = el;
        console.log("[JobHunt] Found LinkedIn title container:", sel);
        break;
      }
    }
  }

  if (!titleContainer) {
    console.log("[JobHunt] Could not find title container, falling back to floating");
    return false;
  }

  // Remove any existing button
  const existing = document.getElementById("jobhunt-wrapper");
  if (existing) existing.remove();

  const wrapper = document.createElement("div");
  wrapper.id = "jobhunt-wrapper";
  wrapper.style.cssText = insertionStyle;

  const btn = createButton();
  wrapper.appendChild(btn);

  // Try to insert after the title element
  if (titleContainer.parentElement) {
    titleContainer.parentElement.insertBefore(wrapper, titleContainer.nextSibling);
    buttonInjected = true;
    console.log("[JobHunt] Inline button injected successfully!");
    return true;
  }

  console.log("[JobHunt] Could not insert inline button, falling back to floating");
  return false;
}

function injectFloatingButton() {
  console.log("[JobHunt] injectFloatingButton called");

  // Remove any existing button
  const existing = document.getElementById("jobhunt-wrapper");
  if (existing) existing.remove();

  const wrapper = document.createElement("div");
  wrapper.id = "jobhunt-wrapper";
  wrapper.style.cssText = "position:fixed; bottom:24px; right:24px; z-index:99999;";

  const btn = createButton();
  wrapper.appendChild(btn);

  document.body.appendChild(wrapper);
  buttonInjected = true;

  console.log("[JobHunt] Button injected successfully!");
}

function createButton() {
  const btn = document.createElement("button");
  btn.id = "jobhunt-save-btn";

  // Check if current job is already saved
  const currentUrl = window.location.href.split("?")[0];
  const isSaved = savedJobs.includes(currentUrl);

  if (isSaved) {
    btn.innerHTML = `✓ Job Saved`;
    btn.disabled = true;
    btn.classList.add("jobhunt-saved");
    btn.title = "Already saved to JobHunt France";
  } else {
    btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg> Save to JobHunt 🇫🇷`;
    btn.disabled = !currentSession;
    btn.title = currentSession ? "Save to JobHunt France" : "Sign in to JobHunt extension first";
    btn.addEventListener("click", handleSave);
  }

  return btn;
}

async function handleSave() {
  const btn = document.getElementById("jobhunt-save-btn");
  if (!currentSession?.access_token) {
    btn.textContent = "⚠ Sign in first";
    setTimeout(() => { btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg> Save to JobHunt 🇫🇷`; }, 2000);
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

    // Save to local storage for future reference
    const currentUrl = window.location.href.split("?")[0];
    savedJobs.push(currentUrl);
    await chrome.storage.local.set({ savedJobs });

    // Permanently change button to "Job Saved"
    btn.innerHTML = `✓ Job Saved`;
    btn.classList.add("jobhunt-saved");
    btn.disabled = true;
    btn.title = "Already saved to JobHunt France";
    btn.removeEventListener("click", handleSave);
  } catch (err) {
    btn.textContent = `✗ ${err.message}`;
    setTimeout(() => {
      btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg> Save to JobHunt 🇫🇷`;
      btn.disabled = false;
    }, 3000);
  }
}

// Re-inject on SPA navigation (LinkedIn uses SPA)
let lastUrl = location.href;
let retryCount = 0;
const maxRetries = 10;

function handleNavigation() {
  console.log("[JobHunt] Navigation detected, URL:", location.href);
  buttonInjected = false;
  const old = document.getElementById("jobhunt-wrapper");
  if (old) old.remove();

  retryCount = 0;
  retryInjectButton();
}

function retryInjectButton() {
  if (!isJobPage()) {
    console.log("[JobHunt] Not a job page, stopping retries");
    return;
  }

  if (retryCount >= maxRetries) {
    console.log("[JobHunt] Max retries reached");
    return;
  }

  retryCount++;
  console.log(`[JobHunt] Retry attempt ${retryCount}/${maxRetries}`);

  tryInjectButton();

  // Keep retrying if button didn't inject successfully
  if (!document.getElementById("jobhunt-save-btn")) {
    setTimeout(retryInjectButton, 500);
  } else {
    console.log("[JobHunt] Button successfully injected!");
  }
}

// Watch for URL changes
new MutationObserver(() => {
  if (location.href !== lastUrl) {
    lastUrl = location.href;
    handleNavigation();
  }
}).observe(document.body, { subtree: true, childList: true });

// Also watch for job details container appearing (LinkedIn & WTTJ)
const jobDetailsObserver = new MutationObserver((mutations) => {
  for (const mutation of mutations) {
    for (const node of mutation.addedNodes) {
      if (node.nodeType === 1) { // Element node
        // Check if this is a job details container (LinkedIn or WTTJ)
        if (node.matches && (
          // LinkedIn
          node.matches('.jobs-details__main-content') ||
          node.matches('.job-details-jobs-unified-top-card__container--two-pane') ||
          node.querySelector('.job-details-jobs-unified-top-card__job-title') ||
          // Welcome to the Jungle
          node.matches('h1') ||
          node.matches('h2') ||
          node.querySelector('h1') ||
          node.querySelector('h2')
        )) {
          console.log("[JobHunt] Job details container detected!");
          setTimeout(() => {
            const existing = document.getElementById("jobhunt-save-btn");
            if (!existing && isJobPage()) {
              retryCount = 0;
              retryInjectButton();
            }
          }, 300);
        }
      }
    }
  }
});

jobDetailsObserver.observe(document.body, {
  childList: true,
  subtree: true
});
