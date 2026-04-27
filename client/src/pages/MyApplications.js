
import { useEffect, useState } from "react";
import { applyAPI } from "../api";
import Nav from "../components/Nav";
import "./MyApplications.css";

const STATUS_META = {
  submitted:  { color: "#818cf8", label: "Submitted",  icon: "📤" },
  reviewing:  { color: "#fb923c", label: "Reviewing",  icon: "👀" },
  interview:  { color: "#38bdf8", label: "Interview",  icon: "🎤" },
  offer:      { color: "#4ade80", label: "Offer 🎉",   icon: "🎉" },
  rejected:   { color: "#f87171", label: "Rejected",   icon: "❌" },
};

// Visual progress pipeline
const STAGES = ["submitted", "reviewing", "interview", "offer"];

export default function MyApplications() {
  const [apps,    setApps]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter,  setFilter]  = useState("all");
  const [error,   setError]   = useState("");

  useEffect(() => {
    applyAPI.myApps()
      .then(res => setApps(res.data))
      .catch(() => setError("Failed to load applications"))
      .finally(() => setLoading(false));
  }, []);

  const withdraw = async (appId) => {
    if (!window.confirm("Withdraw this application?")) return;
    try {
      await applyAPI.withdraw(appId);
      setApps(prev => prev.filter(a => a._id !== appId));
    } catch (err) {
      alert(err.response?.data?.error || "Cannot withdraw");
    }
  };

  const filtered = filter === "all" ? apps : apps.filter(a => a.status === filter);

  // Stats
  const stats = {};
  Object.keys(STATUS_META).forEach(s => { stats[s] = apps.filter(a => a.status === s).length; });

  return (
    <>
      <Nav />
      <div className="myapps">
        <div className="myapps-header">
          <h1 className="myapps-title">My Applications</h1>
          <p className="myapps-sub">Track every application you submitted through JobTrack</p>
        </div>

        {/* Stats row */}
        <div className="app-stats">
          {Object.entries(STATUS_META).map(([key, meta]) => (
            <div key={key} className="app-stat" style={{ "--c": meta.color }}>
              <span className="app-stat-icon">{meta.icon}</span>
              <span className="app-stat-num">{stats[key] || 0}</span>
              <span className="app-stat-label">{meta.label}</span>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="filters">
          {["all", ...Object.keys(STATUS_META)].map(f => (
            <button key={f} className={`filter-btn ${filter === f ? "active" : ""}`}
              onClick={() => setFilter(f)}>
              {f}
            </button>
          ))}
        </div>

        {error && <div className="myapps-error">{error}</div>}

        {/* Applications list */}
        {loading ? (
          <div className="loading">Loading applications…</div>
        ) : filtered.length === 0 ? (
          <div className="empty">
            <div className="empty-icon">📭</div>
            {filter === "all"
              ? "No applications yet. Browse the Job Board to apply!"
              : `No ${filter} applications.`}
          </div>
        ) : (
          <div className="app-list">
            {filtered.map(app => {
              const listing = app?.listingId || {};
              const company = app?.companyId || {};
              const meta    = STATUS_META[app.status] || STATUS_META.submitted;
              const stageIdx = STAGES.indexOf(app.status);

              return (
                <div key={app._id} className="app-card" style={{ "--accent": meta.color }}>
                  <div className="app-card-top">
                    <div className="app-info">
                      <div className="app-company">{listing?.companyName || company?.companyName || "Unknown Company"}</div>
                      <div className="app-title">{listing?.title || "Position"}</div>
                      <div className="app-sub-meta">
                        {listing?.location && <span>📍 {listing.location}</span>}
                        {listing?.type     && <span>· {listing.type}</span>}
                        {listing?.salary   && <span>· {listing.salary}</span>}
                      </div>
                    </div>
                    <div className="app-right">
                      <span className="app-status-badge" style={{ "--c": meta.color }}>
                        {meta.icon} {meta.label}
                      </span>
                      <div className="app-date">
                        Applied {new Date(app.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </div>
                    </div>
                  </div>

                  {/* Progress bar (not shown for rejected) */}
                  {app.status !== "rejected" && (
                    <div className="progress-bar">
                      {STAGES.map((stage, i) => (
                        <div key={stage} className={`progress-step ${i <= stageIdx ? "done" : ""}`}
                          style={{ "--c": i <= stageIdx ? meta.color : "#1e1e1e" }}>
                          <div className="progress-dot" />
                          <div className="progress-label">{stage}</div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Cover letter preview */}
                  {app.coverLetter && (
                    <details className="cover-preview">
                      <summary>View cover letter</summary>
                      <p>{app.coverLetter}</p>
                    </details>
                  )}

                  {/* Withdraw (only for submitted) */}
                  {app.status === "submitted" && (
                    <button className="withdraw-btn" onClick={() => withdraw(app._id)}>
                      Withdraw application
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}