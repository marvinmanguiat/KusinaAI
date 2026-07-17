import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AuthService from "../auth/AuthService";

const Logout = () => {
    const navigate = useNavigate();

    useEffect(() => {
        AuthService.logout();
        navigate("/login", { replace: true });
    }, [navigate]);

    return null;
};

export default Logout;