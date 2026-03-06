import { useState } from "react";

function PasswordField({ value, onChange }) {
  const [show, setShow] = useState(false);

  return (
    <div className="input-group">
      <input
        type={show ? "text" : "password"}
        className="form-control"
        placeholder="Password"
        value={value}
        onChange={onChange}
        required
      />

      <button
        type="button"
        className="btn btn-outline-secondary"
        onClick={() => setShow((s) => !s)}
      >
        <i className={`bi ${show ? "bi-eye-slash" : "bi-eye"}`}></i>
      </button>
    </div>
  );
}

export default PasswordField;
