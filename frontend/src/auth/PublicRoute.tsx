import { Navigate, Outlet } from "react-router-dom";
import AuthService from "./AuthService";

const PublicRoute = () => {
    return AuthService.isAuthenticated()
        ? <Navigate to="/" replace />
        : <Outlet />;
};

export default PublicRoute;