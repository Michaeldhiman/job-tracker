import { Router } from "express";
import { 
  initOAuth, oauthCallback, getEvents, 
  createEvent, updateEvent, deleteEvent, 
  syncCalendar, getConnectionStatus, disconnectCalendar 
} from "../controllers/calendarController.js";
import auth from "../middleware/auth.js";

const router = Router();

// OAuth initiation callback (Google redirects the user here, no auth header can be sent)
router.get("/auth/callback", oauthCallback);

// Protected routes (require standard auth middleware)
router.get("/auth/init", auth, initOAuth);
router.get("/status", auth, getConnectionStatus);
router.post("/sync", auth, syncCalendar);
router.post("/disconnect", auth, disconnectCalendar);

router.route("/events")
  .get(auth, getEvents)
  .post(auth, createEvent);

router.route("/events/:id")
  .put(auth, updateEvent)
  .delete(auth, deleteEvent);

export default router;
