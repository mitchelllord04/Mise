import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signIn, signInWithGoogle } from "../auth/authApi";
import PasswordField from "../components/PasswordField";

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    try {
      await signIn(email, password);
      navigate("/home", { replace: true });
    } catch (err) {
      setError(err.message);
    }
  };

  const handleGoogleLogin = async () => {
    setError("");

    try {
      await signInWithGoogle();
      navigate("/home", { replace: true });
    } catch (err) {
      setError(err.message);
    }
  };

  const handleCreateAccount = () => {
    navigate("/create-account", { replace: true });
  };

  const handleResetPassword = () => {
    navigate("/reset-password", { replace: true });
  };

  return (
    <>
      <div className="min-vh-100 d-flex align-items-center justify-content-center p-4">
        <div
          className="card shadow-sm"
          style={{ maxWidth: 420, width: "100%" }}
        >
          <div className="card-body p-4">
            <h1> Welcome to Mise! </h1>
            <p className="text-body-secondary mb-4">Log in to your account.</p>

            {error && <div className="alert alert-danger py-2">{error}</div>}

            <form className="d-grid gap-3" onSubmit={handleLogin}>
              <div className="mb-2">
                <label className="form-label">Email:</label>
                <input
                  type="text"
                  name="email"
                  value={email}
                  className="form-control"
                  placeholder="you@example.com"
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="mb-2">
                <label className="form-label"> Password: </label>
                <PasswordField
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <button type="submit" className="btn btn-primary">
                Login
              </button>

              <button
                type="button"
                className="btn btn-light border w-100 d-flex align-items-center justify-content-center gap-2"
                onClick={handleGoogleLogin}
              >
                <img
                  src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                  alt="Google"
                  style={{ width: 18 }}
                />
                Sign in with Google
              </button>

              <button
                type="button"
                className="btn btn-outline-primary"
                onClick={handleCreateAccount}
              >
                Create Account
              </button>

              <button
                type="button"
                className="btn btn-link p-0"
                onClick={handleResetPassword}
              >
                Forgot password?
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}

export default Login;
