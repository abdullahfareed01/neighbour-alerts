import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "./context/ThemeContext";
import { LocationProvider } from "./context/LocationContext";

// AuthProvider is mounted once in main.jsx
import Welcome from "./pages/Welcome";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import UserProfile from "./pages/UserProfile";
import ProtectedRoute from "./routes/ProtectedRoute";

// Admin imports
import { AdminAuthProvider } from "./admin/context/AdminAuthContext";
import AdminProtectedRoute from "./admin/routes/AdminProtectedRoute";
import AdminLogin from "./admin/pages/AdminLogin";
import AdminLayout from "./admin/layouts/AdminLayout";
import AdminDashboard from "./admin/pages/AdminDashboard";
import AdminIncidents from "./admin/pages/AdminIncidents";
import AdminIncidentDetail from "./admin/pages/AdminIncidentDetail";
import AdminMap from "./admin/pages/AdminMap";
import AdminUsers from "./admin/pages/AdminUsers";
import AdminUserDetail from "./admin/pages/AdminUserDetail";
import AdminAnalytics from "./admin/pages/AdminAnalytics";
import AdminSettings from "./admin/pages/AdminSettings";

import "./index.css";

export default function App() {
  return (
    <ThemeProvider>
      <LocationProvider>
        <BrowserRouter>
          <AdminAuthProvider>
            <Routes>
              {/* ==================== PUBLIC USER ROUTES ==================== */}

              <Route path="/" element={<Welcome />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* ==================== PROTECTED USER ROUTES ==================== */}

              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <UserProfile />
                  </ProtectedRoute>
                }
              />

              {/* ==================== ADMIN LOGIN ==================== */}

              <Route path="/admin/login" element={<AdminLogin />} />

              {/* ==================== PROTECTED ADMIN ROUTES ==================== */}

              <Route
                path="/admin"
                element={
                  <AdminProtectedRoute>
                    <AdminLayout />
                  </AdminProtectedRoute>
                }
              >
                {/* /admin → /admin/dashboard */}
                <Route
                  index
                  element={<Navigate to="/admin/dashboard" replace />}
                />

                <Route path="dashboard" element={<AdminDashboard />} />

                <Route path="incidents" element={<AdminIncidents />} />

                <Route path="incidents/:id" element={<AdminIncidentDetail />} />

                <Route path="map" element={<AdminMap />} />

                <Route path="users" element={<AdminUsers />} />

                <Route path="users/:id" element={<AdminUserDetail />} />

                <Route path="analytics" element={<AdminAnalytics />} />

                <Route path="settings" element={<AdminSettings />} />
              </Route>

              {/* ==================== FALLBACK ==================== */}

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </AdminAuthProvider>
        </BrowserRouter>
      </LocationProvider>
    </ThemeProvider>
  );
}
