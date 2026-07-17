import { useNavigate } from "react-router-dom";
import AuthService from "../auth/AuthService";

interface NavbarProps {
  toggleSidebar: () => void;
}

export default function Navbar({ toggleSidebar }: NavbarProps) {
  const navigate = useNavigate();


  return (
    <nav className="app-header navbar navbar-expand bg-body">
      <ul className="navbar-nav">
        <li className="nav-item">
<a
  href="#"
  className="nav-link"
  onClick={(e) => {
    e.preventDefault();
    toggleSidebar();
  }}
>
  <i className="bi bi-list"></i>
</a>
        </li>
      </ul>

      {/* Right navbar */}
      <ul className="navbar-nav  float-sm-end">
        <li className="nav-item dropdown">
          <a className="nav-link" href="#">
            <i className="fas fa-user-circle"></i>
            <span className="ms-2">Administrator</span>
          </a>
        </li>

        <li className="nav-item">
          <button
            className="btn btn-danger"
    onClick={async (e) => {
        e.preventDefault();
        await AuthService.logout();
        navigate("/login", { replace: true });
    }}
          >
            Logout
          </button>
        </li>
      </ul>
    </nav>
  );
}