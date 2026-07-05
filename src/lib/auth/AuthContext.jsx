import { createContext, useContext, useState, useEffect } from "react";
import { apiClient } from "../api/client.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("gc_access_token");
    if (!token) {
      setLoading(false);
      return;
    }

    // TODO: replace with real API call -> apiClient.get("/auth/me")
    // For now, mock mode just trusts the stored token + no user refetch
    setLoading(false);

    /*
    apiClient.get("/auth/me")
      .then((res) => setUser(res.data))
      .catch(() => {
        localStorage.removeItem("gc_access_token");
        localStorage.removeItem("gc_refresh_token");
      })
      .finally(() => setLoading(false));
    */
  }, []);

  const login = (userData, accessToken, refreshToken) => {
    localStorage.setItem("gc_access_token", accessToken);
    localStorage.setItem("gc_refresh_token", refreshToken);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem("gc_access_token");
    localStorage.removeItem("gc_refresh_token");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}