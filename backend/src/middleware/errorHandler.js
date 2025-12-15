// Centralized Express error-handling middleware.
// Normalizes error responses and hides stack traces in production.
const allowedStatusCodes = [400, 401, 403, 404, 500];

const errorHandler = (err, req, res, next) => {
  // If headers are already sent, delegate to the default Express handler.
  if (res.headersSent) {
    return next(err);
  }

  // Only allow a small set of known status codes, otherwise default to 500.
  const status = allowedStatusCodes.includes(err.status) ? err.status : 500;
  const response = {
    message: err.message || "Server error",
    // Optional structured validation or business-logic errors.
    errors: err.details || {}
  };

  // Log more detail in non-production environments.
  if (process.env.NODE_ENV !== "production" && err.stack) {
    console.error(err.stack);
  } else {
    console.error(err.message);
  }

  res.status(status).json(response);
};

export default errorHandler;


