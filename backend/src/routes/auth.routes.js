// Auth routes: registration, login, and "current user" endpoint.
import { Router } from "express";
import { register, login, getProfile } from "../controllers/authController.js";
import auth from "../middleware/auth.js";

const router = Router();

// Public endpoints.
router.post("/register", register);
router.post("/login", login);

// Protected endpoint that requires a valid JWT.
router.get("/me", auth, getProfile);

export default router;


