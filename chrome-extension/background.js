// Background service worker - handles token refresh
chrome.alarms.create("refreshToken", { periodInMinutes: 50 });

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name !== "refreshToken") return;

  const { session } = await chrome.storage.local.get("session");
  if (!session?.refresh_token) return;

  try {
    const SUPABASE_URL = "YOUR_SUPABASE_URL";
    const SUPABASE_ANON_KEY = "YOUR_SUPABASE_ANON_KEY";

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
