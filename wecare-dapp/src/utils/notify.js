// src/utils/notify.js
// Notification helper (Browser Notifications API)

export async function requestNotificationPermission() {
  if (!("Notification" in window)) return false;
  try {
    const perm = await Notification.requestPermission();
    return perm === "granted";
  } catch (e) {
    console.warn("Notification request failed", e);
    return false;
  }
}

// title: string, body: string, onClickUrl optional
export function showNotification(title, body, onClickUrl) {
  if (!("Notification" in window) || Notification.permission !== "granted") return null;
  try {
    const n = new Notification(title, { body, icon: "/favicon.ico" });
    if (onClickUrl) n.onclick = () => { window.focus(); window.location.href = onClickUrl; };
    return n;
  } catch (e) {
    console.warn("showNotification failed", e);
    return null;
  }
}
