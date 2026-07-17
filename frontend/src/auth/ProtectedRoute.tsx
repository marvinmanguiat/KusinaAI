import { Navigate, Outlet } from "react-router-dom";
import AuthService from "./AuthService";

const ProtectedRoute = () => {
    return AuthService.isAuthenticated()
        ? <Outlet />
        : <Navigate to="/login" replace />;
};

export default ProtectedRoute;