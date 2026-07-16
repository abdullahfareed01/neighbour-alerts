/**
 * context/AuthContext.jsx
 *
 * SINGLE SOURCE OF TRUTH for auth state.
 *
 * Previously there were two competing auth mechanisms: this context (just
 * an isLoggedIn boolean) and services/api.js's authHelpers (token + user
 * object). Login.jsx only updated this context, never authHelpers, so
 * Dashboard/Sidebar/UserProfile — which read authHelpers.getUser() directly
 * — never actually saw the logged-in user. This context now owns both the
 * token and the user object; authHelpers is just the localStorage
 * persistence layer underneath it. Components should always go through
 * useAuth(), never touch authHelpers directly.
 */
import { createContext, useContext, useState, useEffect } from "react";
import { authHelpers } from "../services/api";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Restore session from localStorage on app load
    const storedUser = authHelpers.getUser();
    const storedToken = authHelpers.getToken();
    if (storedUser && storedToken) {
      setUser(storedUser);
      setToken(storedToken);
    }
    setLoading(false);
  }, []);

  // Called after a successful authAPI.login()/register() response
  const login = (userData, authToken) => {
    authHelpers.login(authToken, userData);
    setUser(userData);
    setToken(authToken);
  };

  const logout = () => {
    authHelpers.logout();
    setUser(null);
    setToken(null);
  };

  const isAuthenticated = !!user && !!token;

  return (
    <AuthContext.Provider
      value={{ user, token, isAuthenticated, loading, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};