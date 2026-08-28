/**
 * ─── Global Error Handler ─────────────────────────────────────────────────────
 * Centralised error handling middleware.
 * All thrown errors flow here via next(err) or uncaught throws in async routes.
 */

const { validationResult } = require("express-validator");

// ─── Custom Application Error class ──────────────────────────────────────────
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true; // distinguishes expected vs. programming errors
    Error.captureStackTrace(this, this.constructor);
  }
}

// ─── Mongoose-specific error handlers ────────────────────────────────────────
const handleCastErrorDB = (err) =>
  new AppError(`Invalid ${err.path}: ${err.value}`, 400);

const handleDuplicateFieldsDB = (err) => {
  const field = Object.keys(err.keyValue)[0];
  return new AppError(
    `Duplicate value for field '${field}'. Please use a different value.`,
    409
  );
};

const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map((e) => e.message);
  return new AppError(`Validation failed: ${errors.join(". ")}`, 400);
};

// ─── JWT-specific error handlers ─────────────────────────────────────────────
const handleJWTError     = () => new AppError("Invalid token. Please log in again.", 401);
const handleJWTExpiredError = () => new AppError("Token has expired. Please log in again.", 401);

// ─── CORS error ───────────────────────────────────────────────────────────────
const handleCORSError    = () => new AppError("CORS policy violation. Request blocked.", 403);

// ─── Response formatters ──────────────────────────────────────────────────────
const sendErrorDev = (err, req, res) => {
  return res.status(err.statusCode).json({
    success: false,
    status:  err.statusCode,
    message: err.message,
    stack:   err.stack,
    error:   err,
  });
};

const sendErrorProd = (err, req, res) => {
  if (err.isOperational) {
    // Trusted errors: safe to surface to client
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
  }
  // Programming / unknown errors: don't leak details in production
  console.error("💥 UNHANDLED ERROR:", err);
  return res.status(500).json({
    success: false,
    message: "Something went wrong. Please try again later.",
  });
};

// ─── Global error-handling middleware ─────────────────────────────────────────
const globalErrorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;

  let error = { ...err, message: err.message, name: err.name };

  // Normalise known error types
  if (error.name === "CastError")               error = handleCastErrorDB(error);
  if (error.code === 11000)                      error = handleDuplicateFieldsDB(error);
  if (error.name === "ValidationError")          error = handleValidationErrorDB(error);
  if (error.name === "JsonWebTokenError")        error = handleJWTError();
  if (error.name === "TokenExpiredError")        error = handleJWTExpiredError();
  if (error.message && error.message.startsWith("CORS:")) error = handleCORSError();

  if (process.env.NODE_ENV === "development") {
    return sendErrorDev(error, req, res);
  } else {
    return sendErrorProd(error, req, res);
  }
};

// ─── 404 handler ──────────────────────────────────────────────────────────────
const notFoundHandler = (req, res, next) => {
  console.warn(
    `⚠️  404 Not Found: [${req.method}] ${req.originalUrl} | Origin: ${req.headers.origin || "Direct/No-Origin"} | Host: ${req.headers.host}`
  );
  next(new AppError(`Route not found: ${req.method} ${req.originalUrl}`, 404));
};

// ─── Async wrapper — eliminates try/catch boilerplate ─────────────────────────
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

module.exports = { globalErrorHandler, notFoundHandler, AppError, asyncHandler };
