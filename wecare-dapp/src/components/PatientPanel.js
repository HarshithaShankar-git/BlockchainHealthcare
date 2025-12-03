// src/pages/PatientPanel.js
import React, { useEffect, useState, useCallback } from "react";
import { Snackbar, Button, TextField, Divider, IconButton } from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import VisibilityIcon from "@mui/icons-material/Visibility";
import AddIcon from "@mui/icons-material/Add";
import LogoutIcon from "@mui/icons-material/Logout";
import { motion } from "framer-motion";

import NavMenu from "../components/NavMenu";
import { loadWeb3AndContract } from "../utils/web3";
import { getReminders, addReminder, saveReminders, removeReminder } from "../utils/reminders";
import { scheduleReminders, clearTimersForPatient } from "../utils/scheduler";
import { requestNotificationPermission, showNotification } from "../utils/notify";

// visuals
import logoImg from "../assets/Logo.png";
import bgImg from "../assets/Blurblue.avif";

// centralized credential helpers
import {
  initLocalCredentials,
  getPatientsList,
  subscribeToPatientUpdates,
  findPatientById,
} from "../utils/credentials";

/*
  Robust formatDateTime:
  - Accepts Number, string or BigInt
  - Handles input that is in seconds or milliseconds
  - Returns readable local string or empty string on failure
*/
function formatDateTime(ts) {
  try {
    if (ts === undefined || ts === null) return "";

    // Convert BigInt -> Number (safe for typical unix timestamps)
    if (typeof ts === "bigint") {
      ts = Number(ts);
    }

    // If it's a numeric string, convert to Number
    if (typeof ts === "string" && /^\d+$/.test(ts)) {
      ts = Number(ts);
    }

    // If it's a string but not pure digits, try Date.parse
    if (typeof ts === "string") {
      const parsed = Date.parse(ts);
      if (!Number.isNaN(parsed)) {
        return new Date(parsed).toLocaleString();
      }
      return "";
    }

    // Now ts is (hopefully) a Number
    if (typeof ts !== "number") return "";

    // Determine if ts is seconds or milliseconds:
    // - timestamps in seconds will be < 1e12 (approx)
    // - timestamps in ms usually > 1e12 (since 1970)
    const maybeMs = ts > 1e12 ? ts : ts * 1000;
    if (!Number.isFinite(maybeMs) || Number.isNaN(maybeMs)) return "";
    return new Date(maybeMs).toLocaleString();
  } catch (e) {
    console.warn("formatDateTime error", e, ts);
    return "";
  }
}

const PatientPanel = () => {
  useEffect(() => { if (typeof initLocalCredentials === "function") initLocalCredentials(); }, []);

  // Login / auth
  const [patientIdInput, setPatientIdInput] = useState("");
  const [patientPwdInput, setPatientPwdInput] = useState("");
  const [patientAuth, setPatientAuth] = useState(false);

  // Profile + records
  const [profile, setProfile] = useState(null);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);

  // Reminders UI
  const [reminders, setReminders] = useState([]);
  const [newTitle, setNewTitle] = useState("");
  const [newTimeISO, setNewTimeISO] = useState("");

  // Snackbar
  const [snackOpen, setSnackOpen] = useState(false);
  const [snackMsg, setSnackMsg] = useState("");
  const [snackColor, setSnackColor] = useState("green");

  const showSnack = (msg, color = "green") => {
    setSnackMsg(msg); setSnackColor(color); setSnackOpen(true);
  };

  // login using seeded local credentials (findPatientById)
  const handlePatientLogin = () => {
    const p = typeof findPatientById === "function" ? findPatientById(patientIdInput) : null;
    if (!p) { showSnack("Patient ID not found (seeded).", "#d2132d"); return; }
    if (p.password === patientPwdInput) {
      setProfile(p);
      setPatientAuth(true);
      const r = getReminders(p.id);
      setReminders(r);
      showSnack("Patient authenticated", "green");
      if (p.address) fetchRecords(p.address);
    } else {
      showSnack("Password mismatch", "#d2132d");
    }
  };

  const handleLogout = () => {
    if (profile) clearTimersForPatient(profile.id);
    setPatientAuth(false);
    setProfile(null);
    setRecords([]);
    setReminders([]);
    setPatientIdInput("");
    setPatientPwdInput("");
    showSnack("Logged out", "#8E44AD"); // purple logout feedback
  };

  // Fetch records from smart contract (robust normalization)
  const fetchRecords = useCallback(async (patientAddress) => {
    try {
      setLoading(true);
      const { contract, accounts } = await loadWeb3AndContract();
      const raw = await contract.methods.getRecords(patientAddress).call({ from: accounts[0] });

      // Debug log to inspect return shape (optional)
      // console.debug("raw records:", raw);

      // Normalize: ensure each record is an object { patientName, data, timestamp }
      const normalized = (raw || []).map((r) => {
        let patientName = "";
        let data = "";
        let timestamp = 0;

        if (Array.isArray(r)) {
          patientName = r[0] ?? "";
          data = r[1] ?? "";
          timestamp = r[2] ?? 0;
        } else if (r && typeof r === "object") {
          patientName = r.patientName ?? r[0] ?? "";
          data = r.data ?? r[1] ?? "";
          timestamp = r.timestamp ?? r[2] ?? 0;
        } else {
          data = String(r);
        }

        // Convert timestamp BigInt/string -> Number
        if (typeof timestamp === "bigint") {
          timestamp = Number(timestamp);
        } else if (typeof timestamp === "string" && /^\d+$/.test(timestamp)) {
          timestamp = Number(timestamp);
        } else if (typeof timestamp === "string") {
          const parsed = Date.parse(timestamp);
          timestamp = Number.isNaN(parsed) ? 0 : parsed;
        } else if (typeof timestamp !== "number") {
          timestamp = 0;
        }

        // At this point timestamp may be in seconds or ms. formatDateTime handles both.
        return {
          patientName: String(patientName || ""),
          data: String(data || ""),
          timestamp: timestamp || 0
        };
      });

      setRecords(Array.isArray(normalized) ? normalized : []);
      setLoading(false);
      showSnack("Records fetched", "green");
    } catch (err) {
      console.error("fetchRecords error", err);
      setLoading(false);
      showSnack("Failed to fetch records: " + (err.message || err), "#d2132d");
    }
  }, []);

  // schedule reminders whenever profile/reminders change
  useEffect(() => {
    if (!patientAuth || !profile) return;
    requestNotificationPermission();
    scheduleReminders(profile.id, reminders, (rem) => {
      showNotification("WeCare Reminder", rem.title || "Reminder");
      showSnack(`Reminder: ${rem.title}`, "green");
      if (!rem.repeat) {
        const updated = getReminders(profile.id).map(r => (r.id === rem.id ? { ...r, done: true } : r));
        saveReminders(profile.id, updated);
        setReminders(updated);
      }
    });
    return () => { if (profile) clearTimersForPatient(profile.id); };
  }, [patientAuth, profile, reminders]);

  // when patient logs in, fetch records & reminders
  useEffect(() => {
    if (patientAuth && profile) {
      if (profile.address) fetchRecords(profile.address);
      const r = getReminders(profile.id);
      setReminders(r);
    }
  }, [patientAuth, profile, fetchRecords]);

  // Subscribe to patient list updates so this panel refreshes automatically
  useEffect(() => {
    const unsubscribe = subscribeToPatientUpdates(() => {
      try {
        if (patientAuth && profile && profile.id) {
          const latest = findPatientById(profile.id);
          if (latest) {
            setProfile(latest);
            if (latest.address && latest.address !== profile.address) {
              fetchRecords(latest.address);
            }
          } else {
            showSnack("Your patient profile was removed externally. Logging out.", "#d2132d");
            handleLogout();
          }
        }
      } catch (err) {
        console.warn("subscribe callback error:", err);
      }
    });

    return () => {
      if (typeof unsubscribe === "function") unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patientAuth, profile, fetchRecords]);

  // add a new reminder
  const handleAddReminder = () => {
    if (!profile) { showSnack("Open a patient account first", "#d2132d"); return; }
    if (!newTitle || !newTimeISO) { showSnack("Provide title and datetime", "#d2132d"); return; }
    const ms = Date.parse(newTimeISO);
    if (Number.isNaN(ms)) { showSnack("Invalid date/time", "#d2132d"); return; }
    const rem = { id: "r" + Date.now(), title: newTitle, time: ms, repeat: false, done: false };
    addReminder(profile.id, rem);
    const updated = getReminders(profile.id);
    setReminders(updated);
    setNewTitle(""); setNewTimeISO("");
    showSnack("Reminder saved", "green");
  };

  const handleDeleteReminder = (id) => {
    if (!profile) return;
    removeReminder(profile.id, id);
    const updated = getReminders(profile.id);
    setReminders(updated);
    showSnack("Reminder removed", "#14B8A6");
  };

  const handleTestNow = (rem) => {
    showNotification("WeCare Reminder (Test)", rem.title || "Reminder");
    showSnack("Test notification sent", "green");
  };

  const handleViewFile = (cid) => {
    const url = `https://ipfs.io/ipfs/${cid}`;
    window.open(url, "_blank", "noopener");
  };

  // design palette + fonts
  const font = "'Times New Roman', Times, serif";
  const primaryBlue = "#3d67a5ff";
  const purpleAccent = "#2986b5ff";
  const greenAccent = "#3783c6ff";
  const detailsBg = "#afd3f5ff"; // soft pale blue for detail cards
  const detailsText = "#05293A"; // dark text for readability

  // layout styles
  const pageStyle = { minHeight: "100vh", display: "flex", alignItems: "stretch", fontFamily: font, backgroundColor: "#f5f7f8" };

  // LEFT logo pane shown only when NOT authenticated
  const leftPane = {
    flex: "0 0 45%",
    minWidth: 360,
    display: patientAuth ? "none" : "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "linear-gradient(180deg,#051329,#0b3566)",
    padding: 24,
    boxSizing: "border-box"
  };
  const logoStyle = { width: "72%", maxWidth: 520, height: "auto", borderRadius: 10, boxShadow: "0 20px 48px rgba(5,20,48,0.55)" };

  // RIGHT login pane (light blue)
  const rightPane = { flex: 1, position: "relative", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, boxSizing: "border-box" };
  const rightBackground = { position: "absolute", inset: 0, background: "linear-gradient(180deg,#e9f2ff 0%, #cfe8ff 100%)", zIndex: 1 };
  const rightTint = { position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(255,255,255,0.16), rgba(255,255,255,0.08))", zIndex: 2 };
  const loginCard = { position: "relative", zIndex: 3, width: 520, maxWidth: "94%", background: "rgba(255,255,255,0.98)", padding: 24, borderRadius: 10, boxShadow: "0 12px 32px rgba(6,18,40,0.08)", boxSizing: "border-box" };

  // content after login
  const contentWrapper = { position: "relative", flex: 1 };
  const afterBg = { position: "absolute", inset: 0, backgroundImage: `url(${bgImg})`, backgroundSize: "cover", backgroundPosition: "center", zIndex: 0, filter: "saturate(90%)" };
  const afterTint = { position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(6,29,62,0.36), rgba(6,29,62,0.36))", zIndex: 1 };
  const afterContent = { position: "relative", zIndex: 2, padding: 24 };

  // header, boxes
  const headerCenter = { textAlign: "center", marginBottom: 12 };
  const timesStyle = { fontFamily: font, fontSize: 36, color: patientAuth ? "#FFFFFF" : "#FFFFFF" };
  const titleStyle = { fontSize: 20, color: patientAuth ? "#EAF6FF" : "#333" };

  const twoCols = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginTop: 12, alignItems: "start" };
  const detailCard = { background: detailsBg, padding: 18, borderRadius: 8, boxShadow: "0 4px 20px rgba(0,0,0,0.04)", color: detailsText };
  const remindersBox = { background: "rgba(255,255,255,0.06)", padding: 18, borderRadius: 8, boxShadow: "0 4px 20px rgba(0,0,0,0.06)", height: "100%", color: "#fff" };
  const recordItem = { padding: 12, borderRadius: 8, marginBottom: 10, background: "#f8f7ff", display: "flex", justifyContent: "space-between", alignItems: "center" };

  // small navicon at top-left to ensure visibility (best-effort toggle)
  const handleNavIconClick = () => {
    const navEl = document.querySelector("nav");
    if (navEl) {
      navEl.classList.toggle("open");
      return;
    }
    const nm = document.querySelector("#navmenu-root");
    if (nm) nm.classList.toggle("open");
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={pageStyle}>
      {/* visible small nav icon so user can open nav easily */}
      <div style={{ position: "absolute", left: 12, top: 12, zIndex: 60 }}>
        <IconButton onClick={handleNavIconClick} size="small" aria-label="menu" sx={{ bgcolor: "transparent" }}>
          <MenuIcon sx={{ color: patientAuth ? "#fff" : "#fff" }} />
        </IconButton>
      </div>

      <NavMenu />

      {/* LEFT logo pane (hidden after login) */}
      <div style={leftPane}>
        <img src={logoImg} alt="WeCare" style={logoStyle} />
      </div>

      {/* RIGHT: login OR main content depending on auth */}
      {!patientAuth ? (
        <div style={rightPane}>
          <div style={rightBackground} aria-hidden="true" />
          <div style={rightTint} aria-hidden="true" />

          <div style={loginCard}>
            <div style={headerCenter}>
              <div style={{ fontFamily: font, fontSize: 28 }}>Welcome to Patient Panel</div>
            </div>

            <div style={{ marginBottom: 12 }}>
              <TextField label="Patient ID" fullWidth value={patientIdInput} onChange={(e) => setPatientIdInput(e.target.value)} size="small" InputLabelProps={{ style: { fontFamily: font } }} />
            </div>
            <div style={{ marginBottom: 12 }}>
              <TextField label="Password" fullWidth type="password" value={patientPwdInput} onChange={(e) => setPatientPwdInput(e.target.value)} size="small" InputLabelProps={{ style: { fontFamily: font } }} />
            </div>

            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <Button variant="outlined" onClick={() => { setPatientIdInput(""); setPatientPwdInput(""); }} sx={{ borderColor: purpleAccent, color: purpleAccent }}>Clear</Button>
              <Button variant="contained" onClick={handlePatientLogin} sx={{ backgroundColor: primaryBlue, color: "#fff" }}>Login</Button>
            </div>
          </div>
        </div>
      ) : (
        <div style={contentWrapper}>
          <div style={afterBg} aria-hidden="true" />
          <div style={afterTint} aria-hidden="true" />

          <div style={afterContent}>
            {/* Logout button (purple) top-right */}
            {patientAuth && (
              <div style={{ position: "absolute", right: 20, top: 18, zIndex: 3 }}>
                <Button variant="contained" onClick={handleLogout} startIcon={<LogoutIcon />} sx={{ backgroundColor: purpleAccent, color: "#fff" }}>
                  Logout
                </Button>
              </div>
            )}

            <div style={headerCenter}>
              <div style={timesStyle}>WeCare</div>
              <div style={titleStyle}>PATIENT ACCOUNT</div>
            </div>

            {patientAuth && profile && (
              <>
                <div style={twoCols}>
                  <div style={detailCard}>
                    <div style={{ fontWeight: 600, marginBottom: 8, color: detailsText }}>Patient Details</div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 8 }}>
                      <div style={{ color: detailsText }}><b>Patient ID:</b> {profile.id}</div>
                      <div style={{ color: detailsText }}><b>Ethereum Address:</b> {profile.address || "Not set"}</div>
                      <div style={{ color: detailsText }}><b>Name:</b> {profile.name || "—"}</div>
                      <div style={{ color: detailsText }}><b>DOB:</b> {profile.dob || "—"}</div>
                    </div>
                  </div>

                  <div style={detailCard}>
                    <div style={{ fontWeight: 600, marginBottom: 8, color: detailsText }}>More Info</div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 8 }}>
                      <div style={{ color: detailsText }}><b>Age:</b> {profile.age || "—"}</div>
                      <div style={{ color: detailsText }}><b>Gender:</b> {profile.gender || "—"}</div>
                      <div style={{ color: detailsText }}><b>Blood Group:</b> {profile.bloodGroup || "—"}</div>
                      <div style={{ color: detailsText }}><b>Phone:</b> {profile.phone || "—"}</div>
                    </div>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 20, marginTop: 18 }}>
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ fontSize: 16, margin: "12px 0", color: "#fff" }}><b>MEDICAL HISTORY</b></div>
                      <div>
                        <Button variant="outlined" onClick={() => { if (profile.address) fetchRecords(profile.address); }} sx={{ borderColor: primaryBlue, color: primaryBlue }}>
                          Refresh
                        </Button>
                      </div>
                    </div>

                    <div style={{ marginTop: 8 }}>
                      {loading && <div style={{ color: "#fff" }}>Loading records...</div>}
                      {!loading && records.length === 0 && <div style={{ color: "#DCEEFF" }}>No records found.</div>}
                      {records.map((rec, idx) => (
                        <div style={recordItem} key={idx}>
                          <div>
                            <div><b>{rec.patientName}</b></div>
                            <div style={{ fontSize: 12, color: "#444" }}>{formatDateTime(rec.timestamp)}</div>
                          </div>
                          <div style={{ display: "flex", gap: 8 }}>
                            <Button variant="outlined" size="small" startIcon={<VisibilityIcon />} onClick={() => handleViewFile(rec.data)} sx={{ borderColor: purpleAccent, color: purpleAccent }}>
                              View
                            </Button>
                            <a href={`https://ipfs.io/ipfs/${rec.data}`} target="_blank" rel="noreferrer" style={{ alignSelf: "center", color: "#DCEEFF", fontSize: 12 }}>Open</a>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div style={remindersBox}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ fontWeight: 600, color: "#fff" }}>Reminders</div>
                      <div>
                        <Button size="small" variant="contained" startIcon={<AddIcon />} onClick={() => { /* focus on form */ }} sx={{ backgroundColor: primaryBlue, color: "#fff" }}>
                          Set Reminder
                        </Button>
                      </div>
                    </div>

                    <div style={{ marginTop: 12 }}>
                      <TextField fullWidth label="Title" size="small" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} InputLabelProps={{ style: { color: "#fff", fontFamily: font } }} />
                      <div style={{ height: 8 }} />
                      <TextField
                        fullWidth
                        label="Date & Time"
                        type="datetime-local"
                        size="small"
                        value={newTimeISO}
                        onChange={(e) => setNewTimeISO(e.target.value)}
                        InputLabelProps={{ shrink: true, style: { color: "#fff", fontFamily: font } }}
                      />
                      <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                        <Button variant="contained" onClick={handleAddReminder} sx={{ backgroundColor: greenAccent, color: "#fff" }}>Save</Button>
                        <Button variant="outlined" onClick={() => { setNewTitle(""); setNewTimeISO(""); }} sx={{ borderColor: purpleAccent, color: purpleAccent }}>Clear</Button>
                      </div>
                      <div style={{ marginTop: 10 }}>
                        <Button size="small" onClick={() => {
                          const rem = { id: "r" + Date.now(), title: "Demo: take meds", time: Date.now() + 30 * 1000, repeat: false, done: false };
                          addReminder(profile.id, rem);
                          const updated = getReminders(profile.id);
                          setReminders(updated);
                          showSnack("Demo reminder seeded (30s).", "green");
                        }} style={{ color: "#fff", background: "transparent", border: "none" }}>Quick Demo (30s)</Button>
                      </div>
                    </div>

                    <Divider style={{ margin: "12px 0", borderColor: "rgba(255,255,255,0.06)" }} />

                    <div style={{ maxHeight: 360, overflow: "auto" }}>
                      {reminders.length === 0 && <div style={{ color: "#DCEEFF" }}>No reminders set.</div>}
                      {reminders.map(r => (
                        <div key={r.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px dashed rgba(255,255,255,0.06)" }}>
                          <div>
                            <div style={{ fontWeight: 600, color: "#fff" }}>{r.title}</div>
                            <div style={{ fontSize: 12, color: "#DCEEFF" }}>{formatDateTime(r.time)} {r.done ? "(done)" : ""}</div>
                          </div>
                          <div style={{ display: "flex", gap: 8 }}>
                            <Button size="small" variant="outlined" onClick={() => handleTestNow(r)} sx={{ borderColor: purpleAccent, color: purpleAccent }}>Test</Button>
                            <Button size="small" variant="contained" onClick={() => handleDeleteReminder(r.id)} sx={{ backgroundColor: greenAccent, color: "#fff" }}>Delete</Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <Snackbar
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        open={snackOpen}
        onClose={() => setSnackOpen(false)}
        autoHideDuration={3500}
        message={<span style={{ display: "flex", alignItems: "center", color: snackColor === "green" ? "#D7FFE9" : "#FFD4D4" }}><CheckCircleIcon sx={{ mr: 1, color: snackColor === "green" ? "#D7FFE9" : "#FFD4D4" }} />{snackMsg}</span>}
      />
    </motion.div>
  );
};

export default PatientPanel;
