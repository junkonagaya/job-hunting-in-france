# Chrome Extension Configuration Guide

## Switching Between Environments

The extension can work in both **development** and **production** modes.

### Development Mode (Default)
- Dashboard URL: `http://localhost:8080`
- Used when testing locally

### Production Mode
- Dashboard URL: Your deployed app URL
- Used when the extension is published

## How to Switch Environments

1. Open `chrome-extension/config.js`
2. Find this line:
   ```javascript
   const ENVIRONMENT = 'development';
   ```
3. Change it to:
   ```javascript
   const ENVIRONMENT = 'production';
   ```

## Setting Your Production URL

Before publishing your extension:

1. Deploy your dashboard to a hosting service (Netlify, Vercel, etc.)
2. Open `chrome-extension/config.js`
3. Update the production dashboard URL:
   ```javascript
   production: {
     dashboardUrl: "https://your-actual-app-url.netlify.app", // UPDATE THIS
     ...
   }
   ```

## Quick Setup Checklist

- [ ] Test extension in development mode (`ENVIRONMENT = 'development'`)
- [ ] Deploy dashboard to production
- [ ] Update `production.dashboardUrl` in `config.js`
- [ ] Change `ENVIRONMENT` to `'production'`
- [ ] Test extension with production dashboard
- [ ] Reload extension in Chrome (`chrome://extensions/`)

## Troubleshooting

**"View Dashboard" button opens wrong URL:**
- Check `ENVIRONMENT` value in `config.js`
- Verify the correct URL is set for your environment
- Reload the extension in Chrome

**Dashboard doesn't load:**
- Make sure your dashboard is running (dev) or deployed (prod)
- Check browser console for errors
- Verify Supabase credentials match
