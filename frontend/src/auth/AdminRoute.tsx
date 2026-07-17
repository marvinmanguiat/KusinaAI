import { Navigate, Outlet } from "react-router-dom";
import AuthService from "./AuthService";

const AdminRoute = () => {
    if (!AuthService.isAuthenticated()) {
        return <Navigate to="/login" replace />;
    }

    return AuthService.hasRole("ROLE_ADMIN")
        ? <Outlet />
        : <Navigate to="/dashboard" replace />;
};

export default AdminRoute;