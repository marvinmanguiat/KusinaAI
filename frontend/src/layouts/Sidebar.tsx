import { Link, useLocation } from "react-router-dom";

export default function Sidebar() {
  const location = useLocation();

  const active = (path: string) =>
    location.pathname === path ? "nav-link active" : "nav-link";

  return (
   <aside className="app-sidebar bg-body-secondary shadow" data-bs-theme="dark">
      <div className="sidebar-brand">
        <a href="#" className="brand-link">
           <i className="nav-icon fas fa-robot"></i>
          <span className="brand-text fw-light"> AI Mechanic          
         </span>
        </a>
      </div>
      <div className="sidebar-wrapper">
        <nav className="mt-2">
          <ul className="nav sidebar-menu flex-column" data-lte-toggle="treeview" role="menu">
            <li className="nav-item">
              <Link to="/dashboard" className={active("/dashboard")}>
                <i className="nav-icon fas fa-tachometer-alt"></i>
                <p>Dashboard</p>
              </Link>
            </li>
            <li className="nav-item">
              <Link to="/profile" className={active("/profile")}>
                <i className="nav-icon fas fa-user"></i>
                <p>Profile</p>
              </Link>
            </li>
            <li className="nav-item">
              <Link to="/users" className={active("/users")}>
                <i className="nav-icon fas fa-user-cog"></i>
                <p>Users</p>
              </Link>
            </li>
          </ul>
        </nav>
      </div>

   </aside>
  );
}