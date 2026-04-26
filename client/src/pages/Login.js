import { useState } from "react";
import API from "../api";
import "./Login.css"

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState("login"); // "login" | "register"
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    try {
      const res = await API.post("/auth/login", { email, password });
      localStorage.setItem("token", res.data.token);
      window.location = "/";
    } catch (err) {
      alert(err.response?.data || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    setLoading(true);
    try {
      await API.post("/auth/register", { email, password });
      alert("Registered! Now login.");
      setMode("login");
    } catch (err) {
      alert(err.response?.data || "Register failed");
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === "Enter") mode === "login" ? handleLogin() : handleRegister();
  };

  return (

      <div className="login-wrap">
        <div className="brand">
          <div className="brand-name">Job<span>Track</span></div>
          <div className="brand-sub">Application Pipeline</div>
        </div>

        <div className="tabs">
          <button className={`tab ${mode === "login" ? "active" : ""}`} onClick={() => setMode("login")}>
            Sign In
          </button>
          <button className={`tab ${mode === "register" ? "active" : ""}`} onClick={() => setMode("register")}>
            Register
          </button>
        </div>

        <div className="field">
          <label className="field-label">Email</label>
          <input
            className="field-input"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            onKeyDown={handleKey}
          />
        </div>

        <div className="field">
          <label className="field-label">Password</label>
          <input
            className="field-input"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={handleKey}
          />
        </div>

        <button
          className="submit-btn"
          onClick={mode === "login" ? handleLogin : handleRegister}
          disabled={loading}
        >
          {loading ? "Please wait…" : mode === "login" ? "Sign In →" : "Create Account →"}
        </button>

        <p className="hint">Track every application. Land the role.</p>
      </div>
  );
}