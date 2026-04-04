const rawApiUrl = import.meta.env.VITE_API_URL?.trim();

function normalizeApiBase(url) {
  if (!url) return "http://localhost:5000/api";

  const trimmed = url.replace(/\/+$/, "");
  return trimmed.endsWith("/api") ? trimmed : `${trimmed}/api`;
}

export const API_BASE = normalizeApiBase(rawApiUrl);
