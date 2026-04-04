const HttpError = require("../utils/httpError");

function createMemoryRateLimiter({
  windowMs,
  max,
  keyGenerator = (req) => req.ip || req.headers["x-forwarded-for"] || "unknown",
  message = "Too many requests. Please try again later.",
}) {
  const entries = new Map();

  return (req, res, next) => {
    const now = Date.now();
    const key = keyGenerator(req);

    if (entries.size > 5000) {
      for (const [entryKey, entryValue] of entries.entries()) {
        if (entryValue.resetAt <= now) {
          entries.delete(entryKey);
        }
      }
    }

    const existing = entries.get(key);

    if (!existing || existing.resetAt <= now) {
      entries.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }

    existing.count += 1;
    entries.set(key, existing);

    res.setHeader("Retry-After", Math.ceil((existing.resetAt - now) / 1000));

    if (existing.count > max) {
      return next(new HttpError(429, message));
    }

    return next();
  };
}

module.exports = {
  createMemoryRateLimiter,
};
