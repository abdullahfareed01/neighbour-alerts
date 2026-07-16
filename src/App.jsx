import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider }   from "./context/ThemeContext";
import { LocationProvider } from "./context/LocationContext";
// AuthProvider is mounted once in main.jsx (outermost) — it used to be
// mounted a second time here, which meant two separate AuthContext
// instances existed with the inner one silently shadowing the outer one.

import Login        from "./pages/Login";
import Register     from "./pages/Register";
import Dashboard    from "./pages/Dashboard";
import UserProfile  from "./pages/UserProfile";
import ProtectedRoute from "./routes/ProtectedRoute";
import "./index.css"

export default function App() {
  return (
    <ThemeProvider>
      <LocationProvider>
        <BrowserRouter>
          <Routes>
            {/* Public */}
            <Route path="/"         element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Protected */}
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

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </LocationProvider>
    </ThemeProvider>
  );
}