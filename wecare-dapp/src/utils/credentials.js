// src/utils/credentials.js
// Seed localStorage with demo credentials and associated Ganache addresses.
// Edited to include the Ganache account addresses you provided.

const defaultCredentials = {
  admin: {
    id: "wecare.admin.001",
    password: "Adm!IT@0183151",
    // Admin on-chain address (Ganache account 0)
    address: "0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1",
  },
  doctors: [
    { id: "DOC_001", password: "P@s$d001", address: "0xFFcf8FDEE72ac11b5c542428B35EEF5769C409f0" }, // account 1
    { id: "DOC_002", password: "P@s$d002", address: "0xE11BA2b4D45Eaed5996Cd0823791E0C93114882d" }, // account 3
    { id: "DOC_003", password: "P@s$d003", address: "0xd03ea8624C8C5987235048901fB614fDcA89b117" }, // account 4
  ],
  patients: [
    {
      id: "PAT_001",
      password: "0x6370fd033278c143179d81c5526140625662b8daa446c22ee2d73db3707e620c",
      name: "Patient One",
      gender: "Female",
      age: "24",
      phone: "999999001",
      // patient1 mapped to Ganache account 2
      address: "0x22d491Bde2303f2f43325b2108D26f1eAbA1e32b",
    },
    {
      id: "PAT_002",
      password: "0x395df67f0c2d2d9fe1ad08d1bc8b6627011959b79c53d7dd6a3536a33ab8a4fd",
      name: "Patient Two",
      gender: "Male",
      age: "30",
      phone: "999999002",
      // patient2 mapped to Ganache account 5
      address: "0x95cED938F7991cd0dFcb48F0a06a40FA1aF46EBC",
    },
    {
      id: "PAT_003",
      password: "0xe485d098507f54e7733a205420dfddbe58db035fa577fc294ebd14db90767a52",
      name: "Patient Three",
      gender: "Other",
      age: "28",
      phone: "999999003",
      // patient3 mapped to Ganache account 6
      address: "0x3E5e9111Ae8eB78Fe1CC3bb8915d5D461F3Ef9A9",
    },
  ],
};

// storage keys
const KEY_ADMIN = "wecare_local_admin";
const KEY_DOCTORS = "wecare_local_doctors";
const KEY_PATIENTS = "wecare_local_patients";

// event name for cross-component notification
export const EVENT_PATIENTS_UPDATED = "wecare:patients-updated";

/**
 * Seed localStorage with default credentials if not already present.
 * OverwriteIf: set {force: true} to overwrite existing values.
 */
export function initLocalCredentials(options = { force: false }) {
  try {
    if (options.force || !localStorage.getItem(KEY_ADMIN)) {
      localStorage.setItem(KEY_ADMIN, JSON.stringify(defaultCredentials.admin));
    }
    if (options.force || !localStorage.getItem(KEY_DOCTORS)) {
      localStorage.setItem(KEY_DOCTORS, JSON.stringify(defaultCredentials.doctors));
    }
    if (options.force || !localStorage.getItem(KEY_PATIENTS)) {
      localStorage.setItem(KEY_PATIENTS, JSON.stringify(defaultCredentials.patients));
    }
  } catch (err) {
    console.error("initLocalCredentials error:", err);
  }
}

// getters
export function getAdminCredential() {
  try { return JSON.parse(localStorage.getItem(KEY_ADMIN)); } catch { return null; }
}
export function getDoctorsList() {
  try { return JSON.parse(localStorage.getItem(KEY_DOCTORS)) || []; } catch { return []; }
}
export function getPatientsList() {
  try { return JSON.parse(localStorage.getItem(KEY_PATIENTS)) || []; } catch { return []; }
}

// lookups
export function findDoctorById(id) {
  const list = getDoctorsList(); return list.find(d => d.id === id) || null;
}
export function findPatientById(id) {
  const list = getPatientsList(); return list.find(p => p.id === id) || null;
}

/**
 * Internal helper: dispatch update event so other components can refresh.
 * This will be fired for same-tab updates as well as same-origin tabs.
 */
function dispatchPatientsUpdatedEvent() {
  try {
    // custom event for same-tab listeners
    window.dispatchEvent(new Event(EVENT_PATIENTS_UPDATED));
    // Also set a timestamp value to trigger storage events across tabs
    localStorage.setItem(`${KEY_PATIENTS}_last_update`, Date.now().toString());
  } catch (err) {
    console.warn("dispatchPatientsUpdatedEvent failed:", err);
  }
}

// update patient profile (doctor or admin may create/update)
export function savePatientProfile(profile) {
  const list = getPatientsList();
  const idx = list.findIndex(p => p.id === profile.id);
  if (idx >= 0) list[idx] = profile; else list.push(profile);
  localStorage.setItem(KEY_PATIENTS, JSON.stringify(list));
  dispatchPatientsUpdatedEvent();
}

// save entire patients list (Admin might use this)
export function savePatientsList(list) {
  if (!Array.isArray(list)) throw new Error("savePatientsList expects an array");
  localStorage.setItem(KEY_PATIENTS, JSON.stringify(list));
  dispatchPatientsUpdatedEvent();
}

/**
 * Subscribe to patient list updates.
 * cb will be called with no arguments whenever patients are updated.
 * Returns an unsubscribe function.
 */
export function subscribeToPatientUpdates(cb) {
  if (typeof cb !== "function") throw new Error("subscribeToPatientUpdates expects a function");

  // same-tab event
  const handler = () => cb();

  // storage event (other tabs / windows)
  const storageHandler = (ev) => {
    if (ev.key === `${KEY_PATIENTS}_last_update`) {
      cb();
    }
  };

  window.addEventListener(EVENT_PATIENTS_UPDATED, handler);
  window.addEventListener("storage", storageHandler);

  // return unsubscribe function
  return () => {
    window.removeEventListener(EVENT_PATIENTS_UPDATED, handler);
    window.removeEventListener("storage", storageHandler);
  };
}
