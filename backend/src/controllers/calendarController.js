import jwt from "jsonwebtoken";
import { z } from "zod";
import User from "../models/User.js";
import GoogleToken from "../models/GoogleToken.js";
import Event from "../models/Event.js";
import { 
  getAuthUrl, exchangeCode, getGoogleUserInfo, 
  createGoogleEvent, updateGoogleEvent, deleteGoogleEvent, 
  syncEvents 
} from "../services/googleCalendarService.js";
import { config, requireConfig } from "../config/runtimeConfig.js";
import { check24HourReminders, check1HourReminders } from "../services/schedulerService.js";

// Input validation schema for Custom Events
export const eventSchemaZod = z.object({
  jobId: z.string().optional().nullable(),
  title: z.string().min(1, "Title is required"),
  description: z.string().optional().nullable(),
  date: z.string().or(z.date()),
  startTime: z.string().regex(/^([0-9]|0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid start time format (HH:MM)"),
  endTime: z.string().regex(/^([0-9]|0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid end time format (HH:MM)"),
  company: z.string().optional().nullable(),
  interviewRound: z.string().optional().nullable(),
});

/**
 * GET /api/calendar/auth/init
 * Generates Google Consent screen URL and returns it
 */
export const initOAuth = async (req, res, next) => {
  try {
    // Generate a secure state payload containing the authenticated user's ID
    const stateToken = jwt.sign(
      { userId: req.userId },
      process.env.JWT_SECRET,
      { expiresIn: config.auth.googleStateExpiresIn }
    );
    
    const url = getAuthUrl(stateToken);
    res.json({ url });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/calendar/auth/callback
 * Handles Google OAuth redirect callback, exchanges code for tokens, and syncs calendar
 */
export const oauthCallback = async (req, res, next) => {
  const { code, state } = req.query;
  const frontendUrl = requireConfig(config.frontendUrl, "FRONTEND_URL");

  if (!code || !state) {
    return res.redirect(`${frontendUrl}/calendar?status=error&message=missing_auth_code`);
  }

  try {
    // Verify state token
    const decoded = jwt.verify(state, process.env.JWT_SECRET);
    const userId = decoded.userId;

    // Exchange code for tokens
    const tokens = await exchangeCode(code);
    
    // Fetch google user profile to get their email address
    const googleUser = await getGoogleUserInfo(tokens.accessToken);

    // Save tokens in the database.
    // Google only returns a refresh_token on the very first authorization.
    // On subsequent reconnects we preserve the existing refresh token by
    // only including it in the $set when a new one was actually returned.
    const tokenUpdate = {
      accessToken: tokens.accessToken,
      tokenExpiry: new Date(Date.now() + tokens.expiresIn * 1000),
    };
    if (tokens.refreshToken) {
      tokenUpdate.refreshToken = tokens.refreshToken;
    }

    await GoogleToken.findOneAndUpdate(
      { userId },
      { $set: tokenUpdate },
      { upsert: true, new: true }
    );

    // Update user profile status
    await User.findByIdAndUpdate(userId, {
      googleCalendarConnected: true,
      googleCalendarEmail: googleUser.email,
      calendarConnectionDate: new Date(),
    });

    // Run initial synchronization
    await syncEvents(userId);

    // Redirect to the frontend calendar page
    res.redirect(`${frontendUrl}/calendar?status=success`);
  } catch (error) {
    console.error("Google Calendar Callback Error:", error.message);
    res.redirect(`${frontendUrl}/calendar?status=error&message=auth_failed`);
  }
};

/**
 * GET /api/calendar/events
 * Retrieves custom events created in the database for the user
 */
export const getEvents = async (req, res, next) => {
  try {
    const events = await Event.find({ userId: req.userId }).sort({ date: -1 });
    res.json({ success: true, events });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/calendar/events
 * Creates a new event locally and pushes it to Google Calendar
 */
export const createEvent = async (req, res, next) => {
  try {
    // Parse body using Zod schema
    const data = eventSchemaZod.parse(req.body);
    
    const event = new Event({
      userId: req.userId,
      ...data,
      syncStatus: "pending",
    });

    const user = await User.findById(req.userId);
    if (user && user.googleCalendarConnected) {
      try {
        const googleEventId = await createGoogleEvent(req.userId, event);
        event.googleEventId = googleEventId;
        event.syncStatus = "synced";
      } catch (err) {
        console.error("Failed to sync new event to Google Calendar", err.message);
        event.syncStatus = "failed";
      }
    }

    await event.save();

    // Trigger non-blocking real-time reminder checks in case the event starts within the target windows
    check24HourReminders().catch(err => console.error("Error in real-time 24h reminder check:", err));
    check1HourReminders().catch(err => console.error("Error in real-time 1h reminder check:", err));

    res.status(201).json({ success: true, event });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/calendar/events/:id
 * Updates an event locally and syncs modifications to Google Calendar
 */
export const updateEvent = async (req, res, next) => {
  try {
    const data = eventSchemaZod.parse(req.body);
    const event = await Event.findOne({ _id: req.params.id, userId: req.userId });

    if (!event) {
      return res.status(404).json({ success: false, message: "Event not found" });
    }

    // Detect whether the interview time changed before overwriting fields
    const dateChanged      = data.date      && String(data.date)      !== String(event.date);
    const startTimeChanged = data.startTime && data.startTime         !== event.startTime;

    Object.assign(event, data);
    event.syncStatus = "pending";

    // If the interview was rescheduled, reset reminder flags so fresh emails fire
    if (dateChanged || startTimeChanged) {
      event.reminder24hSent = false;
      event.reminder1hSent  = false;
    }

    const user = await User.findById(req.userId);
    if (user && user.googleCalendarConnected) {
      try {
        if (event.googleEventId) {
          await updateGoogleEvent(req.userId, event.googleEventId, event);
        } else {
          const googleEventId = await createGoogleEvent(req.userId, event);
          event.googleEventId = googleEventId;
        }
        event.syncStatus = "synced";
      } catch (err) {
        console.error("Failed to sync event update to Google Calendar", err.message);
        event.syncStatus = "failed";
      }
    }

    await event.save();

    // Trigger non-blocking real-time reminder checks in case the rescheduled/updated event starts within target windows
    check24HourReminders().catch(err => console.error("Error in real-time 24h reminder check:", err));
    check1HourReminders().catch(err => console.error("Error in real-time 1h reminder check:", err));

    res.json({ success: true, event });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/calendar/events/:id
 * Deletes an event locally and deletes the matching event from Google Calendar
 */
export const deleteEvent = async (req, res, next) => {
  try {
    const event = await Event.findOne({ _id: req.params.id, userId: req.userId });

    if (!event) {
      return res.status(404).json({ success: false, message: "Event not found" });
    }

    const user = await User.findById(req.userId);
    if (user && user.googleCalendarConnected && event.googleEventId) {
      try {
        await deleteGoogleEvent(req.userId, event.googleEventId);
      } catch (err) {
        console.error("Failed to delete event from Google Calendar", err.message);
      }
    }

    await Event.deleteOne({ _id: req.params.id });
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/calendar/sync
 * Manually triggers two-way event synchronization
 */
export const syncCalendar = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);
    if (!user || !user.googleCalendarConnected) {
      return res.status(400).json({ success: false, message: "Google Calendar is not connected." });
    }

    await syncEvents(req.userId);
    res.json({ success: true, message: "Calendar synchronized successfully." });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/calendar/status
 * Fetches the user's connection status and connection date details
 */
export const getConnectionStatus = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId).select(
      "googleCalendarConnected googleCalendarEmail calendarConnectionDate"
    );
    res.json({ success: true, connection: user });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/calendar/disconnect
 * Disconnects the user's Google Calendar account and deletes token records
 */
export const disconnectCalendar = async (req, res, next) => {
  try {
    await User.findByIdAndUpdate(req.userId, {
      googleCalendarConnected: false,
      googleCalendarEmail: null,
      calendarConnectionDate: null
    });

    await GoogleToken.deleteOne({ userId: req.userId });

    res.json({ success: true, message: "Google Calendar disconnected successfully." });
  } catch (error) {
    next(error);
  }
};
