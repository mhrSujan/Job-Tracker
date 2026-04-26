import { useEffect, useState } from "react";
import API from "../api";
import "./Dashboard.css"

const statusColors = {
  applied: { bg: "#1a2a1a", accent: "#4ade80", label: "Applied" },
  interview: { bg: "#1a1a2a", accent: "#818cf8", label: "Interview" },
  offer: { bg: "#1a2a20", accent: "#34d399", label: "Offer 🎉" },
  rejected: { bg: "#2a1a1a", accent: "#f87171", label: "Rejected" },
};

export default function Dashboard() {
  const [jobs, setJobs] = useState([]);
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [status, setStatus] = useState("applied");
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [filter, setFilter] = useState("all");

  const fetchJobs = async () => {
    try {
      const res = await API.get("/jobs");
      setJobs(res.data);
    } catch {
      window.location = "/login";
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      window.location = "/login";
    } else {
      fetchJobs();
    }
  }, []);

  const addJob = async () => {
    if (!company || !role) return alert("Fill all fields");
    setAdding(true);
    await API.post("/jobs", { company, role, status });
    setCompany("");
    setRole("");
    setStatus("applied");
    setAdding(false);
    fetchJobs();
  };

  const deleteJob = async (id) => {
    await API.delete(`/jobs/${id}`);
    fetchJobs();
  };

  const updateStatus = async (id, newStatus) => {
    await API.put(`/jobs/${id}`, { status: newStatus });
    fetchJobs();
  };

  const logout = () => {
    localStorage.removeItem("token");
    window.location = "/login";
  };

  const filteredJobs = filter === "all" ? jobs : jobs.filter(j => j.status === filter);

  const stats = {
    total: jobs.length,
    interview: jobs.filter(j => j.status === "interview").length,
    offer: jobs.filter(j => j.status === "offer").length,
  };

  return (

      <div className="dashboard">
        <div className="header">
          <div>
            <h1 className="title">Job<span>Track</span></h1>
            <p className="subtitle">Application pipeline</p>
          </div>
          <button className="logout-btn" onClick={logout}>Sign out</button>
        </div>

        <div className="stats-row">
          <div className="stat-card" style={{ "--accent": "#818cf8" }}>
            <div className="stat-num">{stats.total}</div>
            <div className="stat-label">Total Applied</div>
          </div>
          <div className="stat-card" style={{ "--accent": "#fb923c" }}>
            <div className="stat-num">{stats.interview}</div>
            <div className="stat-label">Interviews</div>
          </div>
          <div className="stat-card" style={{ "--accent": "#4ade80" }}>
            <div className="stat-num">{stats.offer}</div>
            <div className="stat-label">Offers</div>
          </div>
        </div>

        <div className="add-form">
          <div className="form-row">
            <div className="field">
              <label className="form-label">Company</label>
              <input
                className="input"
                placeholder="e.g. Stripe"
                value={company}
                onChange={e => setCompany(e.target.value)}
                onKeyDown={e => e.key === "Enter" && addJob()}
              />
            </div>
            <div className="field">
              <label className="form-label">Role</label>
              <input
                className="input"
                placeholder="e.g. SWE Intern"
                value={role}
                onChange={e => setRole(e.target.value)}
                onKeyDown={e => e.key === "Enter" && addJob()}
              />
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
            <div className="field">
              <label className="form-label">&nbsp;</label>
              <button className="add-btn" onClick={addJob} disabled={adding}>
                {adding ? "Adding…" : "+ Add"}
              </button>
            </div>
          </div>
        </div>

        <div className="filters">
          {["all", "applied", "interview", "offer", "rejected"].map(f => (
            <button
              key={f}
              className={`filter-btn ${filter === f ? "active" : ""}`}
              onClick={() => setFilter(f)}
            >
              {f}
            </button>
          ))}
        </div>

        <div className="jobs-list">
          {loading ? (
            <div className="loading">Loading applications…</div>
          ) : filteredJobs.length === 0 ? (
            <div className="empty">
              <div className="empty-icon">📭</div>
              {filter === "all" ? "No applications yet. Add your first one above." : `No ${filter} applications.`}
            </div>
          ) : (
            filteredJobs.map(job => {
              const s = statusColors[job.status] || statusColors.applied;
              return (
                <div
                  key={job._id}
                  className="job-card"
                  style={{ "--bg": s.bg, "--accent": s.accent }}
                >
                  <div className="job-info">
                    <div className="job-company">{job.company}</div>
                    <div className="job-role">{job.role}</div>
                    {job.dateApplied && (
                      <div className="job-date">
                        {new Date(job.dateApplied).toLocaleDateString("en-US", {
                          month: "short", day: "numeric", year: "numeric"
                        })}
                      </div>
                    )}
                  </div>
                  <div className="job-actions">
                    <select
                      className="status-select"
                      value={job.status}
                      onChange={e => updateStatus(job._id, e.target.value)}
                    >
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

  );
}