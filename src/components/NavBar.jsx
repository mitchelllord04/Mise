import { NavLink, useNavigate } from "react-router-dom";
import { logOut } from "../auth/authApi";
import { auth } from "../firebase";

function NavBar() {
  const navigate = useNavigate();

  async function handleLogout() {
    await logOut(auth);
    navigate("/", { replace: true });
  }

  return (
    <nav className="navbar navbar-expand-lg p-0">
      <button
        className="navbar-toggler border-0 ms-auto"
        type="button"
        data-bs-toggle="collapse"
        data-bs-target="#navMenu"
      >
        <span className="navbar-toggler-icon"></span>
      </button>

      <div className="collapse navbar-collapse" id="navMenu">
        <ul className="nav nav-underline ms-auto">
          <li className="nav-item">
            <NavLink to="/home" className="nav-link">
              Home
            </NavLink>
          </li>

          <li className="nav-item">
            <NavLink to="/add" className="nav-link">
              Add
            </NavLink>
          </li>

          <li className="nav-item">
            <NavLink to="/view" className="nav-link">
              View
            </NavLink>
          </li>

          <li className="nav-item">
            <NavLink to="/chatbot" className="nav-link">
              Chatbot
            </NavLink>
          </li>

          <li className="signout nav-item">
            <button className="nav-link" onClick={handleLogout}>
              Sign Out
            </button>
          </li>
        </ul>
      </div>
    </nav>
  );
}

export default NavBar;
