const HttpError = require("../utils/httpError");

function validateRequest(validator) {
  return (req, res, next) => {
    try {
      const validated = validator(req);
      if (validated && typeof validated === "object") {
        req.validated = validated;
      }
      next();
    } catch (err) {
      if (err instanceof HttpError) {
        return next(err);
      }

      next(new HttpError(400, err.message || "Invalid request"));
    }
  };
}

module.exports = validateRequest;
