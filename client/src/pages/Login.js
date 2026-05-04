import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { authAPI } from "../api";
import { useAuth } from "../context/AuthContext";
import "./Login.css";

export default function Login() {
  const navigate  = useNavigate();
  const { login } = useAuth();

  const [mode,        setMode]        = useState("login");
  const [role,        setRole]        = useState("applicant");
  const [email,       setEmail]       = useState("");
  const [password,    setPassword]    = useState("");
  const [name,        setName]        = useState("");
  const [companyName, setCompanyName] = useState("");
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState("");

  const handleSubmit = async () => {
    setError("");

    // Validation
    if (!email.trim() || !password.trim()) {
      return setError("Email and password are required");
    }
    if (mode === "register") {
      if (role === "applicant" && !name.trim())        return setError("Name is required");
      if (role === "admin"     && !companyName.trim()) return setError("Company name is required");
    }

    setLoading(true);
    try {
      if (mode === "login") {
        const res = await authAPI.login({ email, password });
        login(res.data.token, res.data.user);
        navigate(res.data.user.role === "admin" ? "/admin" : "/");
      } else {
        const payload = { email, password, role };
        if (role === "applicant") payload.name        = name;
        if (role === "admin")     payload.companyName = companyName;
        const res = await authAPI.register(payload);
        login(res.data.token, res.data.user);
        navigate(res.data.user.role === "admin" ? "/admin" : "/");
      }
    } catch (err) {
      setError(err.response?.data?.error || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => { if (e.key === "Enter") handleSubmit(); };

  const switchMode = (m) => { setMode(m); setError(""); };

  return (
    <div className="login-page">
      <div className="login-wrap">
        {/* Brand */}
        <div className="brand">
          <div className="brand-name">Job<span>Track</span></div>
          <div className="brand-sub">Connecting talent with opportunity</div>
        </div>

        {/* Login / Register tabs */}
        <div className="tabs">
          <button className={`tab ${mode === "login"    ? "active" : ""}`} onClick={() => switchMode("login")}>Sign In</button>
          <button className={`tab ${mode === "register" ? "active" : ""}`} onClick={() => switchMode("register")}>Register</button>
        </div>

        {/* Role picker — register only */}
        {mode === "register" && (
          <div className="role-picker">
            <button className={`role-btn ${role === "applicant" ? "active" : ""}`} onClick={() => setRole("applicant")}>
              <span className="role-icon">🎯</span>
              <span className="role-label">Job Seeker</span>
              <span className="role-desc">Find & track jobs</span>
            </button>
            <button className={`role-btn ${role === "admin" ? "active" : ""}`} onClick={() => setRole("admin")}>
              <span className="role-icon">🏢</span>
              <span className="role-label">Company</span>
              <span className="role-desc">Post & manage listings</span>
            </button>
          </div>
        )}

        {/* Extra fields for register */}
        {mode === "register" && role === "applicant" && (
          <div className="field">
            <label className="field-label">Your Name</label>
            <input className="field-input" placeholder="Jane Doe" value={name}
              onChange={e => setName(e.target.value)} onKeyDown={handleKey} />
          </div>
        )}
        {mode === "register" && role === "admin" && (
          <div className="field">
            <label className="field-label">Company Name</label>
            <input className="field-input" placeholder="Acme Corp" value={companyName}
              onChange={e => setCompanyName(e.target.value)} onKeyDown={handleKey} />
          </div>
        )}

        {/* Email & Password */}
        <div className="field">
          <label className="field-label">Email</label>
          <input className="field-input" type="email" placeholder="you@example.com"
            value={email} onChange={e => setEmail(e.target.value)} onKeyDown={handleKey} />
        </div>
        <div className="field">
          <label className="field-label">Password</label>
          <input className="field-input" type="password" placeholder="••••••••"
            value={password} onChange={e => setPassword(e.target.value)} onKeyDown={handleKey} />
        </div>

        {error && <div className="login-error">{error}</div>}

        <button className="submit-btn" onClick={handleSubmit} disabled={loading}>
          {loading ? "Please wait…" : mode === "login" ? "Sign In →" : "Create Account →"}
        </button>

        <p className="hint">Track every application. Land the role.</p>
      </div>
    </div>
  );
}