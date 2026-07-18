/**
 * admin/context/AdminAuthContext.jsx
 *
 * SINGLE SOURCE OF TRUTH for admin auth state — mirrors the pattern used
 * by context/AuthContext.jsx (token + admin object in state, restored from
 * localStorage on mount) but is fully isolated from it:
 *   - separate context
 *   - separate localStorage keys (see admin/services/adminApi.js)
 *   - separate mock API module
 *
 * This means a logged-in regular user and a logged-in admin session can
 * coexist in the same browser without interfering with each other, and
 * nothing here touches the real AuthContext.
 *
 * Frontend-only mock for now — see adminApi.js for details. Admin route
 * protection here is a UX convenience, NOT security. Real authorization
 * must happen server-side once a backend exists (CLAUDE.md §8).
 */
import { createContext, useContext, useState, useEffect } from "react";
import { adminAuthAPI, adminAuthHelpers } from "../services/adminApi";

const AdminAuthContext = createContext();

export const AdminAuthProvider = ({ children }) => {
  const [admin, setAdmin] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Restore admin session from localStorage on app load
    const storedAdmin = adminAuthHelpers.getAdmin();
    const storedToken = adminAuthHelpers.getToken();
    if (storedAdmin && storedToken) {
      setAdmin(storedAdmin);
      setToken(storedToken);
    }
    setLoading(false);
  }, []);

  // Called after a successful adminAuthAPI.login() response
  const login = (adminData, authToken) => {
    adminAuthHelpers.login(authToken, adminData);
    setAdmin(adminData);
    setToken(authToken);
  };

  const logout = () => {
    adminAuthHelpers.logout();
    setAdmin(null);
    setToken(null);
  };

  const isAuthenticated = !!admin && !!token;

  return (
    <AdminAuthContext.Provider
      value={{
        admin,
        token,
        isAuthenticated,
        loading,
        login,
        logout,
        adminAuthAPI,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
};

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error("useAdminAuth must be used within AdminAuthProvider");
  }
  return context;
};
