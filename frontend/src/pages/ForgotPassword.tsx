import { useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [temporaryPassword, setTemporaryPassword] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      setLoading(true);
      setError("");
      setMessage("");
      setTemporaryPassword(null);

      const response = await api.post("/auth/forgot-password", { email });
      setMessage(response.data.message);
      setTemporaryPassword(response.data.temporaryPassword ?? null);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Unable to process forgot password request");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card card-outline card-warning shadow auth-card">
      <div className="card-header text-center">
        <h2 className="fw-bold">Forgot Password</h2>
        <p className="text-muted mb-0">Get back to your saved dishes and menu ideas</p>
      </div>

      <div className="card-body">
        {error && <div className="alert alert-danger">{error}</div>}
        {message && <div className="alert alert-success">{message}</div>}

        {temporaryPassword && (
          <div className="alert alert-warning">
            Temporary password: <strong>{temporaryPassword}</strong>
            <div className="small mt-2">
              Email delivery is not configured yet, so the temporary password is shown here for now.
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label">Email</label>
            <input
              type="email"
              className="form-control"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your account email"
              required
            />
          </div>

          <div className="d-grid">
            <button type="submit" className="btn btn-warning" disabled={loading}>
              {loading ? "Sending..." : "Send temporary password"}
            </button>
          </div>

          <div className="text-center mt-3">
            <Link to="/login" className="small text-decoration-none">
              Back to login
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ForgotPassword;