import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./Nav.css";

export default function Nav() {
  const { user, logout } = useAuth();
  const { pathname } = useLocation();

  const isActive = (path) =>
    pathname === path ? "nav-link active" : "nav-link";

  return (
    <nav className="nav">
      <Link to={user?.role === "admin" ? "/admin" : "/"} className="nav-brand">
        Job<span>Track</span>
      </Link>

      <div className="nav-links">
        <Link to="/jobs" className={isActive("/jobs")}>Job Board</Link>

        {user?.role === "applicant" && (
          <>
            <Link to="/" className={isActive("/")}>My Tracker</Link>
            <Link to="/applied" className={isActive("/applied")}>Applications</Link>
          </>
        )}

        {user?.role === "admin" && (
          <Link to="/admin" className={isActive("/admin")}>Company Dashboard</Link>
        )}
      </div>

      <div className="nav-right">
        {user ? (
          <>
            <span className="nav-user">
              {user.role === "admin"
                ? (user.companyName || user.email)
                : (user.name || user.email)}
              <span className="nav-role">{user.role}</span>
            </span>
            <button className="nav-logout" onClick={logout}>Sign out</button>
          </>
        ) : (
          <Link to="/login" className="nav-login">Sign in</Link>
        )}
      </div>
    </nav>
  );
}