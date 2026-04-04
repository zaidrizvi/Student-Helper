const crypto = require("crypto");
const jwt = require("jsonwebtoken");

const AUTH_COOKIE_NAME = "studybot_session";
const JWT_EXPIRY = process.env.JWT_EXPIRES_IN || "7d";

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function createAuthToken(user) {
  return jwt.sign(
    {
      userId: String(user._id),
      email: user.email,
      tokenVersion: user.tokenVersion || 0,
    },
    process.env.JWT_SECRET,
    { expiresIn: JWT_EXPIRY }
  );
}

function getCookieOptions() {
  const isProduction = process.env.NODE_ENV === "production";

  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "None" : "Lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  };
}

function serializeCookie(name, value, options = {}) {
  const parts = [`${name}=${encodeURIComponent(value)}`];

  if (options.maxAge) parts.push(`Max-Age=${Math.floor(options.maxAge / 1000)}`);
  if (options.httpOnly) parts.push("HttpOnly");
  if (options.secure) parts.push("Secure");
  if (options.sameSite) parts.push(`SameSite=${options.sameSite}`);
  if (options.path) parts.push(`Path=${options.path}`);

  return parts.join("; ");
}

function setAuthCookie(res, token) {
  res.setHeader(
    "Set-Cookie",
    serializeCookie(AUTH_COOKIE_NAME, token, getCookieOptions())
  );
}

function clearAuthCookie(res) {
  res.setHeader(
    "Set-Cookie",
    serializeCookie(AUTH_COOKIE_NAME, "", {
      ...getCookieOptions(),
      maxAge: 0,
    })
  );
}

function parseCookies(cookieHeader = "") {
  return cookieHeader.split(";").reduce((acc, part) => {
    const [rawName, ...rawValue] = part.trim().split("=");
    if (!rawName) return acc;

    acc[rawName] = decodeURIComponent(rawValue.join("=") || "");
    return acc;
  }, {});
}

function getAuthTokenFromRequest(req) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.slice(7).trim();
  }

  const cookies = parseCookies(req.headers.cookie);
  return cookies[AUTH_COOKIE_NAME] || null;
}

function hashShareToken(token) {
  return crypto.createHash("sha256").update(String(token)).digest("hex");
}

module.exports = {
  AUTH_COOKIE_NAME,
  clearAuthCookie,
  createAuthToken,
  getAuthTokenFromRequest,
  hashShareToken,
  normalizeEmail,
  setAuthCookie,
};
