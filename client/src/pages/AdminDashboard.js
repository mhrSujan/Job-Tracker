

import { useEffect, useState } from "react";
import { companyAPI } from "../api";
import Nav from "../components/Nav";
import "./AdminDashboard.css";

const APP_STATUS_META = {
  submitted:  { color: "#818cf8", label: "Submitted" },
  reviewing:  { color: "#fb923c", label: "Reviewing" },
  interview:  { color: "#38bdf8", label: "Interview" },
  offer:      { color: "#4ade80", label: "Offer" },
  rejected:   { color: "#f87171", label: "Rejected" },
};

const NEXT_STATUS = {
  submitted: "reviewing",
  reviewing: "interview",
  interview: "offer",
};

export default function AdminDashboard() {
  const [tab,      setTab]      = useState("overview");   // overview | listings | applications
  const [stats,    setStats]    = useState(null);
  const [listings, setListings] = useState([]);
  const [apps,     setApps]     = useState([]);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");

  // New listing form
  const [showForm,  setShowForm]  = useState(false);
  const [editId,    setEditId]    = useState(null);
  const [form,      setForm]      = useState({ title:"", description:"", location:"Remote", type:"full-time", salary:"", skills:"", deadline:"" });

  // Applications filter
  const [appFilter, setAppFilter] = useState("all");
  const [noteEdit,  setNoteEdit]  = useState({});   // appId -> draft note

  // ── Fetchers ──────────────────────────────────────────────
  const loadStats    = () => companyAPI.stats()       .then(r => setStats(r.data));
  const loadListings = () => companyAPI.getListings() .then(r => setListings(r.data));
  const loadApps     = () => companyAPI.getAllApps()  .then(r => setApps(r.data));

  useEffect(() => {
    setLoading(true);
    Promise.all([loadStats(), loadListings(), loadApps()])
      .catch(() => setError("Failed to load data"))
      .finally(() => setLoading(false));
  }, []);

  // ── Listing CRUD ───────────────────────────────────────────
  const openNew = () => {
    setForm({ title:"", description:"", location:"Remote", type:"full-time", salary:"", skills:"", deadline:"" });
    setEditId(null);
    setShowForm(true);
  };
  const openEdit = (l) => {
    setForm({
      title:       l.title,
      description: l.description,
      location:    l.location || "Remote",
      type:        l.type     || "full-time",
      salary:      l.salary   || "",
      skills:      (l.skills || []).join(", "),
      deadline:    l.deadline ? l.deadline.slice(0,10) : "",
    });
    setEditId(l._id);
    setShowForm(true);
  };
  const saveListing = async () => {
    setError("");
    const payload = {
      ...form,
      skills: form.skills.split(",").map(s => s.trim()).filter(Boolean),
      deadline: form.deadline || null,
    };
    try {
      if (editId) {
        await companyAPI.updateListing(editId, payload);
      } else {
        await companyAPI.createListing(payload);
      }
      setShowForm(false);
      await loadListings();
      await loadStats();
    } catch (err) {
      setError(err.response?.data?.error || "Save failed");
    }
  };
  const deleteListing = async (id) => {
    if (!window.confirm("Delete this listing and all its applications?")) return;
    await companyAPI.deleteListing(id);
    await loadListings();
    await loadApps();
    await loadStats();
  };
  const toggleListing = async (id) => {
    await companyAPI.toggleListing(id);
    await loadListings();
  };

  // ── Application actions ────────────────────────────────────
  const advanceStatus = async (app) => {
    const next = NEXT_STATUS[app.status];
    if (!next) return;
    await companyAPI.updateAppStatus(app._id, next);
    await loadApps();
    await loadStats();
  };
  const rejectApp = async (app) => {
    await companyAPI.updateAppStatus(app._id, "rejected");
    await loadApps();
    await loadStats();
  };
  const saveNote = async (appId) => {
    await companyAPI.saveNotes(appId, noteEdit[appId] ?? "");
    setNoteEdit(prev => { const n = {...prev}; delete n[appId]; return n; });
    await loadApps();
  };

  const filteredApps = appFilter === "all" ? apps : apps.filter(a => a.status === appFilter);

  // ── Render ─────────────────────────────────────────────────
  if (loading) return (
    <>
      <Nav />
      <div style={{ textAlign:"center", padding:"80px", color:"#333", fontFamily:"'DM Mono',monospace", fontSize:"12px", letterSpacing:"2px" }}>
        Loading dashboard…
      </div>
    </>
  );

  return (
    <>
      <Nav />
      <div className="admin">
        {/* Title */}
        <div className="admin-header">
          <h1 className="admin-title">Company Dashboard</h1>
          <p className="admin-sub">Manage listings · Review candidates · Make decisions</p>
        </div>

        {error && <div className="admin-error">{error}</div>}

        {/* Tabs */}
        <div className="admin-tabs">
          {["overview","listings","applications"].map(t => (
            <button key={t} className={`admin-tab ${tab === t ? "active" : ""}`}
              onClick={() => setTab(t)}>
              {t}
            </button>
          ))}
        </div>

        {/* ═══════════ OVERVIEW ═══════════ */}
        {tab === "overview" && stats && (
          <div className="overview">
            <div className="overview-stats">
              {[
                { label: "Open Listings",     num: stats?.openListings,  accent: "#4ade80" },
                { label: "Total Listings",    num: stats?.totalListings, accent: "#818cf8" },
                { label: "Total Applicants",  num: stats?.totalApps,     accent: "#fb923c" },
                { label: "In Review",         num: stats?.reviewing,     accent: "#38bdf8" },
                { label: "Interviewing",      num: stats?.interview,     accent: "#a78bfa" },
                { label: "Offers Made",       num: stats?.offer,         accent: "#34d399" },
              ].map(s => (
                <div key={s.label} className="ov-stat" style={{ "--accent": s.accent }}>
                  <div className="ov-num">{s.num}</div>
                  <div className="ov-label">{s.label}</div>
                </div>
              ))}
            </div>

            {/* Funnel */}
            <div className="funnel-wrap">
              <div className="funnel-title">Application Funnel</div>
              <div className="funnel">
                {[
                  { stage: "Applied",    count: stats?.totalApps,  color: "#818cf8" },
                  { stage: "Reviewing",  count: stats?.reviewing,  color: "#fb923c" },
                  { stage: "Interview",  count: stats?.interview,  color: "#38bdf8" },
                  { stage: "Offer",      count: stats?.offer,      color: "#4ade80" },
                ].map((f, i, arr) => {
                  const pct = arr[0].count > 0 ? Math.round((f.count / arr[0].count) * 100) : 0;
                  return (
                    <div key={f.stage} className="funnel-row">
                      <div className="funnel-label">{f.stage}</div>
                      <div className="funnel-bar-wrap">
                        <div className="funnel-bar" style={{ width: `${pct}%`, background: f.color }} />
                      </div>
                      <div className="funnel-count" style={{ color: f.color }}>{f.count}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ═══════════ LISTINGS ═══════════ */}
        {tab === "listings" && (
          <div className="listings-section">
            <div className="listings-toolbar">
              <button className="new-btn" onClick={openNew}>+ New Listing</button>
            </div>

            {/* Create / Edit form */}
            {showForm && (
              <div className="listing-form">
                <div className="lf-title">{editId ? "Edit Listing" : "New Listing"}</div>
                <div className="lf-grid">
                  <div className="lf-field full">
                    <label>Job Title *</label>
                    <input value={form.title} onChange={e => setForm(p => ({...p, title: e.target.value}))} placeholder="e.g. Senior React Developer" />
                  </div>
                  <div className="lf-field full">
                    <label>Description *</label>
                    <textarea value={form.description} onChange={e => setForm(p => ({...p, description: e.target.value}))}
                      placeholder="Describe the role, responsibilities, and requirements…" rows={5} />
                  </div>
                  <div className="lf-field">
                    <label>Location</label>
                    <input value={form.location} onChange={e => setForm(p => ({...p, location: e.target.value}))} placeholder="Remote / New York, NY" />
                  </div>
                  <div className="lf-field">
                    <label>Type</label>
                    <select value={form.type} onChange={e => setForm(p => ({...p, type: e.target.value}))}>
                      <option value="full-time">Full-Time</option>
                      <option value="part-time">Part-Time</option>
                      <option value="contract">Contract</option>
                      <option value="internship">Internship</option>
                    </select>
                  </div>
                  <div className="lf-field">
                    <label>Salary Range</label>
                    <input value={form.salary} onChange={e => setForm(p => ({...p, salary: e.target.value}))} placeholder="$80k–$100k" />
                  </div>
                  <div className="lf-field">
                    <label>Application Deadline</label>
                    <input type="date" value={form.deadline} onChange={e => setForm(p => ({...p, deadline: e.target.value}))} />
                  </div>
                  <div className="lf-field full">
                    <label>Skills (comma-separated)</label>
                    <input value={form.skills} onChange={e => setForm(p => ({...p, skills: e.target.value}))} placeholder="React, Node.js, MongoDB" />
                  </div>
                </div>
                <div className="lf-actions">
                  <button className="lf-save" onClick={saveListing}>
                    {editId ? "Save Changes" : "Create Listing"}
                  </button>
                  <button className="lf-cancel" onClick={() => setShowForm(false)}>Cancel</button>
                </div>
              </div>
            )}

            {/* Listings table */}
            {listings.length === 0 ? (
              <div className="empty">
                <div className="empty-icon">📋</div>
                No listings yet. Create your first one above.
              </div>
            ) : (
              <div className="listing-table">
                {listings.map(l => (
                  <div key={l._id} className={`lt-row ${l.isOpen ? "" : "closed"}`}>
                    <div className="lt-info">
                      <div className="lt-title">{l.title}</div>
                      <div className="lt-meta">
                        {l.type} · {l.location}
                        {l.salary && ` · ${l.salary}`}
                        {l.deadline && ` · Deadline: ${new Date(l.deadline).toLocaleDateString("en-US",{month:"short",day:"numeric"})}`}
                      </div>
                      {l.skills?.length > 0 && (
                        <div className="lt-skills">
                          {l.skills.slice(0,4).map(sk => <span key={sk} className="skill-chip">{sk}</span>)}
                        </div>
                      )}
                    </div>
                    <div className="lt-right">
                      <div className="lt-apps">{l.applicationCount} applicants</div>
                      <span className={`lt-status ${l.isOpen ? "open" : "closed-badge"}`}>
                        {l.isOpen ? "Open" : "Closed"}
                      </span>
                      <div className="lt-actions">
                        <button className="lt-btn" onClick={() => openEdit(l)}>Edit</button>
                        <button className="lt-btn" onClick={() => toggleListing(l._id)}>
                          {l.isOpen ? "Close" : "Reopen"}
                        </button>
                        <button className="lt-btn danger" onClick={() => deleteListing(l._id)}>Delete</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ═══════════ APPLICATIONS ═══════════ */}
        {tab === "applications" && (
          <div className="apps-section">
            <div className="app-filter-row">
              <span className="app-filter-label">{filteredApps.length} applications</span>
              <div className="filters">
                {["all", ...Object.keys(APP_STATUS_META)].map(f => (
                  <button key={f} className={`filter-btn ${appFilter === f ? "active" : ""}`}
                    onClick={() => setAppFilter(f)}>{f}</button>
                ))}
              </div>
            </div>

            {filteredApps.length === 0 ? (
              <div className="empty">
                <div className="empty-icon">📭</div>
                No applications {appFilter !== "all" ? `with status "${appFilter}"` : "yet"}.
              </div>
            ) : (
              <div className="app-table">
                {filteredApps.map(app => {
                  const meta      = APP_STATUS_META[app.status] || APP_STATUS_META.submitted;
                  const applicant = app.applicantId;
                  const listing   = app.listingId;
                  const nextStatus = NEXT_STATUS[app.status];
                  const isEditingNote = app._id in noteEdit;

                  return (
                    <div key={app._id} className="at-row">
                      <div className="at-top">
                        <div className="at-applicant">
                          <div className="at-name">{applicant?.name || applicant?.email || "Unknown"}</div>
                          <div className="at-email">{applicant?.email}</div>
                          {applicant?.title && <div className="at-pro-title">{applicant.title}</div>}
                          {applicant?.skills?.length > 0 && (
                            <div className="at-skills">
                              {applicant.skills.slice(0,4).map(sk => <span key={sk} className="skill-chip">{sk}</span>)}
                            </div>
                          )}
                        </div>
                        <div className="at-listing">
                          <div className="at-role">{listing?.title || "Unknown Role"}</div>
                          <div className="at-date">
                            Applied {new Date(app.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                          </div>
                          {app.reviewedAt  && <div className="at-ts">Reviewed {new Date(app.reviewedAt).toLocaleDateString("en-US",{month:"short",day:"numeric"})}</div>}
                          {app.interviewAt && <div className="at-ts">Interview set {new Date(app.interviewAt).toLocaleDateString("en-US",{month:"short",day:"numeric"})}</div>}
                        </div>
                        <div className="at-status-col">
                          <span className="at-badge" style={{ "--c": meta.color }}>{meta.label}</span>
                          {applicant?.resumeUrl && (
                            <a className="at-resume" href={applicant.resumeUrl} target="_blank" rel="noreferrer">
                              View Resume ↗
                            </a>
                          )}
                        </div>
                      </div>

                      {/* Cover letter */}
                      {app.coverLetter && (
                        <details className="at-cover">
                          <summary>Cover letter</summary>
                          <p>{app.coverLetter}</p>
                        </details>
                      )}

                      {/* Admin notes */}
                      <div className="at-notes-wrap">
                        {isEditingNote ? (
                          <div className="at-note-edit">
                            <textarea className="at-note-input" rows={2}
                              value={noteEdit[app._id]}
                              onChange={e => setNoteEdit(p => ({...p, [app._id]: e.target.value}))}
                              placeholder="Private admin notes (applicant never sees this)…"
                            />
                            <div className="at-note-btns">
                              <button className="at-note-save" onClick={() => saveNote(app._id)}>Save Note</button>
                              <button className="at-note-cancel" onClick={() => setNoteEdit(p => { const n={...p}; delete n[app._id]; return n; })}>Cancel</button>
                            </div>
                          </div>
                        ) : (
                          <div className="at-note-display" onClick={() => setNoteEdit(p => ({...p, [app._id]: app.adminNotes || ""}))}>
                            {app.adminNotes
                              ? <span className="at-note-text">📝 {app.adminNotes}</span>
                              : <span className="at-note-empty">+ Add private note</span>}
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="at-actions">
                        {nextStatus && (
                          <button className="at-advance" onClick={() => advanceStatus(app)}>
                            Move to {APP_STATUS_META[nextStatus]?.label} →
                          </button>
                        )}
                        {app.status !== "rejected" && app.status !== "offer" && (
                          <button className="at-reject" onClick={() => rejectApp(app)}>Reject</button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}