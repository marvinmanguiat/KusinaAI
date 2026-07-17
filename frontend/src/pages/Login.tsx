import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import AuthService from "../auth/AuthService";

const Login = () => {
  const navigate = useNavigate();

  const [username, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // const handleLogin = () => {
  //   // Login logic
  //   navigate("/dashboard");
  // };

  const handleLogin = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    try {
      setLoading(true);
      setError("");

      const response = await axios.post(
        "http://localhost:8080/api/auth/login",
        {
          username,
          password,
        }
      );

      const token = response.data.token;

      AuthService.login(token);

      navigate("/");
    } catch (err: any) {
      console.error(err);

      setError(
        err?.response?.data?.message ||
          "Login failed due to  " + err.message
      );
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="card card-outline card-primary shadow">

      <div className="card-header text-center">
        <h2 className="fw-bold">
          AI Mechanic
        </h2>

        <p className="text-muted mb-0">
          Sign in to continue
        </p>
      </div>

      <div className="card-body">

        {error && (
          <div className="alert alert-danger">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin}>

          <div className="mb-3">
            <label className="form-label">
              Email
            </label>

            <div className="input-group">

              <span className="input-group-text">
                <i className="bi bi-envelope"></i>
              </span>

              <input
                type="email"
                className="form-control"
                placeholder="Enter email"
                value={username}
                onChange={(e) =>
                  setEmail(e.target.value)
                }
                required
              />

            </div>
          </div>

          <div className="mb-3">
            <label className="form-label">
              Password
            </label>

            <div className="input-group">

              <span className="input-group-text">
                <i className="bi bi-lock"></i>
              </span>

              <input
                type="password"
                className="form-control"
                placeholder="Enter password"
                value={password}
                onChange={(e) =>
                  setPassword(e.target.value)
                }
                required
              />

            </div>
          </div>

          <div className="d-grid">

            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading
                ? "Signing In... Please wait"
                : "Sign In"}
            </button>

          </div>

        </form>

      </div>

      <div className="card-footer text-center">
        <small className="text-muted">
          © 2026 AI Mechanic
        </small>
      </div>

    </div>
  );
};

export default Login;