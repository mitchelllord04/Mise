import { NavLink, useNavigate } from "react-router-dom";
import { logOut } from "../auth/authApi";
import { auth } from "../firebase";
import { useEffect, useRef, useState } from "react";

function NavBar() {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const navRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (navRef.current && !navRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleLogout() {
    setMenuOpen(false);
    await logOut(auth);
    navigate("/", { replace: true });
  }

  function handleNavClick() {
    setMenuOpen(false);
  }

  return (
    <nav className="navbar navbar-expand-lg p-0 position-relative" ref={navRef}>
      <button
        className="navbar-toggler border-0 ms-auto"
        type="button"
        onClick={() => setMenuOpen((prev) => !prev)}
        aria-expanded={menuOpen}
        aria-label="Toggle navigation"
      >
        <span className="navbar-toggler-icon"></span>
      </button>

      <div
        className={`navbar-collapse-custom ${menuOpen ? "show" : ""}`}
        id="navMenu"
      >
        <ul className="navbar-nav nav nav-underline ms-auto">
          <li className="nav-item">
            <NavLink to="/home" className="nav-link" onClick={handleNavClick}>
              Home
            </NavLink>
          </li>

          <li className="nav-item">
            <NavLink to="/add" className="nav-link" onClick={handleNavClick}>
              Add
            </NavLink>
          </li>

          <li className="nav-item">
            <NavLink to="/view" className="nav-link" onClick={handleNavClick}>
              View
            </NavLink>
          </li>

          <li className="nav-item">
            <NavLink
              to="/chatbot"
              className="nav-link"
              onClick={handleNavClick}
            >
              Chatbot
            </NavLink>
          </li>

          <li className="signout nav-item">
            <button className="nav-link btn border-0" onClick={handleLogout}>
              Sign Out
            </button>
          </li>
        </ul>
      </div>
    </nav>
  );
}

export default NavBar;
