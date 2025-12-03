import React from "react";
import { Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@mui/material/styles";
import theme from "./theme";
import Layout from "./components/Layout";
import Home from "./components/Home";
//import DoctorPanel from "./components/DoctorPanel";
import PatientPanel from "./components/PatientPanel";
import AdminPanel from "./components/AdminPanel";
import RegisterPatient from "./components/RegisterPatient";
import DoctorPanel from "./components/DoctorPanel";
import PatientAccount from "./components/PatientAccount";

function App() {
  return (
    <ThemeProvider theme={theme}>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/doctor" element={<DoctorPanel />} />
          <Route path="/patient" element={<PatientPanel />} />
          <Route path="/admin" element={<AdminPanel />} />
          <Route path="/register-patient" element={<RegisterPatient />} />
          <Route path="/" element={<Home />} />
         <Route path="/doctor" element={<DoctorPanel />} />
         <Route path="/doctor/patient-account" element={<PatientAccount />} />
         <Route path="/admin" element={<AdminPanel />} />
         <Route path="/patient" element={<PatientPanel />} />
        </Routes>
      </Layout>
    </ThemeProvider>
  );
}

export default App;
