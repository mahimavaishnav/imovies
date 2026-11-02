import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <nav className="navbar navbar-expand-lg bg-white shadow-sm sticky-top">
      <div className="container">
        <Link className="navbar-brand" to="/">
          🎬 <span className="brand-text">iMovies</span>
        </Link>

        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#nav"
        >
          <span className="navbar-toggler-icon" />
        </button>

        <div className="collapse navbar-collapse" id="nav">
          <ul className="navbar-nav me-auto">
            <li className="nav-item">
              <NavLink className="nav-link" to="/" end>Movies</NavLink>
            </li>
            {user && (
              <li className="nav-item">
                <NavLink className="nav-link" to="/my-bookings">My Bookings</NavLink>
              </li>
            )}
            {user?.role === "admin" && (
              <li className="nav-item">
                <NavLink className="nav-link" to="/admin">Admin</NavLink>
              </li>
            )}
          </ul>

          <div className="d-flex gap-2 align-items-center">
            {user ? (
              <>
                <span className="badge bg-light text-dark border d-none d-md-inline">
                  {user.role === "admin" ? "⭐ Admin" : "👤 User"} · {user.name}
                </span>
                <button
                  className="btn btn-outline-danger btn-sm"
                  onClick={() => {
                    logout();
                    navigate("/");
                  }}
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="btn btn-outline-danger btn-sm">Login</Link>
                <Link to="/register" className="btn btn-danger btn-sm">Sign Up</Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
