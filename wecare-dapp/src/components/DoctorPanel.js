// src/pages/DoctorPanel.js
import React, { useEffect, useState } from "react";
import { Snackbar, Button, TextField, IconButton } from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { motion } from "framer-motion";
import doctorBg from "../assets/Doctors.jpg";
import NavMenu from "../components/NavMenu";
import { loadWeb3AndContract } from "../utils/web3";
import { uploadFileToIPFS } from "../utils/ipfs";
import { initLocalCredentials, findDoctorById, findPatientById, savePatientProfile } from "../utils/credentials";
import { useNavigate } from "react-router-dom";
import logoImg from "../assets/Logo.png";
import bgImg from "../assets/Blurblue.avif";

const DoctorPanel = () => {
  useEffect(() => { initLocalCredentials(); }, []);

  const navigate = useNavigate();

  // local login fields
  const [doctorId, setDoctorId] = useState("");
  const [doctorPwd, setDoctorPwd] = useState("");
  const [doctorAuth, setDoctorAuth] = useState(false);

  // patient selection
  const [patientId, setPatientId] = useState("");
  const [patientProfile, setPatientProfile] = useState(null);
  const [patientPwdInput, setPatientPwdInput] = useState("");

  // upload (kept for doctor-side upload fallback)
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState("");

  // snack bottom-right
  const [snackOpen, setSnackOpen] = useState(false);
  const [snackMsg, setSnackMsg] = useState("");
  const [snackColor, setSnackColor] = useState("green");

  // web3 / contract
  const [contractLoaded, setContractLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        await loadWeb3AndContract();
        setContractLoaded(true);
      } catch (err) {
        console.warn("web3 helper not ready:", err);
      }
    })();
  }, []);

  const showSnack = (msg, color = "green") => { setSnackMsg(msg); setSnackColor(color); setSnackOpen(true); };

  // local doctor login check
  const handleDoctorLogin = () => {
    const doc = findDoctorById(doctorId);
    if (!doc) { showSnack("Doctor ID not found (check seeded list).", "#d2132d"); return; }
    // allow missing seeded password field (some seed entries don't have a password) - but prefer equality
    if (doc.password === doctorPwd) {
      setDoctorAuth(true);
      showSnack("Doctor authenticated (local) — proceed.", "green");
    } else {
      showSnack("Incorrect doctor password.", "#d2132d");
    }
  };

  // select patient by ID (opens patient account route when successful)
  const handleOpenPatientAccount = () => {
    const prof = findPatientById(patientId);
    if (!prof) { showSnack("Patient ID not found. Create patient profile first.", "#d2132d"); return; }
    if (patientPwdInput !== prof.password) {
      showSnack("Patient password mismatch.", "#d2132d");
      return;
    }
    setPatientProfile(prof);
    showSnack("Patient verified — opening patient account...", "green");

    // pass profile via route state and navigate to patient account
    setTimeout(() => {
      navigate("/doctor/patient-account", { state: { patientProfile: prof } });
    }, 500);
  };

  // create or update patient profile (doctor can create) - retained but not shown when asking for patient creds after doctor login
  const handleCreatePatient = () => {
    if (!patientId) { showSnack("Enter a Patient ID to create.", "#d2132d"); return; }
    const name = window.prompt("Patient name:", patientId) || patientId;
    const dob = window.prompt("DOB (YYYY-MM-DD):", "1995-01-01") || "1995-01-01";
    const gender = window.prompt("Gender: (Female/Male/Other)", "Female") || "Female";
    const age = window.prompt("Age:", "30") || "30";
    const blood = window.prompt("Blood Group:", "O+") || "O+";
    const phone = window.prompt("Phone number:", "") || "";
    const pwd = window.prompt("Set a password for patient (demo):", "") || "";
    if (!pwd) { showSnack("Patient password required.", "#d2132d"); return; }
    const profile = { id: patientId, password: pwd, name, dob, gender, age, bloodGroup: blood, phone, address: "" };
    savePatientProfile(profile);
    setPatientProfile(profile);
    showSnack("Patient profile created (local demo).", "green");
    setTimeout(() => navigate("/doctor/patient-account", { state: { patientProfile: profile } }), 500);
  };

  // file selection (kept optional - upload can be done from patient account page)
  const handleFileChange = (e) => { if (e.target.files && e.target.files[0]) setFile(e.target.files[0]); };

  // fallback upload here (rarely used; uploading should be done in PatientAccount page)
  const handleUploadAndSaveFallback = async () => {
    try {
      if (!doctorAuth) { showSnack("Please login as doctor first.", "#d2132d"); return; }
      if (!patientProfile) { showSnack("Select a patient first.", "#d2132d"); return; }
      if (!file) { showSnack("Choose a file to upload.", "#d2132d"); return; }

      setStatus("Uploading file to IPFS...");
      const cid = await uploadFileToIPFS(file);
      setStatus("IPFS uploaded: " + cid + " — sending tx...");

      const { accounts, contract } = await loadWeb3AndContract();
      if (!patientProfile.address) {
        showSnack("Patient profile does not have associated Ethereum address. Edit patient to set address.", "#d2132d");
        setStatus("");
        return;
      }
      const tx = await contract.methods.addRecord(patientProfile.address, patientProfile.name || patientProfile.id, cid).send({ from: accounts[0] });
      setStatus("");
      showSnack("Record added on-chain. Tx success.", "green");
      setFile(null);
      const fileEl = document.getElementById("doctorFileInput");
      if (fileEl) fileEl.value = "";
    } catch (err) {
      console.error("Upload & save failed:", err);
      setStatus("");
      showSnack("Upload failed: " + (err.message || err), "#d2132d");
    }
  };

  // styling values (Times New Roman + palette colors)
  const font = "'Times New Roman', Times, serif";
  const primaryBlue = "#2E6BFF"; // main button color
  const purpleAccent = "#8E44AD";

  // SPLIT LAYOUT styles for login and patient-credentials step
  const splitWrap = { display: "flex", minHeight: "100vh", fontFamily: font };
  const leftPane = {
    flex: "1 1 50%",
    background: "linear-gradient(180deg,#051329,#0b3566)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    boxSizing: "border-box"
  };
  const logoBig = { width: "72%", maxWidth: 520, objectFit: "contain", borderRadius: 10, boxShadow: "0 20px 48px rgba(5,20,48,0.55)" };

  const rightPane = {
    flex: "1 1 50%",
    position: "relative",
    padding: 28,
    boxSizing: "border-box",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  };

  // light-blue background on the right for login/credentials
  const rightLightBg = {
    position: "absolute",
    inset: 0,
    background: "linear-gradient(180deg, #e9f2ff 0%, #cfe8ff 100%)",
    zIndex: 1
  };
  const rightTint = {
    position: "absolute",
    inset: 0,
    background: "linear-gradient(180deg, rgba(255,255,255,0.20), rgba(255,255,255,0.12))",
    zIndex: 2
  };

  const card = {
    position: "relative",
    zIndex: 3,
    width: 460,
    maxWidth: "94%",
    background: "rgba(255,255,255,0.98)",
    padding: 22,
    borderRadius: 10,
    boxShadow: "0 10px 30px rgba(6,18,40,0.08)",
    boxSizing: "border-box",
    fontFamily: font
  };

  const afterLoginWrapper = {
    fontFamily: font,
    minHeight: "100vh",
    position: "relative",
    backgroundImage: `url(${bgImg})`,
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat"
  };
  const afterLoginTint = { position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(6,29,62,0.36), rgba(6,29,62,0.36))", zIndex: 1 };
  const afterLoginContent = { position: "relative", zIndex: 2, padding: 28, boxSizing: "border-box", color: "#fff" };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <NavMenu />

      {/* BEFORE AUTH: split view with big left logo & right light-blue login/credentials */}
      {!doctorAuth && (
        <div style={splitWrap}>
          <div style={leftPane}>
            <img src={logoImg} alt="WeCare" style={logoBig} />
          </div>

          <div style={rightPane}>
            <div style={rightLightBg} aria-hidden="true" />
            <div style={rightTint} aria-hidden="true" />

            <div style={card}>
              <div style={{ textAlign: "center", marginBottom: 12 }}>
                <div style={{ fontSize: 28, fontFamily: font }}>Welcome to Doctor panel</div>
              </div>

              <div style={{ marginBottom: 10 }}>
                <TextField
                  label="Doctor ID"
                  fullWidth
                  value={doctorId}
                  onChange={(e) => setDoctorId(e.target.value)}
                  size="small"
                  InputLabelProps={{ style: { fontFamily: font } }}
                />
              </div>

              <div style={{ marginBottom: 18 }}>
                <TextField
                  label="Password"
                  type="password"
                  fullWidth
                  value={doctorPwd}
                  onChange={(e) => setDoctorPwd(e.target.value)}
                  size="small"
                  InputLabelProps={{ style: { fontFamily: font } }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
                <Button variant="outlined" onClick={() => { setDoctorId(""); setDoctorPwd(""); }} style={{ borderColor: primaryBlue, color: primaryBlue }}>Clear</Button>
                <Button variant="contained" onClick={handleDoctorLogin} style={{ backgroundColor: primaryBlue, color: "#fff" }}>Login</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AFTER DOCTOR AUTH but before patient opened: keep left logo & right light-blue credentials (Create Patient button removed as requested) */}
      {doctorAuth && !patientProfile && (
        <div style={splitWrap}>
          <div style={leftPane}>
            <img src={logoImg} alt="WeCare" style={logoBig} />
          </div>

          <div style={rightPane}>
            <div style={rightLightBg} aria-hidden="true" />
            <div style={rightTint} aria-hidden="true" />

            <div style={card}>
              <div style={{ textAlign: "center", marginBottom: 10 }}>
                <div style={{ fontSize: 24, fontFamily: font }}>Welcome to Doctor panel</div>
                <div style={{ fontSize: 13, color: "#333", marginTop: 6 }}>Enter patient credentials to open account</div>
              </div>

              <div style={{ marginBottom: 10 }}>
                <TextField
                  label="Patient ID (e.g. PAT_001)"
                  fullWidth
                  value={patientId}
                  onChange={(e) => setPatientId(e.target.value)}
                  size="small"
                  InputLabelProps={{ style: { fontFamily: font } }}
                />
              </div>

              <div style={{ marginBottom: 18 }}>
                <TextField
                  label="Patient Password"
                  type="password"
                  fullWidth
                  value={patientPwdInput}
                  onChange={(e) => setPatientPwdInput(e.target.value)}
                  size="small"
                  InputLabelProps={{ style: { fontFamily: font } }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
                <Button variant="outlined" onClick={() => { setPatientId(""); setPatientPwdInput(""); }} style={{ borderColor: primaryBlue, color: primaryBlue }}>Clear</Button>

                {/* Create patient intentionally removed here (per your request).
                    If you later want it re-added but hidden behind a flag, tell me. */}
                <Button variant="contained" onClick={handleOpenPatientAccount} style={{ backgroundColor: primaryBlue, color: "#fff" }}>Open Patient</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AFTER patientProfile is set (we still show patient details & fallback upload in-card) */}
      {doctorAuth && patientProfile && (
        <div style={afterLoginWrapper}>
          <div style={afterLoginTint} aria-hidden="true" />
          <div style={afterLoginContent}>
            <div style={{ maxWidth: 1100, margin: "0 auto" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <div style={{ fontSize: 28, fontFamily: font, color: "#EAF6FF" }}>Doctor Panel</div>
                <div>
                  <Button variant="contained" onClick={() => { setDoctorAuth(false); setPatientProfile(null); setDoctorId(""); setDoctorPwd(""); showSnack("Doctor logged out", "#1E90FF"); }} style={{ backgroundColor: primaryBlue, color: "#fff" }}>
                    Logout
                  </Button>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 12, background: "rgba(255,255,255,0.04)", padding: 16, borderRadius: 10 }}>
                <div><b>Patient ID:</b> {patientProfile.id}</div>
                <div><b>Name:</b> {patientProfile.name}</div>
                <div><b>Gender:</b> {patientProfile.gender}</div>
                <div><b>Age:</b> {patientProfile.age}</div>
                <div><b>Phone:</b> {patientProfile.phone}</div>
                <div><b>Ethereum Address:</b> {patientProfile.address || "Not set"}</div>
              </div>

              <div style={{ marginTop: 12, background: "rgba(255,255,255,0.02)", padding: 16, borderRadius: 10 }}>
                <h4 style={{ marginTop: 0, fontFamily: font, color: "#fff" }}>Upload New Record (fallback)</h4>
                <input id="doctorFileInput" type="file" onChange={handleFileChange} />
                <div style={{ marginTop: 8 }}>
                  <Button variant="contained" color="primary" onClick={handleUploadAndSaveFallback} style={{ backgroundColor: primaryBlue, color: "#fff" }}>Upload & Save</Button>
                </div>
                <div style={{ marginTop: 10, color: "#DCEFFB", fontSize: 13 }}>{status}</div>

                <div style={{ marginTop: 12 }}>
                  <Button variant="outlined" onClick={() => { setPatientProfile(null); setPatientId(""); setPatientPwdInput(""); }} style={{ borderColor: primaryBlue, color: primaryBlue }}>Close Patient</Button>
                </div>
              </div>
            </div>
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

export default DoctorPanel;
