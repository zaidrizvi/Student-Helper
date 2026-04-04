const express = require("express");
const router = express.Router();

const { register, login, getMe, logout } = require("../controllers/authController");
const jwtAuth = require("../middlewares/jwtAuth");
const validateRequest = require("../middlewares/validateRequest");
const { createMemoryRateLimiter } = require("../middlewares/rateLimit");
const { validateLogin, validateRegister } = require("../validators/authValidators");

const authRateLimit = createMemoryRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 12,
  keyGenerator: (req) => `${req.ip}:${req.path}:${req.body?.email || "anon"}`,
  message: "Too many authentication attempts. Please try again later.",
});

router.post("/register", authRateLimit, validateRequest(validateRegister), register);
router.post("/login", authRateLimit, validateRequest(validateLogin), login);
router.post("/logout", logout);
router.get("/me", jwtAuth, getMe);

module.exports = router;
