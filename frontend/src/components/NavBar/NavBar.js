import React from "react";
import { Link } from "react-router-dom";

const NavBar = () => {
  return (
    <React.Fragment>
      <nav className="navbar navbar-expand-sm navbar-light border-bottom justify-content-between">
        <Link className="navbar-brand" to="/" role="heading" aria-level="1">
          Moggerstagram
        </Link>
        <div className="navbar-nav">
          <Link className="nav-item nav-link active" to="/register">
            Register
          </Link>
        </div>
        <div className="navbar-nav">
          <Link className="nav-item nav-link active" to="/login">
            Login
          </Link>
        </div>
      </nav>
    </React.Fragment>
  );
}
export default NavBar;
