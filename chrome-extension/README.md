# JobHunt France — Chrome Extension

This Chrome extension adds a "Save to JobHunt" button on LinkedIn and Welcome to the Jungle job pages.

## Setup

1. Open `chrome://extensions/` in Chrome
2. Enable **Developer mode** (top right)
3. Click **Load unpacked** and select this `chrome-extension` folder
4. Click the extension icon and log in with your JobHunt France credentials

## Files

- `manifest.json` — Extension config
- `popup.html` / `popup.js` — Login popup
- `content.js` — Injects the "Save to JobHunt" button on job pages
- `background.js` — Manages auth state
