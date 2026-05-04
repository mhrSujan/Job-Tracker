import axios from "axios";

// ── Base instance ─────────────────────────────────────────────
const API = axios.create({ baseURL: "http://localhost:5000/api" });

// Attach JWT token from localStorage to every request
API.interceptors.request.use((req) => {
  const token = localStorage.getItem("token");
  if (token) req.headers.authorization = `Bearer ${token}`;
  return req;
});

// If server returns 401, clear storage and redirect to login
API.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

// ── Auth ─────────────────────────────────────────────────────
// POST /api/auth/register  { email, password, role, name?, companyName? }
// POST /api/auth/login     { email, password }
export const authAPI = {
  register: (data) => API.post("/auth/register", data),
  login:    (data) => API.post("/auth/login",    data),
};

// ── Personal Job Tracker (applicants only) ────────────────────
// GET    /api/jobs
// POST   /api/jobs          { company, role, status, notes?, link? }
// PUT    /api/jobs/:id      { status, ... }
// DELETE /api/jobs/:id
export const jobsAPI = {
  list:   ()         => API.get("/jobs"),
  add:    (data)     => API.post("/jobs",       data),
  update: (id, data) => API.put(`/jobs/${id}`,  data),
  remove: (id)       => API.delete(`/jobs/${id}`),
};

// ── Public Job Board (no auth needed) ────────────────────────
// GET /api/listings          ?q=search&type=full-time
// GET /api/listings/:id
export const listingsAPI = {
  list:    (params) => API.get("/listings",       { params }),
  getById: (id)     => API.get(`/listings/${id}`),
};

// ── Applications (applicants only) ───────────────────────────
// POST   /api/apply/:listingId   { coverLetter? }
// GET    /api/apply/mine
// DELETE /api/apply/:appId
export const applyAPI = {
  submit:   (listingId, data) => API.post(`/apply/${listingId}`, data),
  myApps:   ()                => API.get("/apply/mine"),
  withdraw: (appId)           => API.delete(`/apply/${appId}`),
};

// ── Company / Admin ───────────────────────────────────────────
// Listings
// GET    /api/company/listings
// POST   /api/company/listings        { title, description, location, type, salary, skills[], deadline? }
// PUT    /api/company/listings/:id
// DELETE /api/company/listings/:id
// PATCH  /api/company/listings/:id/toggle

// Applications
// GET    /api/company/applications
// GET    /api/company/applications/:listingId
// PATCH  /api/company/applications/:appId/status   { status }
// PUT    /api/company/applications/:appId/notes     { adminNotes }

// Stats
// GET    /api/company/stats
export const companyAPI = {
  // Listings
  getListings:   ()          => API.get("/company/listings"),
  createListing: (data)      => API.post("/company/listings",            data),
  updateListing: (id, data)  => API.put(`/company/listings/${id}`,       data),
  deleteListing: (id)        => API.delete(`/company/listings/${id}`),
  toggleListing: (id)        => API.patch(`/company/listings/${id}/toggle`),

  // Applications
  getAllApps:        ()               => API.get("/company/applications"),
  getAppsByListing: (listingId)      => API.get(`/company/applications/${listingId}`),
  updateAppStatus:  (appId, status)  => API.patch(`/company/applications/${appId}/status`, { status }),
  saveNotes:        (appId, adminNotes) => API.put(`/company/applications/${appId}/notes`, { adminNotes }),

  // Stats
  stats: () => API.get("/company/stats"),
};

export default API;