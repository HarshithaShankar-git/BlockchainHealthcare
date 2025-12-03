// src/pages/RegisterPatient.js
import React, { useState } from "react";
import { Snackbar } from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import { motion } from "framer-motion";
import { getAdminCredential, savePatientProfile } from "../utils/credentials";
import Web3 from "web3";

const RegisterPatient = () => {
  const [adminId, setAdminId] = useState("");
  const [adminPwd, setAdminPwd] = useState("");
  const [authenticated, setAuthenticated] = useState(false);

  const [pid, setPid] = useState("");
  const [ppassword, setPpassword] = useState("");
  const [pname, setPname] = useState("");
  const [pgender, setPgender] = useState("");
  const [pageVal, setPageVal] = useState("");
  const [pphone, setPphone] = useState("");
  const [paddress, setPaddress] = useState("");

  const [open, setOpen] = useState(false);
  const [msg, setMsg] = useState("");
  const [msgColor, setMsgColor] = useState("green");

  // Basic inline styles (match your app look)
  const pageStyle = {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "'Poppins', sans-serif",
    backgroundColor: "#f5f7f8",
    padding: 20,
  };

  const card = {
    width: 520,
    background: "rgba(255,255,255,0.95)",
    padding: 26,
    borderRadius: 12,
    boxShadow: "0 4px 30px rgba(0,0,0,0.08)",
  };

  const input = { width: "100%", padding: "10px", marginTop: 6, marginBottom: 12, borderRadius: 6, border: "1px solid #ddd" };
  const label = { fontWeight: 600, marginBottom: 6, display: "block" };
  const button = { padding: "10px 14px", borderRadius: 8, background: "#2f6df6", color: "#fff", border: "none", cursor: "pointer" };

  // Admin login verification using local credential helper
  const verifyAdmin = () => {
    try {
      const admin = getAdminCredential();
      if (!admin) throw new Error("Admin credentials not found in local storage.");
      if (admin.id === adminId && admin.password === adminPwd) {
        setAuthenticated(true);
        setMsg("Admin authenticated — you can register patients.");
        setMsgColor("green");
        setOpen(true);
      } else {
        setMsg("Access Denied — wrong admin id / password.");
        setMsgColor("red");
        setOpen(true);
      }
    } catch (err) {
      setMsg("Admin verification error: " + err.message);
      setMsgColor("red");
      setOpen(true);
    }
  };

  // Accept either an address (0x...) or a private key (0x...) and convert if needed
  const normalizeAddress = (value) => {
    const v = (value || "").trim();
    if (!v) return "";
    // if it looks like a private key (66 chars with 0x + 64 hex), derive address
    if (/^0x[a-fA-F0-9]{64}$/.test(v)) {
      try {
        const web3 = new Web3();
        const acct = web3.eth.accounts.privateKeyToAccount(v);
        return acct.address;
      } catch {
        return "";
      }
    }
    // if it looks like an address (0x + 40 hex)
    if (/^0x[a-fA-F0-9]{40}$/.test(v)) return v;
    return "";
  };

  const handleSavePatient = () => {
    // Basic validation
    if (!pid || !ppassword || !pname) {
      setMsg("Please fill Patient ID, Password and Name at least.");
      setMsgColor("red");
      setOpen(true);
      return;
    }
    const addr = normalizeAddress(paddress);
    if (!addr) {
      setMsg("Enter valid patient wallet address or private key (0x...).");
      setMsgColor("red");
      setOpen(true);
      return;
    }

    const profile = {
      id: pid,
      password: ppassword,
      name: pname,
      gender: pgender || "",
      age: pageVal || "",
      phone: pphone || "",
      address: addr,
    };

    try {
      savePatientProfile(profile);
      setMsg("Patient saved successfully. Address: " + addr);
      setMsgColor("green");
      setOpen(true);
      // clear form (optionally)
      setPid("");
      setPpassword("");
      setPname("");
      setPgender("");
      setPageVal("");
      setPphone("");
      setPaddress("");
    } catch (err) {
      setMsg("Save failed: " + err.message);
      setMsgColor("red");
      setOpen(true);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={pageStyle}>
      <div style={card}>
        {!authenticated ? (
          <>
            <h2 style={{ marginTop: 0 }}>Admin Login — Register Patient</h2>
            <div>
              <label style={label}>Admin ID</label>
              <input style={input} value={adminId} onChange={(e) => setAdminId(e.target.value)} placeholder="wecare.admin.001" />
            </div>
            <div>
              <label style={label}>Admin Password</label>
              <input style={input} type="password" value={adminPwd} onChange={(e) => setAdminPwd(e.target.value)} placeholder="Adm!IT@0183151" />
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
              <button style={button} onClick={verifyAdmin}>🔐 Verify Admin</button>
            </div>
          </>
        ) : (
          <>
            <h2 style={{ marginTop: 0 }}>Register Patient</h2>

            <div>
              <label style={label}>Patient ID</label>
              <input style={input} value={pid} onChange={(e) => setPid(e.target.value)} placeholder="PAT_001" />
            </div>

            <div>
              <label style={label}>Patient Password (or private key)</label>
              <input style={input} value={ppassword} onChange={(e) => setPpassword(e.target.value)} placeholder="password or private key (0x...)" />
            </div>

            <div>
              <label style={label}>Patient Name</label>
              <input style={input} value={pname} onChange={(e) => setPname(e.target.value)} placeholder="Alice" />
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <div style={{ flex: 1 }}>
                <label style={label}>Gender</label>
                <input style={input} value={pgender} onChange={(e) => setPgender(e.target.value)} placeholder="Female" />
              </div>
              <div style={{ width: 120 }}>
                <label style={label}>Age</label>
                <input style={input} value={pageVal} onChange={(e) => setPageVal(e.target.value)} placeholder="24" />
              </div>
            </div>

            <div>
              <label style={label}>Phone</label>
              <input style={input} value={pphone} onChange={(e) => setPphone(e.target.value)} placeholder="9999990001" />
            </div>

            <div>
              <label style={label}>Patient Wallet Address OR Private Key (0x...)</label>
              <input style={input} value={paddress} onChange={(e) => setPaddress(e.target.value)} placeholder="0x22d491Bde230..." />
              <small style={{ color: "#666" }}>
                If you paste a private key (0x...), the component will derive the address automatically.
              </small>
            </div>

            <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
              <button style={button} onClick={handleSavePatient}>💾 Save Patient</button>
              <button
                style={{ ...button, background: "#888" }}
                onClick={() => {
                  setAuthenticated(false);
                  setAdminId("");
                  setAdminPwd("");
                }}
              >
                ⏮ Back (Logout)
              </button>
            </div>
          </>
        )}

        <Snackbar
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
          open={open}
          onClose={() => setOpen(false)}
          autoHideDuration={3500}
          message={
            <span style={{ display: "flex", alignItems: "center", color: msgColor === "green" ? "green" : "red" }}>
              {msgColor === "green" ? <CheckCircleIcon sx={{ mr: 1 }} /> : <ErrorOutlineIcon sx={{ mr: 1 }} />}
              {msg}
            </span>
          }
        />
      </div>
    </motion.div>
  );
};

export default RegisterPatient;
