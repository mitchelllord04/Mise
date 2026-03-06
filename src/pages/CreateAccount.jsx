import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signUp } from "../auth/authApi";
import { updateProfile } from "firebase/auth";
import PasswordField from "../components/PasswordField";

function CreateAccount() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleBackToLogin = () => {
    navigate("/");
  };

  const handleCreateAccount = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const cred = await signUp(email, password);

      await updateProfile(cred.user, {
        displayName: name,
      });

      navigate("/", { replace: true });
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <>
      <div className="min-vh-100 d-flex align-items-center justify-content-center p-4">
        <div
          className="card shadow-sm"
          style={{ maxWidth: 420, width: "100%" }}
        >
          <div className="card-body p-4">
            <h1> Create Account </h1>
            <p className="text-body-secondary mb-4">
              Join Mise and start tracking your recipes 🥦
            </p>

            {error && <div className="alert alert-danger py-2">{error}</div>}

            <form className="d-grid gap-3" onSubmit={handleCreateAccount}>
              <div className="mb-2">
                <label className="form-label">Name:</label>
                <input
                  name="name"
                  value={name}
                  className="form-control"
                  placeholder="Full name"
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div className="mb-2">
                <label className="form-label">Email:</label>
                <input
                  type="email"
                  name="email"
                  value={email}
                  className="form-control"
                  placeholder="you@example.com"
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="mb-0">
                <label className="form-label"> Password: </label>
                <PasswordField
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <p className="form-text mb-0">
                  Use letters, numbers, and symbols.
                </p>
              </div>

              <button type="submit" className="btn btn-primary">
                Create Account
              </button>

              <button
                type="button"
                className="btn btn-outline-primary"
                onClick={handleBackToLogin}
              >
                Back to Login
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}

export default CreateAccount;
