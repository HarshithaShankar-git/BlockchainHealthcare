// src/pages/PatientAccount.js
import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Snackbar, Button, IconButton } from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import VisibilityIcon from "@mui/icons-material/Visibility";
import LogoutIcon from "@mui/icons-material/Logout";
import { motion } from "framer-motion";
import { loadWeb3AndContract } from "../utils/web3";
import { uploadFileToIPFS } from "../utils/ipfs";
import bgImg from "../assets/Blurblue.avif";

const PatientAccount = () => {
  const location = useLocation();
  const navigate = useNavigate();
  // patientProfile passed in route state
  const initialProfile = (location && location.state && location.state.patientProfile) || null;

  const [patient, setPatient] = useState(initialProfile);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState("");
  const [file, setFile] = useState(null);

  // snackbar
  const [snackOpen, setSnackOpen] = useState(false);
  const [snackMsg, setSnackMsg] = useState("");
  const [snackColor, setSnackColor] = useState("green");

  const showSnack = (msg, color = "green") => { setSnackMsg(msg); setSnackColor(color); setSnackOpen(true); };

  useEffect(() => {
    if (!patient) {
      // if no profile passed, redirect back to doctor panel
      showSnack("No patient loaded — returning.", "#d2132d");
      setTimeout(() => navigate("/doctor"), 800);
      return;
    }
    fetchRecords();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patient]);

  // fetch records from chain
  const fetchRecords = async () => {
    try {
      setLoading("Loading contract...");
      const { accounts, contract } = await loadWeb3AndContract();
      setLoading("Fetching medical history...");
      const result = await contract.methods.getRecords(patient.address).call({ from: accounts[0] });

      // normalize array (handles web3 variations)
      const normalized = (result || []).map((r) => {
        if (Array.isArray(r)) {
          return { patientName: r[0], data: r[1], timestamp: Number(r[2]) };
        } else {
          return { patientName: r.patientName || r[0] || "", data: r.data || r[1] || "", timestamp: r.timestamp ? Number(r.timestamp) : 0 };
        }
      });
      setRecords(normalized);
      setLoading("");
      if (normalized.length === 0) showSnack("No medical records found.", "#1E90FF");
      else showSnack("Medical history loaded.", "green");
    } catch (err) {
      console.error("fetchRecords", err);
      setLoading("");
      showSnack("Error fetching records: " + (err.message || err), "#d2132d");
    }
  };

  // upload new file (doctor must have MetaMask doctor account selected)
  const handleFileSelected = (e) => { if (e.target.files && e.target.files[0]) setFile(e.target.files[0]); };

  const handleUploadNewFile = async () => {
    try {
      if (!file) { showSnack("Select a file first.", "#d2132d"); return; }
      if (!patient.address) { showSnack("Patient has no Ethereum address set. Edit patient first.", "#d2132d"); return; }

      setLoading("Uploading to IPFS...");
      const cid = await uploadFileToIPFS(file);
      setLoading("IPFS done — sending transaction...");
      const { accounts, contract } = await loadWeb3AndContract();
      await contract.methods.addRecord(patient.address, patient.name || patient.id, cid).send({ from: accounts[0] });
      setLoading("");
      showSnack("Record saved on-chain.", "green");
      setFile(null);
      const el = document.getElementById("patientUploadInput");
      if (el) el.value = "";
      // refresh records
      setTimeout(fetchRecords, 900);
    } catch (err) {
      console.error("uploadNewFile", err);
      setLoading("");
      showSnack("Upload failed: " + (err.message || err), "#d2132d");
    }
  };

  const openCid = (cid) => {
    if (!cid) { showSnack("No CID available for this record.", "#d2132d"); return; }
    const url = `https://ipfs.io/ipfs/${cid}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleLogout = () => {
    // navigate back to doctor panel, clear patient
    navigate("/doctor");
  };

  const font = "'Times New Roman', Times, serif";

  // styles: use Blurblue background and readable overlays
  const pageStyle = {
    minHeight: "100vh",
    padding: 28,
    fontFamily: font,
    position: "relative",
    color: "#fff",
    backgroundImage: `url(${bgImg})`,
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat"
  };
  const overlay = { position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(6,29,62,0.46), rgba(6,29,62,0.46))", zIndex: 1 };
  const inner = { position: "relative", zIndex: 2, maxWidth: 1100, margin: "0 auto" };

  const header = { textAlign: "center", marginBottom: 18 };
  const title = { fontFamily: font, fontSize: 36, margin: 0, color: "#fff" };
  const subtitle = { fontFamily: font, fontSize: 18, margin: 0, color: "#DCEEFF" };
  const infoGrid = { display: "flex", gap: 24, marginTop: 18 };
  const column = { flex: 1, display: "flex", flexDirection: "column", gap: 10, background: "rgba(255,255,255,0.06)", padding: 16, borderRadius: 10, boxShadow: "0 6px 24px rgba(0,0,0,0.12)", color: "#fff" };
  const infoLine = { display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px dashed rgba(255,255,255,0.06)" };
  const historyBox = { marginTop: 18, background: "rgba(255,255,255,0.06)", padding: 14, borderRadius: 10, boxShadow: "0 6px 24px rgba(0,0,0,0.12)", color: "#fff" };
  const historyItem = { display: "flex", justifyContent: "space-between", alignItems: "center", padding: 10, borderBottom: "1px solid rgba(255,255,255,0.03)" };
  const uploadButtonWrap = { position: "fixed", right: 28, bottom: 28, zIndex: 3 };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={pageStyle}>
      <div style={overlay} aria-hidden="true" />
      <div style={inner}>
        {/* Top-right logout */}
        <div style={{ position: "absolute", right: 20, top: 18, zIndex: 4 }}>
          <Button variant="contained" color="error" startIcon={<LogoutIcon />} onClick={handleLogout} style={{ backgroundColor: "#d32f2f", color: "#fff" }}>Log Out</Button>
        </div>

        <div style={header}>
          <h1 style={title}>WeCare</h1>
          <h3 style={subtitle}>PATIENT ACCOUNT</h3>
        </div>

        <div style={infoGrid}>
          <div style={column}>
            <div style={infoLine}><div><b>Patient ID</b></div><div>{patient?.id || "—"}</div></div>
            <div style={infoLine}><div><b>Ethereum Address</b></div><div>{patient?.address || "—"}</div></div>
            <div style={infoLine}><div><b>Name</b></div><div>{patient?.name || "—"}</div></div>
            <div style={infoLine}><div><b>DOB</b></div><div>{patient?.dob || "—"}</div></div>
          </div>

          <div style={column}>
            <div style={infoLine}><div><b>Age</b></div><div>{patient?.age || "—"}</div></div>
            <div style={infoLine}><div><b>Gender</b></div><div>{patient?.gender || "—"}</div></div>
            <div style={infoLine}><div><b>Blood Group</b></div><div>{patient?.bloodGroup || "—"}</div></div>
            <div style={infoLine}><div><b>Phone Number</b></div><div>{patient?.phone || "—"}</div></div>
          </div>
        </div>

        <div style={historyBox}>
          <h4 style={{ marginTop: 0, color: "#fff", fontFamily: font }}>MEDICAL HISTORY</h4>
          {loading && <div style={{ color: "#DCEEFF", marginBottom: 8 }}>{loading}</div>}
          {records.length === 0 && <div style={{ color: "#DCEEFF", padding: 8 }}>No records available.</div>}
          {records.map((rec, idx) => (
            <div key={idx} style={historyItem}>
              <div>
                <div style={{ color: "#fff" }}><b>{rec.patientName || "Record"}</b></div>
                <div style={{ fontSize: 12, color: "#DCEEFF" }}>{rec.timestamp ? new Date(rec.timestamp * 1000).toLocaleString() : "—"}</div>
                <div style={{ fontSize: 12, color: "#DCEEFF", marginTop: 6 }}>CID: <span style={{ fontFamily: "monospace" }}>{rec.data}</span></div>
              </div>
              <div>
                <IconButton color="primary" onClick={() => openCid(rec.data)} title="View file" style={{ color: "#EAF6FF" }}>
                  <VisibilityIcon />
                </IconButton>
              </div>
            </div>
          ))}
        </div>

        {/* Upload new file (bottom-right) */}
        <div style={uploadButtonWrap}>
          <input id="patientUploadInput" type="file" style={{ display: "none" }} onChange={handleFileSelected} />
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <label htmlFor="patientUploadInput">
              <Button variant="outlined" component="span" style={{ color: "#fff", borderColor: "#fff" }}>Select File</Button>
            </label>
            <Button variant="contained" color="primary" onClick={handleUploadNewFile} style={{ backgroundColor: "#2E6BFF", color: "#fff" }}>Upload new file</Button>
          </div>
        </div>

        <Snackbar
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
          open={snackOpen}
          onClose={() => setSnackOpen(false)}
          autoHideDuration={3500}
          message={
            <span style={{ display: "flex", alignItems: "center", color: snackColor === "green" ? "#D7FFE9" : "#FFD4D4" }}>
              <CheckCircleIcon sx={{ mr: 1, color: snackColor === "green" ? "#D7FFE9" : "#FFD4D4" }} />
              {snackMsg}
            </span>
          }
        />
      </div>
    </motion.div>
  );
};

export default PatientAccount;
