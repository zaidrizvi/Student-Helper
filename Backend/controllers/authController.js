const User = require("../models/User");
const HttpError = require("../utils/httpError");
const {
  clearAuthCookie,
  createAuthToken,
  normalizeEmail,
  setAuthCookie,
} = require("../utils/auth");

exports.register = async (req, res, next) => {
  try {
    const { name, email, password } = req.validated?.body || req.body;

    const existingUser = await User.findOne({ email: normalizeEmail(email) });
    if (existingUser) {
      throw new HttpError(409, "User already exists with this email");
    }

    const user = await User.create({
      name,
      email: normalizeEmail(email),
      password,
    });

    const token = createAuthToken(user);
    setAuthCookie(res, token);

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (err) {
    next(err);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.validated?.body || req.body;
    const normalizedEmail = normalizeEmail(email);

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      throw new HttpError(401, "Invalid email or password");
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      throw new HttpError(401, "Invalid email or password");
    }

    const token = createAuthToken(user);
    setAuthCookie(res, token);

    res.json({
      success: true,
      message: "Login successful",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (err) {
    next(err);
  }
};

exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.auth.userId).select("-password");

    if (!user) {
      clearAuthCookie(res);
      throw new HttpError(404, "User not found");
    }

    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (err) {
    next(err);
  }
};

exports.logout = async (req, res, next) => {
  try {
    clearAuthCookie(res);
    res.json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (err) {
    next(err);
  }
};
