import { createContext, useState, useContext, useEffect } from "react";
import axios from "axios";
import { API_BASE } from "../config/apiBase";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) loadUser();
    else setLoading(false);
  }, [token]);

  const loadUser = async () => {
    try {
      const response = await axios.get(`${API_BASE}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUser(response.data.user);
    } catch (err) {
      setUser(null);
      setToken(null);
      localStorage.removeItem("token");
    } finally {
      setLoading(false);
    }
  };

  const register = async (name, email, password) => {
    const response = await axios.post(`${API_BASE}/auth/register`, { name, email, password });
    const { token: t, user: u } = response.data;
    localStorage.setItem("token", t);
    setToken(t);
    setUser(u);
    return response.data;
  };

  const login = async (email, password) => {
    const response = await axios.post(`${API_BASE}/auth/login`, { email, password });
    const { token: t, user: u } = response.data;
    localStorage.setItem("token", t);
    setToken(t);
    setUser(u);
    return response.data;
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{
      user, token, loading, isAuthenticated: !!token,
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
