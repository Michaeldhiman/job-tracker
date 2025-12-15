// Business logic for authentication and user retrieval.
import jwt from "jsonwebtoken";
import User from "../models/User.js";

// Shape the user object returned to clients (no password, no internals).
const sanitizeUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role
});

// Helper to generate a signed JWT for a given user ID.
const generateToken = (userId) => {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not set");
  }

  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d"
  });
};

// Create a new user, ensuring the email is unique, then return token + user info.
export const registerUser = async (payload) => {
  const existingUser = await User.findOne({ email: payload.email });
  if (existingUser) {
    const error = new Error("Email already registered");
    error.status = 400;
    throw error;
  }

  const user = await User.create(payload);
  const token = generateToken(user._id);

  return { user: sanitizeUser(user), token };
};

// Validate credentials and return token + user info if valid.
export const loginUser = async ({ email, password }) => {
  const user = await User.findOne({ email });
  if (!user) {
    const error = new Error("Invalid credentials");
    error.status = 401;
    throw error;
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    const error = new Error("Invalid credentials");
    error.status = 401;
    throw error;
  }

  const token = generateToken(user._id);

  return { user: sanitizeUser(user), token };
};

// Fetch the current user document by its ID, excluding the password field.
export const getCurrentUser = async (userId) => {
  const user = await User.findById(userId).select("-password");
  if (!user) {
    const error = new Error("User not found");
    error.status = 404;
    throw error;
  }

  return user;
};

