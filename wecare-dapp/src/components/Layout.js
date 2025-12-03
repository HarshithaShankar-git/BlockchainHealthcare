import React from "react";
import { Link } from "react-router-dom";

const Layout = ({ children }) => {
  return (
    <div>
      <header style={{ padding: "10px", background: "#f0f0f0" }}>
        <nav>
          <Link to="/" style={{ margin: "0 10px" }}>Home</Link>
          <Link to="/doctor" style={{ margin: "0 10px" }}>Doctor</Link>
          <Link to="/patient" style={{ margin: "0 10px" }}>Patient</Link>
          <Link to="/admin" style={{ margin: "0 10px" }}>Admin</Link>
        </nav>
      </header>
      <main style={{ padding: "20px" }}>
        {children}
      </main>
      <footer style={{ padding: "10px", background: "#f0f0f0" }}>
        My App Footer
      </footer>
    </div>
  );
};

export default Layout;
