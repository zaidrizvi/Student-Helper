import { createContext, useContext, useEffect, useState } from "react";
import axios from "axios";
import { API_BASE } from "../config/apiBase";
import { normalizeApiError } from "../utils/apiError";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const response = await axios.get(`${API_BASE}/auth/me`, {
        withCredentials: true,
      });
      setUser(response.data.user);
    } catch (err) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const register = async (name, email, password) => {
    try {
      const response = await axios.post(
        `${API_BASE}/auth/register`,
        { name, email, password },
        { withCredentials: true }
      );
      setUser(response.data.user);
      return response.data;
    } catch (err) {
      throw normalizeApiError(err, "Registration failed. Please try again.");
    }
  };

  const login = async (email, password) => {
    try {
      const response = await axios.post(
        `${API_BASE}/auth/login`,
        { email, password },
        { withCredentials: true }
      );
      setUser(response.data.user);
      return response.data;
    } catch (err) {
      throw normalizeApiError(err, "Login failed. Please check your credentials.");
    }
  };

  const logout = async () => {
    try {
      await axios.post(`${API_BASE}/auth/logout`, {}, { withCredentials: true });
    } catch (err) {
      // Clear local session state even if the server call fails.
    } finally {
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{
      user, loading, isAuthenticated: !!user,
      refreshUser: loadUser,
      register, login, logout
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
