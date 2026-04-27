
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Login          from "./pages/Login";
import Dashboard      from "./pages/Dashboard";        // applicant tracker
import JobBoard       from "./pages/JobBoard";          // public listings
import MyApplications from "./pages/MyApplications";   // applicant: see their apps
import AdminDashboard from "./pages/AdminDashboard";   // company: post + review

// ── Route guards ──────────────────────────────────────────────
function PrivateRoute({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" replace />;
}

function AdminRoute({ children }) {
  const { user } = useAuth();
  if (!user)               return <Navigate to="/login"  replace />;
  if (user.role !== "admin") return <Navigate to="/"     replace />;
  return children;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login"    element={<Login />} />
      <Route path="/jobs"     element={<JobBoard />} />          {/* browsable w/o login */}

      {/* Applicant */}
      <Route path="/"         element={<PrivateRoute><Dashboard /></PrivateRoute>} />
      <Route path="/applied"  element={<PrivateRoute><MyApplications /></PrivateRoute>} />

      {/* Admin / Company */}
      <Route path="/admin"    element={<AdminRoute><AdminDashboard /></AdminRoute>} />

      {/* Fallback */}
      <Route path="*"         element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}