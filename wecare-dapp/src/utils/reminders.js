// src/utils/reminders.js
// LocalStorage helper functions for reminders (per patientId)

export function remindersKey(patientId) {
  return `wecare_local_reminders_${patientId}`;
}

export function getReminders(patientId) {
  try {
    const raw = localStorage.getItem(remindersKey(patientId)) || "[]";
    return JSON.parse(raw);
  } catch (e) {
    console.error("getReminders parse error", e);
    return [];
  }
}

export function saveReminders(patientId, list) {
  localStorage.setItem(remindersKey(patientId), JSON.stringify(list || []));
}

export function addReminder(patientId, reminder) {
  const list = getReminders(patientId);
  list.push(reminder);
  saveReminders(patientId, list);
}

export function updateReminder(patientId, id, patch) {
  const list = getReminders(patientId).map(r => (r.id === id ? { ...r, ...patch } : r));
  saveReminders(patientId, list);
}

export function removeReminder(patientId, id) {
  const list = getReminders(patientId).filter(r => r.id !== id);
  saveReminders(patientId, list);
}
