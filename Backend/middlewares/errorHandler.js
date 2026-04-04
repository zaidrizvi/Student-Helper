const errorHandler = (err, req, res, next) => {
  const statusCode =
    err.statusCode ||
    (err.code === "LIMIT_FILE_SIZE" ? 400 : null) ||
    (err.name === "ValidationError" ? 400 : 500);

  const message =
    err.code === "LIMIT_FILE_SIZE"
      ? "Uploaded file is too large"
      :
    statusCode === 500 ? "Internal Server Error" : err.message || "Request failed";

  if (statusCode >= 500) {
    console.error("Unhandled error", {
      requestId: req?.requestId,
      message: err.message,
      stack: err.stack,
    });
  }

  res.status(statusCode).json({
    success: false,
    error: message,
    ...(err.details ? { details: err.details } : {}),
    ...(process.env.NODE_ENV === "development" && statusCode >= 500
      ? { stack: err.stack }
      : {}),
  });
};

module.exports = errorHandler;
