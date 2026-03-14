

## Chrome Extension Onboarding Plan

Add a 3-step onboarding flow that shows on first install, guiding users through setup before they see the login screen.

### Onboarding Steps

1. **Welcome** — "Welcome to JobHunt France 🇫🇷" with brief tagline: "Save jobs from LinkedIn & Welcome to the Jungle in one click"
2. **How it works** — 3 mini icons showing: Browse jobs → Click Save → View in Dashboard
3. **Get Started** — "Sign in or create an account on JobHunt France to start saving jobs" with a link to the web app for signup + transition to the login form

### Flow Logic
- Use `chrome.storage.local` to track `onboarding_complete` flag
- On first open: show step 1 → 2 → 3 → login screen
- On subsequent opens: skip straight to login/logged-in view
- Dot indicators at bottom for progress (step 1/2/3)
- "Next" button to advance, "Skip" link to jump to login

### Files to Change

1. **`chrome-extension/popup.js`** — Add `showOnboarding()` function with step state management, update `init()` to check onboarding flag first
2. **`chrome-extension/popup.html`** — Add CSS styles for onboarding slides (step cards, dot indicators, illustrations using emoji/SVG icons)

### Design
- Same warm terracotta palette (#c47a3a, #f9f7f4) matching dashboard
- Emoji-based illustrations (🔍 💾 📊) to keep it lightweight (no image assets needed)
- Compact layout fitting within the 320px popup width

