import { useState } from "react";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../firebase";
import { useNavigate } from "react-router-dom";

function ResetPassword() {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  const navigate = useNavigate();

  async function handleReset(e) {
    e.preventDefault();
    setError("");
    setMsg("");

    if (!email) {
      setError("Please enter your email.");
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email);
      setMsg("Password reset email sent! Check your inbox.");
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center p-4">
      <div className="card shadow-sm" style={{ maxWidth: 450, width: "100%" }}>
        <div className="card-body p-4">
          <h1 className="h3 mb-1">Reset Password</h1>
          <p className="text-body-secondary mb-4">
            Enter your email and we’ll send you a reset link.
          </p>

          {error && <div className="alert alert-danger py-2">{error}</div>}
          {msg && <div className="alert alert-success py-2">{msg}</div>}

          <form onSubmit={handleReset} className="d-grid gap-3">
            <div>
              <label className="form-label">Email</label>
              <input
                className="form-control"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="btn btn-primary">
              Send Reset Email
            </button>

            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={() => navigate("/")}
            >
              Back to Login
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default ResetPassword;
