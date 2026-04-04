import { useState } from "react";
import axios from "axios";
import { useAuth } from "../contexts/AuthContext";
import { API_BASE } from "../config/apiBase";

export const useApi = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { token, isAuthenticated } = useAuth();

  const apiCall = async (method, endpoint, data = null, config = {}) => {
    setLoading(true);
    setError(null);

    // Extract custom options (like skipAuth) from config
    const { skipAuth = false, ...axiosConfig } = config;

    try {
      // FIX: Only throw error if auth is REQUIRED and user is NOT logged in
      if (!skipAuth && !isAuthenticated) {
        throw new Error("Please sign in to use this feature");
      }

      const headers = {
        ...(axiosConfig.headers || {})
      };

      // Add Token if it exists (even for public routes, it doesn't hurt)
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      // Handle Content-Type automatically
      if (data instanceof FormData) {
        // Let browser set boundary for FormData
        if (headers["Content-Type"]) delete headers["Content-Type"];
      } else {
        headers["Content-Type"] = "application/json";
      }

      const url = `${API_BASE}/${endpoint.replace(/^\//, "")}`;
      
      // Pass the cleaned axiosConfig (without skipAuth) to axios
      const response = await axios({ 
        method, 
        url, 
        data, 
        headers, 
        ...axiosConfig 
      });

      return response.data;

    } catch (err) {
      const errorMsg = err.response?.data?.error || err.message;
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return { loading, error, apiCall, setError };
};
