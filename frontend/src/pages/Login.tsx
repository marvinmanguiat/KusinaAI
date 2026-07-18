import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import kusinaLogo from "../assets/kusina-ai.png";

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const oauthBaseUrl = (
    import.meta.env.VITE_API_BASE_URL || "https://kusinaai-production.up.railway.app/api"
  ).replace(/\/api\/?$/, "");

  const [error, setError] = useState("");

  useEffect(() => {
    const oauthError = (
      location.state as { oauthError?: string } | null
    )?.oauthError;

    if (oauthError) {
      setError(oauthError);
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location.pathname, location.state, navigate]);

  const handleSocialLogin = (provider: "google" | "facebook") => {
    window.location.href = `${oauthBaseUrl}/oauth2/authorization/${provider}`;
  };

  return (
    <div className="card card-outline card-primary shadow auth-card">
      <div className="card-header text-center">
        <img
          src={kusinaLogo}
          alt="Kusina AI"
          className="k-login-logo"
        />

        <p className="text-muted mb-0">
          Sign in to plan your next home-cooked menu
        </p>
      </div>

      <div className="card-body">

        {error && (
          <div className="alert alert-danger">
            {error}
          </div>
        )}

        <div className="alert alert-info text-center">
          <strong>Social Login Only</strong>
          <br />
          Please continue using your Google or Facebook account.
        </div>

        <div className="d-grid gap-2">

          <button
            type="button"
            className="btn btn-outline-dark"
            onClick={() => handleSocialLogin("google")}
          >
            <i className="bi bi-google me-2"></i>
            Continue with Google
          </button>

          <button
            type="button"
            className="btn btn-outline-primary"
            onClick={() => handleSocialLogin("facebook")}
          >
            <i className="bi bi-facebook me-2"></i>
            Continue with Facebook
          </button>

        </div>

        <hr className="my-4" />

        <div className="text-center">
          <small className="text-muted">
            Email/password sign-in is temporarily unavailable.
          </small>
        </div>

        <div className="d-flex justify-content-center align-items-center mt-3 flex-wrap gap-3">

          <Link
            to="/about-us"
            className="small text-decoration-none"
          >
            About Us
          </Link>

          <Link
            to="/privacy"
            className="small text-decoration-none"
          >
            Privacy Policy
          </Link>

        </div>

      </div>

      <div className="card-footer text-center">
        <small className="text-muted">
          Warm meals start here 🍳
        </small>
      </div>
    </div>
  );
};

export default Login;