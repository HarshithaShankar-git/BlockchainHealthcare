// src/pages/AdminPanel.js
import React, { useEffect, useState } from "react";
import { Snackbar, Button, TextField } from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import InfoIcon from "@mui/icons-material/Info";
import { motion } from "framer-motion";
import adminImg from "../assets/Admin.jpg";
import bgImg from "../assets/Blurblue.avif";
import logoImg from "../assets/Logo.png";
import NavMenu from "../components/NavMenu";
import { loadWeb3AndContract } from "../utils/web3";
import {
  initLocalCredentials,
  getAdminCredential,
  getDoctorsList,
  getPatientsList,
  savePatientProfile
} from "../utils/credentials";

function timestampNow() { return new Date().toISOString(); }

// local doctor helpers
const LS_DOCTORS = "wecare_local_doctors";
function readDoctors() { try { return JSON.parse(localStorage.getItem(LS_DOCTORS) || "[]"); } catch { return []; } }
function saveDoctors(list) { localStorage.setItem(LS_DOCTORS, JSON.stringify(list || [])); }

const AdminPanel = () => {

  useEffect(() => { if (typeof initLocalCredentials === "function") initLocalCredentials(); }, []);

  const [adminId, setAdminId] = useState("");
  const [adminPwd, setAdminPwd] = useState("");
  const [adminAuth, setAdminAuth] = useState(false);

  const [view, setView] = useState("menu");

  const [docId, setDocId] = useState("");
  const [docAddr, setDocAddr] = useState("");

  const [pId, setPId] = useState("");
  const [pPassword, setPPassword] = useState("");
  const [pAddr, setPAddr] = useState("");
  const [pName, setPName] = useState("");
  const [pDob, setPDob] = useState("");
  const [pAge, setPAge] = useState("");
  const [pGender, setPGender] = useState("");
  const [pBlood, setPBlood] = useState("");
  const [pPhone, setPPhone] = useState("");

  const [doctorsList, setDoctorsList] = useState(getDoctorsList());
  const [patientsList, setPatientsList] = useState(getPatientsList());

  const [status, setStatus] = useState("");
  const [snackOpen, setSnackOpen] = useState(false);
  const [snackMsg, setSnackMsg] = useState("");
  const [snackColor, setSnackColor] = useState("green");

  const showSnack = (msg, color = "green") => { setSnackMsg(msg); setSnackColor(color); setSnackOpen(true); };

  const handleAdminLogin = () => {
    const cred = getAdminCredential();
    if (!cred) { showSnack("Admin credential seed missing.", "#d2132d"); return; }
    if (adminId === cred.id && adminPwd === cred.password) {
      setAdminAuth(true);
      setView("menu");
      showSnack("ACCESS ALLOWED", "green");
    } else showSnack("ACCESS DENIED", "#d2132d");
  };

  const handleRegisterDoctor = async () => {
    if (!docId || !docAddr) { showSnack("Provide Doctor ID and Wallet Address.", "#d2132d"); return; }
    try {
      setStatus("Sending on-chain transaction (MetaMask)...");
      const { accounts, contract } = await loadWeb3AndContract();
      const tx = await contract.methods.registerDoctor(docAddr).send({ from: accounts[0] });
      const now = timestampNow();

      const list = readDoctors();
      list.push({ id: docId, address: docAddr, registeredAt: now, txHash: tx.transactionHash });
      saveDoctors(list);
      setDoctorsList(list);

      setDocId(""); setDocAddr("");
      setStatus("");
      showSnack("Doctor registered successfully.", "green");

    } catch (err) { showSnack("Registration failed: " + err.message, "#d2132d"); }
  };

  const handleRegisterPatient = () => {
    if (!pId || !pPassword || !pAddr || !pName) {
      showSnack("Provide Patient ID, Password, ETH Address & Name.", "#d2132d");
      return;
    }

    try {
      const newPatient = {
        id: pId.trim(),
        password: pPassword,
        address: pAddr.trim(),
        name: pName,
        dob: pDob,
        age: pAge,
        gender: pGender,
        bloodGroup: pBlood,
        phone: pPhone,
        registeredAt: timestampNow()
      };

      savePatientProfile(newPatient);
      setPatientsList(getPatientsList());

      setPId(""); setPPassword(""); setPAddr(""); setPName("");
      setPDob(""); setPAge(""); setPGender(""); setPBlood(""); setPPhone("");

      showSnack("Patient registered locally.", "green");

    } catch (err) { showSnack("Failed: " + err.message, "#d2132d"); }
  };

  const checkDoctorsOnChainStatus = async () => {
    try {
      const { contract } = await loadWeb3AndContract();
      const list = readDoctors();
      const results = await Promise.all(
        list.map(async d => {
          try { return { ...d, onChain: await contract.methods.doctors(d.address).call() }; }
          catch { return { ...d, onChain: false }; }
        })
      );
      setDoctorsList(results);
    } catch {
      showSnack("On-chain status check failed.", "#1E90FF");
    }
  };

  const dedupeById = (arr) => {
    const seen = new Set();
    return arr.filter(item => {
      if (seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    });
  };

  // -----------------------
  // LOGIN SCREEN UI
  // -----------------------
  if (!adminAuth) {
    return (
      <div style={{ minHeight: "100vh", fontFamily: "'Times New Roman', serif" }}>
        <NavMenu /> {/* ⭐ NAVICON ADDED BACK */}

        <div style={{ display: "flex", minHeight: "100vh" }}>

          {/* LEFT HALF - LOGO */}
          <div style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "linear-gradient(180deg,#051329,#0b3566)"
          }}>
            <img src={logoImg} alt="logo" style={{
              width: "70%", maxWidth: 520, borderRadius: 12,
              boxShadow: "0 24px 48px rgba(7,32,70,0.55)"
            }} />
          </div>

          {/* RIGHT HALF - LOGIN FORM */}
          <div style={{
            flex: 1,
            position: "relative",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}>
            <div style={{
              position: "absolute",
              inset: 0,
              backgroundImage: `url(${bgImg})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              filter: "blur(2px)"
            }} />

            <div style={{
              position: "absolute",
              inset: 0,
              background: "rgba(0,0,0,0.25)"
            }} />

            {/* LOGIN CARD */}
            <div style={{
              position: "relative",
              width: 440, background: "rgba(255,255,255,0.96)",
              padding: 28, borderRadius: 10, color: "#111"
            }}>

              <div style={{ textAlign: "center", marginBottom: 12 }}>
                <div style={{ fontSize: 36 }}>WeCare</div>

                {/* ⭐ ADDED WELCOME LINE */}
                <div style={{
                  fontSize: 26,
                  marginTop: 6,
                  fontWeight: 600,
                  fontFamily: "'Times New Roman', serif"
                }}>
                  Welcome to Admin Panel
                </div>
              </div>

              <TextField
                label="Admin ID"
                fullWidth
                size="small"
                value={adminId}
                onChange={(e) => setAdminId(e.target.value)}
                style={{ marginBottom: 12 }}
              />

              <TextField
                label="Password"
                type="password"
                fullWidth
                size="small"
                value={adminPwd}
                onChange={(e) => setAdminPwd(e.target.value)}
                style={{ marginBottom: 18 }}
              />

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
                <Button variant="outlined" onClick={() => { setAdminId(""); setAdminPwd(""); }}>Clear</Button>
                <Button variant="contained" onClick={handleAdminLogin}>Login</Button>
              </div>

            </div>
          </div>
        </div>

        <Snackbar
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
          open={snackOpen}
          onClose={() => setSnackOpen(false)}
          message={<span style={{ display: "flex", alignItems: "center", color: snackColor }}>
            {snackColor === "green"
              ? <CheckCircleIcon sx={{ mr: 1, color: "green" }} />
              : <InfoIcon sx={{ mr: 1, color: "red" }} />}
            {snackMsg}
          </span>}
          autoHideDuration={3500}
        />

      </div>
    );
  }

  // -----------------------
  // AFTER LOGIN (same as your version)
  // -----------------------
  return (
    <div style={{
      minHeight: "100vh",
      backgroundImage: `linear-gradient(rgba(0,0,0,0.18),rgba(0,0,0,0.18)),url(${bgImg})`,
      backgroundSize: "cover",
      backgroundAttachment: "fixed",
      fontFamily: "'Times New Roman', serif"
    }}>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>

        <NavMenu /> {/* ⭐ NAVICON STILL HERE */}

        <div style={{ padding: 28, color: "white" }}>

          {/* HEADER */}
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: 36 }}>WeCare</div>
              <div>
                {view === "menu" ? "Admin Dashboard"
                  : view === "registerDoctor" ? "Doctor Registration"
                  : view === "registerPatient" ? "Patient Registration"
                  : view === "listDoctors" ? "Registered Doctors"
                  : "Registered Patients"}
              </div>
            </div>

            <Button variant="contained" onClick={() => { setAdminAuth(false); showSnack("Logged out", "#1E90FF"); }}>
              Logout
            </Button>
          </div>

          {/* -------- MENU -------- */}
          {view === "menu" && (
            <div style={{ marginTop: 20, display: "flex", flexDirection: "column", width: 360, gap: 12 }}>
              <Button variant="contained" onClick={() => setView("registerDoctor")}>REGISTER A DOCTOR</Button>
              <Button variant="contained" onClick={() => setView("registerPatient")}>REGISTER A PATIENT</Button>
              <Button variant="outlined" onClick={() => { setView("listDoctors"); checkDoctorsOnChainStatus(); }}>View Registered Doctors</Button>
              <Button variant="outlined" onClick={() => { setView("listPatients"); setPatientsList(getPatientsList()); }}>View Registered Patients</Button>
            </div>
          )}

          {/* -------- REGISTER DOCTOR -------- */}
          {view === "registerDoctor" && (
            <div style={{ marginTop: 20 }}>
              <TextField fullWidth size="small" label="Doctor ID" value={docId} onChange={(e) => setDocId(e.target.value)} style={{ marginBottom: 12 }} />
              <TextField fullWidth size="small" label="Doctor Ethereum Address" value={docAddr} onChange={(e) => setDocAddr(e.target.value)} style={{ marginBottom: 12 }} />

              <div style={{ display: "flex", gap: 12 }}>
                <Button variant="contained" onClick={handleRegisterDoctor}>Register</Button>
                <Button variant="outlined" onClick={() => { setDocId(""); setDocAddr(""); }}>Clear</Button>
              </div>

              <div style={{ marginTop: 20 }}>
                <Button variant="text" onClick={() => setView("menu")} style={{ color: "white" }}>Go Back</Button>
              </div>
            </div>
          )}

          {/* -------- REGISTER PATIENT -------- */}
          {view === "registerPatient" && (
            <div style={{ marginTop: 20 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <TextField size="small" fullWidth label="Patient ID" value={pId} onChange={(e) => setPId(e.target.value)} />
                <TextField size="small" fullWidth label="Password" value={pPassword} onChange={(e) => setPPassword(e.target.value)} />
                <TextField size="small" fullWidth label="Ethereum Address" value={pAddr} onChange={(e) => setPAddr(e.target.value)} />
                <TextField size="small" fullWidth label="Name" value={pName} onChange={(e) => setPName(e.target.value)} />
                <TextField size="small" fullWidth label="DOB" value={pDob} onChange={(e) => setPDob(e.target.value)} />
                <TextField size="small" fullWidth label="Age" value={pAge} onChange={(e) => setPAge(e.target.value)} />
                <TextField size="small" fullWidth label="Gender" value={pGender} onChange={(e) => setPGender(e.target.value)} />
                <TextField size="small" fullWidth label="Blood Group" value={pBlood} onChange={(e) => setPBlood(e.target.value)} />
                <TextField size="small" fullWidth label="Phone" value={pPhone} onChange={(e) => setPPhone(e.target.value)} />
              </div>

              <div style={{ marginTop: 12, display: "flex", gap: 12 }}>
                <Button variant="contained" onClick={handleRegisterPatient}>Add Patient</Button>
                <Button variant="outlined" onClick={() => {
                  setPId(""); setPPassword(""); setPAddr(""); setPName("");
                  setPDob(""); setPAge(""); setPGender(""); setPBlood(""); setPPhone("");
                }}>Clear</Button>
              </div>

              <div style={{ marginTop: 20 }}>
                <Button variant="text" onClick={() => setView("menu")} style={{ color: "white" }}>Go Back</Button>
              </div>
            </div>
          )}

          {/* -------- LIST DOCTORS -------- */}
          {view === "listDoctors" && (
            <div style={{ marginTop: 20 }}>
              <table style={{ width: "100%", borderCollapse: "collapse", color: "white" }}>
                <thead>
                  <tr>
                    <th style={{ padding: 8 }}>Doctor ID</th>
                    <th style={{ padding: 8 }}>Address</th>
                    <th style={{ padding: 8 }}>Registered At</th>
                    <th style={{ padding: 8 }}>On-Chain</th>
                  </tr>
                </thead>
                <tbody>
                  {dedupeById(doctorsList).map((d, i) => (
                    <tr key={i}>
                      <td style={{ padding: 8 }}>{d.id}</td>
                      <td style={{ padding: 8 }}>{d.address}</td>
                      <td style={{ padding: 8 }}>{d.registeredAt}</td>
                      <td style={{ padding: 8 }}>{d.onChain ? "Yes" : "No"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div style={{ marginTop: 12 }}>
                <Button variant="contained" onClick={checkDoctorsOnChainStatus}>Refresh On-Chain</Button>
                <Button variant="text" onClick={() => setView("menu")} style={{ marginLeft: 12, color: "white" }}>
                  Go Back
                </Button>
              </div>
            </div>
          )}

          {/* -------- LIST PATIENTS -------- */}
          {view === "listPatients" && (
            <div style={{ marginTop: 20 }}>
              <table style={{ width: "100%", borderCollapse: "collapse", color: "white" }}>
                <thead>
                  <tr>
                    <th style={{ padding: 8 }}>Patient ID</th>
                    <th style={{ padding: 8 }}>Address</th>
                    <th style={{ padding: 8 }}>Name</th>
                    <th style={{ padding: 8 }}>Registered At</th>
                  </tr>
                </thead>
                <tbody>
                  {dedupeById(patientsList).map((p, i) => (
                    <tr key={i}>
                      <td style={{ padding: 8 }}>{p.id}</td>
                      <td style={{ padding: 8 }}>{p.address}</td>
                      <td style={{ padding: 8 }}>{p.name}</td>
                      <td style={{ padding: 8 }}>{p.registeredAt}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div style={{ marginTop: 12 }}>
                <Button variant="contained" onClick={() => setPatientsList(getPatientsList())}>Refresh</Button>
                <Button variant="text" onClick={() => setView("menu")} style={{ marginLeft: 12, color: "white" }}>
                  Go Back
                </Button>
              </div>
            </div>
          )}

        </div>

        <Snackbar
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
          open={snackOpen}
          onClose={() => setSnackOpen(false)}
          autoHideDuration={3500}
          message={<span style={{ display: "flex", alignItems: "center", color: snackColor }}>
            <CheckCircleIcon sx={{ mr: 1, color: snackColor }} />
            {snackMsg}
          </span>}
        />

      </motion.div>
    </div>
  );
};

export default AdminPanel;
