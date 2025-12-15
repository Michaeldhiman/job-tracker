// HTTP handlers for authentication-related routes (register, login, current user).
import {
  registerUser,
  loginUser,
  getCurrentUser
} from "../services/authService.js";

// Helper to create a standardized validation error object.
const buildValidationError = (errors) => {
  const error = new Error("Validation failed");
  error.status = 400;
  error.details = errors;
  return error;
};

// POST /api/auth/register
// Validates request body and delegates to `registerUser` service.
export const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    const errors = {};
    if (!name) errors.name = "Name is required";
    if (!email) errors.email = "Email is required";
    if (!password) errors.password = "Password is required";

    // If any field is missing, bail out with a 400 error and per-field messages.
    if (Object.keys(errors).length) {
      throw buildValidationError(errors);
    }

    const result = await registerUser({ name, email, password });
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

// POST /api/auth/login
// Checks email/password and returns user info + JWT on success.
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const errors = {};
    if (!email) errors.email = "Email is required";
    if (!password) errors.password = "Password is required";

    if (Object.keys(errors).length) {
      throw buildValidationError(errors);
    }

    const result = await loginUser({ email, password });
    res.json(result);
  } catch (error) {
    next(error);
  }
};

// GET /api/auth/me
// Uses `req.userId` (set by auth middleware) to fetch the current user.
export const getProfile = async (req, res, next) => {
  try {
    if (!req.userId) {
      const error = new Error("Unauthorized");
      error.status = 401;
      throw error;
    }

    const user = await getCurrentUser(req.userId);
    res.json({ user });
  } catch (error) {
    next(error);
  }
};

