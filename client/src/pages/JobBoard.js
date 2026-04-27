
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { listingsAPI, applyAPI } from "../api";
import { useAuth } from "../context/AuthContext";
import Nav from "../components/Nav";
import "./JobBoard.css";

const TYPE_META = {
  "full-time":  { color: "#4ade80", label: "Full-Time" },
  "part-time":  { color: "#fb923c", label: "Part-Time" },
  "contract":   { color: "#818cf8", label: "Contract" },
  "internship": { color: "#38bdf8", label: "Internship" },
};

export default function JobBoard() {
  const { user }   = useAuth();
  const navigate   = useNavigate();

  const [listings,  setListings]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [search,    setSearch]    = useState("");
  const [typeFilter,setTypeFilter]= useState("");
  const [applying,  setApplying]  = useState(null);   // listingId being applied to
  const [cover,     setCover]     = useState("");
  const [applied,   setApplied]   = useState(new Set()); // listingIds already applied
  const [error,     setError]     = useState("");
  const [success,   setSuccess]   = useState("");
  const [selected,  setSelected]  = useState(null);   // expanded listing

  const fetchListings = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search)     params.q    = search;
      if (typeFilter) params.type = typeFilter;
      const res = await listingsAPI.list(params);
      setListings(res.data);
    } finally {
      setLoading(false);
    }
  };

  // Load my applied listing IDs so we can show "Applied" badges
  const fetchMyApps = async () => {
    if (!user || user.role !== "applicant") return;
    try {
      const res = await applyAPI.myApps();
      const ids = new Set(res.data.map(a => a.listingId?._id).filter(Boolean));
      setApplied(ids);
    } catch { /* ignore */ }
  };

  useEffect(() => { fetchListings(); }, [search, typeFilter]);
  useEffect(() => { fetchMyApps(); }, [user]);

  const openApply = (listingId) => {
    if (!user)               return navigate("/login");
    if (user.role === "admin") return;
    setCover("");
    setError("");
    setApplying(listingId);
  };

  const submitApply = async () => {
    setError(""); setSuccess("");
    try {
      await applyAPI.submit(applying, { coverLetter: cover });
      setApplied(prev => new Set([...prev, applying]));
      setSuccess("Application submitted! 🎉");
      setApplying(null);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to apply");
    }
  };

  return (
    <>
      <Nav />
      <div className="board">
        {/* Header */}
        <div className="board-header">
          <div>
            <h1 className="board-title">Job Board</h1>
            <p className="board-sub">{listings.length} open positions</p>
          </div>
        </div>

        {/* Search + filter */}
        <div className="board-controls">
          <input className="board-search" placeholder="Search by title, company, or skill…"
            value={search} onChange={e => setSearch(e.target.value)} />
          <div className="board-filters">
            {["", "full-time", "part-time", "contract", "internship"].map(t => (
              <button key={t} className={`filter-btn ${typeFilter === t ? "active" : ""}`}
                onClick={() => setTypeFilter(t)}>
                {t || "All"}
              </button>
            ))}
          </div>
        </div>

        {success && <div className="board-success">{success}</div>}

        {/* Listings grid */}
        {loading ? (
          <div className="board-loading">Scanning listings…</div>
        ) : listings.length === 0 ? (
          <div className="board-empty">
            <div className="empty-icon">🔍</div>
            No listings found. Try a different search.
          </div>
        ) : (
          <div className="listings-grid">
            {listings.map(l => {
              const tm      = TYPE_META[l.type] || TYPE_META["full-time"];
              const hasApplied = applied.has(l._id);
              const isExpanded = selected === l._id;
              return (
                <div key={l._id} className={`listing-card ${isExpanded ? "expanded" : ""}`}>
                  <div className="listing-header" onClick={() => setSelected(isExpanded ? null : l._id)}>
                    <div className="listing-meta">
                      <div className="listing-company">{l.companyName}</div>
                      <div className="listing-title">{l.title}</div>
                      <div className="listing-tags">
                        <span className="tag" style={{ "--c": tm.color }}>{tm.label}</span>
                        <span className="tag" style={{ "--c": "#888" }}>📍 {l.location}</span>
                        {l.salary && <span className="tag" style={{ "--c": "#4ade80" }}>💰 {l.salary}</span>}
                      </div>
                    </div>
                    <div className="listing-right">
                      <div className="listing-apps">{l.applicationCount} applied</div>
                      <span className="expand-icon">{isExpanded ? "▲" : "▼"}</span>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="listing-body">
                      <p className="listing-desc">{l.description}</p>
                      {l.skills?.length > 0 && (
                        <div className="listing-skills">
                          {l.skills.map(sk => <span key={sk} className="skill-chip">{sk}</span>)}
                        </div>
                      )}
                      {l.deadline && (
                        <div className="listing-deadline">
                          Deadline: {new Date(l.deadline).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                        </div>
                      )}

                      {/* Apply / Applied */}
                      {user?.role === "applicant" && (
                        hasApplied ? (
                          <div className="applied-badge">✓ You applied</div>
                        ) : applying === l._id ? (
                          <div className="apply-form">
                            <label className="form-label">Cover Letter (optional)</label>
                            <textarea className="cover-input"
                              placeholder="Tell the company why you're a great fit…"
                              value={cover} onChange={e => setCover(e.target.value)} rows={4} />
                            {error && <div className="apply-error">{error}</div>}
                            <div className="apply-btns">
                              <button className="apply-submit-btn" onClick={submitApply}>Submit Application</button>
                              <button className="apply-cancel-btn" onClick={() => setApplying(null)}>Cancel</button>
                            </div>
                          </div>
                        ) : (
                          <button className="apply-btn" onClick={() => openApply(l._id)}>Apply Now →</button>
                        )
                      )}

                      {!user && (
                        <button className="apply-btn" onClick={() => navigate("/login")}>Sign in to Apply →</button>
                      )}
                    </div>
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