import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Job from "../models/Job.js";
import Resume from "../models/Resume.js";
import { config } from "../config/runtimeConfig.js";

// Shape the user object returned to clients (no password, no internals).
const sanitizeUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  theme: user.theme || 'system',
  emailNotifs: user.emailNotifs ?? true,
  interviewReminders: user.interviewReminders ?? true,
});

// Helper to generate a signed JWT for a given user ID.
const generateToken = (userId) => {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not set");
  }

  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: config.auth.jwtExpiresIn
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

// Update user profile
export const updateProfile = async (userId, payload) => {
  const user = await User.findById(userId);
  if (!user) {
    const error = new Error("User not found");
    error.status = 404;
    throw error;
  }

  if (payload.newPassword) {
    if (!payload.currentPassword) {
      const error = new Error("Current password is required to change password");
      error.status = 400;
      throw error;
    }
    const isMatch = await user.comparePassword(payload.currentPassword);
    if (!isMatch) {
      const error = new Error("Incorrect current password");
      error.status = 400;
      throw error;
    }
    if (payload.newPassword.length < 6) {
      const error = new Error("New password must be at least 6 characters long");
      error.status = 400;
      throw error;
    }
    user.password = payload.newPassword;
  }

  if (payload.name) user.name = payload.name;
  if (payload.email) {
    // check unique
    if (payload.email !== user.email) {
      const exists = await User.findOne({ email: payload.email });
      if (exists) {
        const error = new Error("Email already registered");
        error.status = 400;
        throw error;
      }
    }
    user.email = payload.email;
  }

  if (payload.theme) user.theme = payload.theme;
  if (payload.emailNotifs !== undefined) user.emailNotifs = payload.emailNotifs;
  if (payload.interviewReminders !== undefined) user.interviewReminders = payload.interviewReminders;

  await user.save();
  return sanitizeUser(user);
};

// Delete account and all associated data
export const deleteAccount = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    const error = new Error("User not found");
    error.status = 404;
    throw error;
  }

  await Promise.all([
    Job.deleteMany({ userId }),
    Resume.deleteMany({ userId }),
    User.findByIdAndDelete(userId)
  ]);

  return { success: true };
};

