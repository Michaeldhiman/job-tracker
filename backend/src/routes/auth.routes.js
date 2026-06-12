import { Router } from "express";
import { register, login, getProfile, updateProfileHandler, deleteAccountHandler, initGoogleAuth, googleAuthCallback } from "../controllers/authController.js";
import auth from "../middleware/auth.js";

const router = Router();

// Public endpoints.
router.post("/register", register);
router.post("/login", login);

// Google OAuth endpoints
router.get("/google", initGoogleAuth);
router.get("/google/callback", googleAuthCallback);

// Protected endpoint that requires a valid JWT.
router.get("/me", auth, getProfile);
router.put("/profile", auth, updateProfileHandler);
router.delete("/account", auth, deleteAccountHandler);

export default router;


