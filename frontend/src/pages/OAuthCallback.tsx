import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../api/axios";
import AuthService from "../auth/AuthService";

const OAuthCallback = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [message, setMessage] = useState("Completing social login...");

    useEffect(() => {
        const completeLogin = async () => {
            const error = searchParams.get("error");
            const token = searchParams.get("token");

            if (error) {
                navigate("/login", {
                    replace: true,
                    state: { oauthError: error },
                });
                return;
            }

            if (!token) {
                navigate("/login", {
                    replace: true,
                    state: { oauthError: "OAuth token is missing" },
                });
                return;
            }

            try {
                AuthService.login(token);
                const profileResponse = await api.get("/auth/me");
                AuthService.updateCurrentUser(profileResponse.data);

                const shouldChangePassword = profileResponse.data?.passwordChangeRequired;
                navigate(shouldChangePassword ? "/profile" : "/dashboard", { replace: true });
            } catch {
                AuthService.logout();
                setMessage("Unable to complete social login. Redirecting to login...");
                navigate("/login", {
                    replace: true,
                    state: { oauthError: "Unable to complete social login" },
                });
            }
        };

        completeLogin();
    }, [navigate, searchParams]);

    return (
        <div className="auth-shell">
            <div className="card auth-card mx-auto" style={{ maxWidth: 460 }}>
                <div className="card-body text-center py-5">
                    <div className="spinner-border text-primary mb-3" role="status" aria-hidden="true"></div>
                    <h2 className="h5 mb-2">Signing you in</h2>
                    <p className="text-muted mb-0">{message}</p>
                </div>
            </div>
        </div>
    );
};

export default OAuthCallback;
