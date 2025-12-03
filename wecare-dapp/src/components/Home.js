// src/pages/Home.js
import React from "react";
import homeBg from "../assets/Home.png"; // keep your existing image
import NavMenu from "../components/NavMenu";

const Home = () => {
  const pageStyle = {
    minHeight: "100vh",
    backgroundImage: `url(${homeBg})`,
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat",
    position: "relative",
    color: "#fff",
    display: "flex",
    justifyContent: "center",
    alignItems: "flex-start",
    textAlign: "center",
    fontFamily: "'Poppins', sans-serif",
  };

  const overlayStyle = {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(0,0,0,0.45)",
    zIndex: 1,
  };

  const contentStyle = {
    position: "relative",
    zIndex: 2,
    padding: "20px",
    marginTop: "40px",
    color: "#f0f8ff",
  };

  const welcomeText = { fontSize: "1.6rem", fontFamily: "'Times New Roman', serif", marginBottom: 6 };
  const appName = { fontSize: "4.2rem", fontFamily: "'Times New Roman', serif", margin: "6px 0", fontWeight: 700, textShadow: "2px 2px 8px rgba(0,0,0,0.4)" };
  const tagline = { fontSize: "1.1rem", marginTop: 8 };

  return (
    <div style={pageStyle}>
      <NavMenu />
      <div style={overlayStyle} />
      <div style={contentStyle}>
        <h2 style={welcomeText}>Welcome to</h2>
        <h1 style={appName}>WeCare</h1>
        <p style={tagline}>A decentralized approach to secure patient data</p>
      </div>
    </div>
  );
};

export default Home;
