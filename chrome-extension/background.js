// Background service worker - handles token refresh
chrome.alarms.create("refreshToken", { periodInMinutes: 50 });

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name !== "refreshToken") return;

  const { session } = await chrome.storage.local.get("session");
  if (!session?.refresh_token) return;

  try {
    const SUPABASE_URL = "https://dzvilnveshfhxcmmpipo.supabase.co";
    const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR6dmlsbnZlc2hmaHhjbW1waXBvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI5Nzc4NDcsImV4cCI6MjA4ODU1Mzg0N30.Pj7k9ZYMK-jSDl2QBhco6nIpqMPYvIw0UqHde7px1lY";

    const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({ refresh_token: session.refresh_token }),
    });

    if (res.ok) {
      const data = await res.json();
      await chrome.storage.local.set({
        session: {
          access_token: data.access_token,
          refresh_token: data.refresh_token,
          user: data.user,
        },
      });
    }
  } catch (err) {
    console.error("Token refresh failed:", err);
  }
});
