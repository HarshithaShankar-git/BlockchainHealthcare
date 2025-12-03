// src/components/NavMenu.js
import React, { useState } from "react";
import MenuIcon from "@mui/icons-material/Menu";
import CloseIcon from "@mui/icons-material/Close";
import HomeIcon from "@mui/icons-material/Home";
import { Link } from "react-router-dom";

/**
 * Reusable hamburger navigation. Shows only the menu icon.
 * Uses react-router Link paths: "/", "/doctor", "/patient", "/admin"
 */

const NavMenu = () => {
  const [open, setOpen] = useState(false);

  const iconStyle = {
    position: "fixed",
    top: 18,
    left: 18,
    zIndex: 9999,
    cursor: "pointer",
    color: "#fff",
    background: "rgba(0,0,0,0.35)",
    borderRadius: 8,
    padding: 8,
  };

  const menuStyle = {
    position: "fixed",
    top: 0,
    left: open ? 0 : -260,
    height: "100vh",
    width: 260,
    backgroundColor: "rgba(3, 10, 27, 0.94)",
    paddingTop: 80,
    transition: "left 0.28s ease",
    zIndex: 9998,
    color: "#fff",
    boxShadow: "2px 0 12px rgba(0,0,0,0.3)",
    fontFamily: "'Poppins', sans-serif",
  };

  const itemStyle = {
    display: "block",
    padding: "14px 22px",
    color: "#fff",
    textDecoration: "none",
    fontSize: 18,
  };

  return (
    <>
      <div style={iconStyle} onClick={() => setOpen(true)} aria-hidden>
        <MenuIcon style={{ fontSize: 28 }} />
      </div>

      <nav style={menuStyle} aria-hidden={!open}>
        <div style={{ position: "absolute", top: 16, right: 16, cursor: "pointer" }} onClick={() => setOpen(false)}>
          <CloseIcon style={{ color: "#fff" }} />
        </div>

        <Link to="/" style={itemStyle} onClick={() => setOpen(false)}>
          <HomeIcon style={{ verticalAlign: "middle", marginRight: 8 }} /> Home
        </Link>

        <Link to="/doctor" style={itemStyle} onClick={() => setOpen(false)}>
          👨‍⚕️ Doctor Panel
        </Link>

        <Link to="/patient" style={itemStyle} onClick={() => setOpen(false)}>
          👩‍⚕️ Patient Panel
        </Link>

        <Link to="/admin" style={itemStyle} onClick={() => setOpen(false)}>
          🧑‍💼 Admin Panel
        </Link>
      </nav>
    </>
  );
};

export default NavMenu;
