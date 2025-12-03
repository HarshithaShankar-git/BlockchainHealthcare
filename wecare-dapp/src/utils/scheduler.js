// src/utils/scheduler.js
// Simple in-page scheduler that schedules reminders while the app is open.
// Note: if browser/tab is closed reminders won't run. For cross-device persistence you'd need a backend.

const timers = {}; // map key => timeout id

export function clearTimersForPatient(patientId) {
  Object.keys(timers).forEach(k => {
    if (k.startsWith(`${patientId}_`)) {
      clearTimeout(timers[k]);
      delete timers[k];
    }
  });
}

// reminders: array of { id, title, time (ms epoch), repeat (false or 'daily'/'weekly'), done }
export function scheduleReminders(patientId, reminders, onFire) {
  // clear existing timers for this patient
  clearTimersForPatient(patientId);

  reminders.forEach(rem => {
    if (rem.done) return;
    const ms = rem.time - Date.now();
    const key = `${patientId}_${rem.id}`;
    if (ms <= 0) {
      // if past due, fire immediately
      setTimeout(() => {
        onFire && onFire(rem);
        // do not reschedule automatically here; caller can update if repeat
      }, 0);
    } else {
      timers[key] = setTimeout(() => {
        onFire && onFire(rem);
        // caller decides to mark done or reschedule
      }, ms);
    }
  });
}
