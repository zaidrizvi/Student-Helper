const HttpError = require("../utils/httpError");
const { normalizeEmail } = require("../utils/auth");

function validateName(name) {
  const value = String(name || "").trim();
  if (!value || value.length < 2 || value.length > 80) {
    throw new HttpError(400, "Name must be between 2 and 80 characters");
  }
  return value;
}

function validateEmail(email) {
  const value = normalizeEmail(email);
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!value || !emailPattern.test(value) || value.length > 254) {
    throw new HttpError(400, "Please provide a valid email address");
  }

  return value;
}

function validatePassword(password) {
  const value = String(password || "");
  if (value.length < 8 || value.length > 128) {
    throw new HttpError(400, "Password must be between 8 and 128 characters");
  }

  return value;
}

function validateRegister(req) {
  return {
    body: {
      name: validateName(req.body?.name),
      email: validateEmail(req.body?.email),
      password: validatePassword(req.body?.password),
    },
  };
}

function validateLogin(req) {
  return {
    body: {
      email: validateEmail(req.body?.email),
      password: String(req.body?.password || ""),
    },
  };
}

module.exports = {
  validateLogin,
  validateRegister,
};
