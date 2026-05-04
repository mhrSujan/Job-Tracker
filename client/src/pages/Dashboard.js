import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { jobsAPI } from "../api";
import { useAuth } from "../context/AuthContext";
import Nav from "../components/Nav";
import "./Dashboard.css";

const STATUS_META = {
  applied:   { accent: "#4ade80", bg: "#0d1a0d", label: "Applied" },
  interview: { accent: "#818cf8", bg: "#0d0d1a", label: "Interview" },
  offer:     { accent: "#34d399", bg: "#0d1a14", label: "Offer 🎉" },
  rejected:  { accent: "#f87171", bg: "#1a0d0d", label: "Rejected" },
};

export default function Dashboard() {
  const { user } = useAuth();
  const displayName = user?.name || user?.email || "User";

  const [jobs,    setJobs]    = useState([]);
  const [company, setCompany] = useState("");
  const [role,    setRole]    = useState("");
  const [status,  setStatus]  = useState("applied");
  const [link,    setLink]    = useState("");
  const [loading, setLoading] = useState(true);
  const [adding,  setAdding]  = useState(false);
  const [filter,  setFilter]  = useState("all");
  const [error,   setError]   = useState("");

  // GET /api/jobs
  const fetchJobs = async () => {
    try {
      const res = await jobsAPI.list();
      setJobs(res.data);
    } catch {
      // 401 is handled globally by the axios interceptor
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchJobs(); }, []);

  // POST /api/jobs
  const addJob = async () => {
    if (!company.trim() || !role.trim()) return setError("Company and role are required");
    setError("");
    setAdding(true);
    try {
      await jobsAPI.add({ company, role, status, link });
      setCompany(""); setRole(""); setStatus("applied"); setLink("");
      fetchJobs();
    } catch {
      setError("Failed to add job. Make sure the server is running.");
    } finally {
      setAdding(false);
    }
  };

  // DELETE /api/jobs/:id
  const deleteJob = async (id) => {
    try {
      await jobsAPI.remove(id);
      fetchJobs();
    } catch {
      setError("Failed to delete job");
    }
  };

  // PUT /api/jobs/:id
  const updateStatus = async (id, newStatus) => {
    try {
      await jobsAPI.update(id, { status: newStatus });
      fetchJobs();
    } catch {
      setError("Failed to update status");
    }
  };

  const filteredJobs = filter === "all" ? jobs : jobs.filter(j => j.status === filter);
  const stats = {
    total:     jobs.length,
    interview: jobs.filter(j => j.status === "interview").length,
    offer:     jobs.filter(j => j.status === "offer").length,
    rejected:  jobs.filter(j => j.status === "rejected").length,
  };

  return (
    <>
      <Nav />
      <div className="dashboard">
        <div className="header">
          <div>
            <h1 className="title">My Tracker</h1>
            <p className="subtitle">
              Welcome back, {displayName} &nbsp;·&nbsp;
              <Link to="/applied" style={{ color: "#4ade80", textDecoration: "none" }}>
                View platform applications →
              </Link>
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="stats-row">
          {[
            { label: "Total Applied", num: stats.total,     accent: "#818cf8" },
            { label: "Interviews",    num: stats.interview, accent: "#fb923c" },
            { label: "Offers",        num: stats.offer,     accent: "#4ade80" },
            { label: "Rejected",      num: stats.rejected,  accent: "#f87171" },
          ].map(s => (
            <div key={s.label} className="stat-card" style={{ "--accent": s.accent }}>
              <div className="stat-num">{s.num}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Add job form */}
        <div className="add-form">
          <div className="form-row">
            <div className="field">
              <label className="form-label">Company</label>
              <input className="input" placeholder="e.g. Stripe" value={company}
                onChange={e => setCompany(e.target.value)}
                onKeyDown={e => e.key === "Enter" && addJob()} />
            </div>
            <div className="field">
              <label className="form-label">Role</label>
              <input className="input" placeholder="e.g. SWE Intern" value={role}
                onChange={e => setRole(e.target.value)}
                onKeyDown={e => e.key === "Enter" && addJob()} />
            </div>
            <div className="field">
              <label className="form-label">Link (optional)</label>
              <input className="input" placeholder="https://..." value={link}
                onChange={e => setLink(e.target.value)} />
            </div>
            <div className="field">
              <label className="form-label">Status</label>
              <select className="select" value={status} onChange={e => setStatus(e.target.value)}>
                <option value="applied">Applied</option>
                <option value="interview">Interview</option>
                <option value="offer">Offer</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
            <div className="field btn-field">
              <label className="form-label">&nbsp;</label>
              <button className="add-btn" onClick={addJob} disabled={adding}>
                {adding ? "Adding…" : "+ Add"}
              </button>
            </div>
          </div>
          {error && <div className="form-error">{error}</div>}
        </div>

        {/* Filters */}
        <div className="filters">
          {["all", "applied", "interview", "offer", "rejected"].map(f => (
            <button key={f} className={`filter-btn ${filter === f ? "active" : ""}`}
              onClick={() => setFilter(f)}>{f}</button>
          ))}
        </div>

        {/* Job list */}
        <div className="jobs-list">
          {loading ? (
            <div className="loading">Loading…</div>
          ) : filteredJobs.length === 0 ? (
            <div className="empty">
              <div className="empty-icon">📭</div>
              {filter === "all" ? "No applications yet. Add your first above." : `No ${filter} applications.`}
            </div>
          ) : (
            filteredJobs.map(job => {
              const s = STATUS_META[job.status] || STATUS_META.applied;
              return (
                <div key={job._id} className="job-card" style={{ "--bg": s.bg, "--accent": s.accent }}>
                  <div className="job-info">
                    <div className="job-company">{job.company}</div>
                    <div className="job-role">{job.role}</div>
                    {job.link && (
                      <a className="job-link" href={job.link} target="_blank" rel="noreferrer">
                        View posting ↗
                      </a>
                    )}
                    <div className="job-date">
                      {new Date(job.dateApplied).toLocaleDateString("en-US", {
                        month: "short", day: "numeric", year: "numeric",
                      })}
                    </div>
                  </div>
                  <div className="job-actions">
                    <select className="status-select" value={job.status}
                      onChange={e => updateStatus(job._id, e.target.value)}>
                      <option value="applied">Applied</option>
                      <option value="interview">Interview</option>
                      <option value="offer">Offer</option>
                      <option value="rejected">Rejected</option>
                    </select>
                    <span className="status-badge">{s.label}</span>
                    <button className="del-btn" onClick={() => deleteJob(job._id)}>✕</button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </>
  );
}