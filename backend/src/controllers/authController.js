// HTTP handlers for authentication-related routes (register, login, current user).
import {
  registerUser,
  loginUser,
  getCurrentUser,
  updateProfile,
  deleteAccount
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

export const updateProfileHandler = async (req, res, next) => {
  try {
    const user = await updateProfile(req.userId, req.body);
    res.json({ success: true, user });
  } catch (error) {
    next(error);
  }
};

import jwt from "jsonwebtoken";
import axios from "axios";
import crypto from "crypto";
import User from "../models/User.js";
import { config, requireConfig } from "../config/runtimeConfig.js";

export const deleteAccountHandler = async (req, res, next) => {
  try {
    await deleteAccount(req.userId);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};

// GET /api/auth/google
// Redirects user to Google OAuth consent screen for login/registration.
export const initGoogleAuth = async (req, res, next) => {
  try {
    const clientId = requireConfig(process.env.GOOGLE_CLIENT_ID, "GOOGLE_CLIENT_ID");
    const redirectUri = requireConfig(process.env.GOOGLE_LOGIN_REDIRECT_URI, "GOOGLE_LOGIN_REDIRECT_URI");
    
    const scope = "openid email profile";
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${clientId}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `response_type=code&` +
      `scope=${encodeURIComponent(scope)}&` +
      `prompt=select_account`;

    res.redirect(authUrl);
  } catch (error) {
    next(error);
  }
};

// GET /api/auth/google/callback
// Handles callback from Google, authenticates/creates user, and redirects to frontend with credentials.
export const googleAuthCallback = async (req, res, next) => {
  try {
    const { code } = req.query;
    if (!code) {
      return res.status(400).json({ success: false, message: "Code required" });
    }

    const clientId = requireConfig(process.env.GOOGLE_CLIENT_ID, "GOOGLE_CLIENT_ID");
    const clientSecret = requireConfig(process.env.GOOGLE_CLIENT_SECRET, "GOOGLE_CLIENT_SECRET");
    const redirectUri = requireConfig(process.env.GOOGLE_LOGIN_REDIRECT_URI, "GOOGLE_LOGIN_REDIRECT_URI");

    const tokenResponse = await axios.post("https://oauth2.googleapis.com/token", {
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    });

    const accessToken = tokenResponse.data.access_token;

    const profileResponse = await axios.get("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const { email, name } = profileResponse.data;
    if (!email) {
      throw new Error("Failed to retrieve email from Google profile");
    }

    let user = await User.findOne({ email });
    if (!user) {
      // Create user with a secure random password
      const randomPassword = crypto.randomBytes(24).toString("hex");
      user = await User.create({
        name: name || email.split("@")[0],
        email,
        password: randomPassword
      });
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: config.auth.jwtExpiresIn
    });

    const frontendUrl = requireConfig(config.frontendUrl, "FRONTEND_URL");
    const sanitizeUser = (u) => ({
      id: u._id,
      name: u.name,
      email: u.email,
      role: u.role,
      theme: u.theme || 'system',
      emailNotifs: u.emailNotifs ?? true,
      interviewReminders: u.interviewReminders ?? true,
    });

    const userParam = encodeURIComponent(JSON.stringify(sanitizeUser(user)));
    res.redirect(`${frontendUrl}/login?token=${token}&user=${userParam}`);
  } catch (error) {
    next(error);
  }
};

