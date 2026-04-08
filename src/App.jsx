import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider }   from "./context/ThemeContext";
import { LocationProvider } from "./context/LocationContext";
import { AuthProvider } from "./context/AuthContext"; // Add this

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
        <AuthProvider> {/* Add this wrapper */}
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
        </AuthProvider> {/* Close the wrapper */}
      </LocationProvider>
    </ThemeProvider>
  );
}