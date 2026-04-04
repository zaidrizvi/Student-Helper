import { useState } from "react";
import axios from "axios";
import { useAuth } from "../contexts/AuthContext";
import { API_BASE } from "../config/apiBase";
import { normalizeApiError } from "../utils/apiError";

export const useApi = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { isAuthenticated, loading: authLoading } = useAuth();

  const apiCall = async (method, endpoint, data = null, config = {}) => {
    setLoading(true);
    setError(null);

    // Extract custom options (like skipAuth) from config
    const { skipAuth = false, ...axiosConfig } = config;

    try {
      // FIX: Only throw error if auth is REQUIRED and user is NOT logged in
      if (!skipAuth && !isAuthenticated && !authLoading) {
        throw new Error("Please sign in to use this feature");
      }

      const headers = {
        ...(axiosConfig.headers || {})
      };

      if (data instanceof FormData) {
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
        withCredentials: true,
        ...axiosConfig 
      });

      return response.data;

    } catch (err) {
      const normalizedError = normalizeApiError(err);
      setError(normalizedError.message);
      throw normalizedError;
    } finally {
      setLoading(false);
    }
  };

  return { loading, error, apiCall, setError };
};
