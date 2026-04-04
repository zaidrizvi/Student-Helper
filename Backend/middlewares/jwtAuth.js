const jwt = require("jsonwebtoken");
const User = require("../models/User");
const HttpError = require("../utils/httpError");
const { clearAuthCookie, getAuthTokenFromRequest } = require("../utils/auth");

const jwtAuth = async (req, res, next) => {
  try {
    const token = getAuthTokenFromRequest(req);

    if (!token) {
      throw new HttpError(401, "Unauthorized");
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select("email tokenVersion");

    if (!user || (decoded.tokenVersion || 0) !== (user.tokenVersion || 0)) {
      clearAuthCookie(res);
      throw new HttpError(401, "Unauthorized");
    }

    req.auth = {
      userId: decoded.userId,
      email: decoded.email,
    };

    next();
  } catch (err) {
    if (err.name === "TokenExpiredError" || err.name === "JsonWebTokenError") {
      clearAuthCookie(res);
      return next(new HttpError(401, "Unauthorized"));
    }

    return next(err);
  }
};

module.exports = jwtAuth;
