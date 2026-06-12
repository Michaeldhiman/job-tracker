// Notification preference routes — all require authentication.
import { Router } from "express";
import auth from "../middleware/auth.js";
import {
  getNotificationPreferences,
  updateNotificationPreferences,
} from "../controllers/notificationController.js";

const router = Router();

// All notification routes require a valid JWT.
router.use(auth);

// GET  /api/notifications/preferences — fetch current preferences
router.get("/preferences", getNotificationPreferences);

// PUT  /api/notifications/preferences — update preferences
router.put("/preferences", updateNotificationPreferences);

export default router;
