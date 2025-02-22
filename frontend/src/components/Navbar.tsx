import React from "react";
import { Link } from "react-router-dom";
import "../styles.css"; // Import the stylesheet

interface NavbarProps {} // No props for now

const Navbar: React.FC<NavbarProps> = () => {
  return (
    <nav className="navbar">
      <div className="navbar-left">
        <Link to="/" className="navbar-brand">
          Nodeflow
        </Link>
      </div>
      <div className="navbar-center">
        <Link to="/journal" className="nav-link">
          Journal
        </Link>
        <Link to="/storage" className="nav-link">
          Storage
        </Link>{" "}
        <Link to="/todos" className="nav-link">
          Todos
        </Link>
      </div>
      <div className="navbar-right">
        <div className="dropdown">
          <button className="dropbtn">Account</button>
          <div className="dropdown-content">
            {/* Dropdown items will go here later */}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
