import { Link, useLocation } from "react-router-dom";
import AuthService from "../auth/AuthService";
import kusinaLogo from "../assets/kusina-ai.png";

export default function Sidebar() {
  const location = useLocation();
  const canManageUsers = AuthService.hasRole("ROLE_ADMIN");

  const active = (path: string) =>
    location.pathname === path ? "nav-link active" : "nav-link";

  return (
   <aside className="app-sidebar bg-body-secondary shadow" data-bs-theme="dark">
<div className="sidebar-brand">
  <Link to="/dashboard" className="brand-link">
    <img
      src={kusinaLogo}
      alt="KusinaAI"
      className="k-brand-logo"
    />
  </Link>
</div>
      <div className="sidebar-wrapper">
        <nav className="mt-2">
          <ul className="nav sidebar-menu flex-column" data-lte-toggle="treeview" role="menu">
            <li className="nav-item">
              <Link to="/dashboard" className={active("/dashboard")}>
                <i className="nav-icon fas fa-search"></i>
                <p>Menu Search</p>
              </Link>
            </li>
            <li className="nav-item">
              <Link to="/menu-history" className={active("/menu-history")}>
                <i className="nav-icon fas fa-history"></i>
                <p>Menu History</p>
              </Link>
            </li>
            <li className="nav-item">
              <Link to="/about" className={active("/about")}>
                <i className="nav-icon fas fa-info-circle"></i>
                <p>About Us</p>
              </Link>
            </li>
            <li className="nav-item">
              <Link to="/profile" className={active("/profile")}>
                <i className="nav-icon fas fa-user"></i>
                <p>Profile</p>
              </Link>
            </li>
            {canManageUsers && (
              <li className="nav-item">
                <Link to="/users" className={active("/users")}>
                  <i className="nav-icon fas fa-user-cog"></i>
                  <p>Users</p>
                </Link>
              </li>
            )}
          </ul>
        </nav>
      </div>

   </aside>
  );
}