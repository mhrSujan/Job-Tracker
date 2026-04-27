
import axios from "axios";

// ── Base instance ─────────────────────────────────────────────
const API = axios.create({ baseURL: "http://localhost:5000/api" });

// Attach token from localStorage to every request
API.interceptors.request.use((req) => {
  const token = localStorage.getItem("token");
  if (token) req.headers.authorization = `Bearer ${token}`;
  return req;
});

// If the server returns 401 anywhere, force a logout
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

// ── Auth ──────────────────────────────────────────────────────
export const authAPI = {
  register: (data)    => API.post("/auth/register", data),
  login:    (data)    => API.post("/auth/login",    data),
  me:       ()        => API.get("/auth/me"),
  updateMe: (data)    => API.put("/auth/me",        data),
};

// ── Personal Job Tracker (applicants) ─────────────────────────
export const jobsAPI = {
  list:   ()          => API.get("/jobs"),
  add:    (data)      => API.post("/jobs",      data),
  update: (id, data)  => API.put(`/jobs/${id}`, data),
  remove: (id)        => API.delete(`/jobs/${id}`),
};

// ── Public Job Board ──────────────────────────────────────────
export const listingsAPI = {
  list:    (params)   => API.get("/listings",      { params }),
  getById: (id)       => API.get(`/listings/${id}`),
};

// ── Applications (applicants) ─────────────────────────────────
export const applyAPI = {
  submit:   (listingId, data) => API.post(`/apply/${listingId}`, data),
  myApps:   ()                => API.get("/apply/mine"),
  withdraw: (appId)           => API.delete(`/apply/${appId}`),
};

// ── Company / Admin ───────────────────────────────────────────
export const companyAPI = {
  // Listings
  getListings:      ()          => API.get("/company/listings"),
  createListing:    (data)      => API.post("/company/listings",          data),
  updateListing:    (id, data)  => API.put(`/company/listings/${id}`,     data),
  deleteListing:    (id)        => API.delete(`/company/listings/${id}`),
  toggleListing:    (id)        => API.patch(`/company/listings/${id}/toggle`),

  // Applications
  getAllApps:        ()          => API.get("/company/applications"),
  getAppsByListing: (listingId) => API.get(`/company/applications/${listingId}`),
  updateAppStatus:  (appId, status) =>
    API.patch(`/company/applications/${appId}/status`, { status }),
  saveNotes:        (appId, adminNotes) =>
    API.put(`/company/applications/${appId}/notes`, { adminNotes }),

  // Analytics
  stats:            ()          => API.get("/company/stats"),
};

export default API;