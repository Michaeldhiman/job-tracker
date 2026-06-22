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
  eventType: z.string().optional().nullable(),
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

  const settingsIntegrationsUrl = `${frontendUrl}/settings?tab=integrations`;

  if (!code || !state) {
    return res.redirect(`${settingsIntegrationsUrl}&status=error&message=missing_auth_code`);
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

    res.redirect(`${settingsIntegrationsUrl}&status=success`);
  } catch (error) {
    console.error("Google Calendar Callback Error:", error.message);
    res.redirect(`${settingsIntegrationsUrl}&status=error&message=auth_failed`);
  }
};

/**
 * GET /api/calendar/events
 * Retrieves custom events created in the database for the user
 */
export const getEvents = async (req, res, next) => {
  try {
    const events = await Event.find({ userId: req.userId }).populate("jobId").sort({ date: -1 });
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
    if (user?.googleCalendarConnected && user.calendarAutoCreate !== false) {
      try {
        const googleEventId = await createGoogleEvent(req.userId, event, user);
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
    if (user?.googleCalendarConnected) {
      try {
        if (event.googleEventId && user.calendarSyncUpdates !== false) {
          await updateGoogleEvent(req.userId, event.googleEventId, event, user);
          event.syncStatus = "synced";
        } else if (!event.googleEventId && user.calendarAutoCreate !== false) {
          const googleEventId = await createGoogleEvent(req.userId, event, user);
          event.googleEventId = googleEventId;
          event.syncStatus = "synced";
        }
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
 *
 * CRITICAL FIX (P0): The old code returned early after clearing the job date field,
 * never deleting the Event document. This caused phantom re-appearing events on reload.
 * Now we always delete the Event after clearing the job field.
 */
export const deleteEvent = async (req, res, next) => {
  try {
    const event = await Event.findOne({ _id: req.params.id, userId: req.userId });

    if (!event) {
      return res.status(404).json({ success: false, message: "Event not found" });
    }

    // Clear the originating job date field — always falls through to Event deletion
    if (event.jobId && (event.sourceField || event.eventType)) {
      const Job = (await import("../models/Job.js")).default;
      const job = await Job.findOne({ _id: event.jobId, userId: req.userId });
      if (job) {
        const dateField = event.sourceField || ({
          interview: "interviewDate",
          followUp: "followUpDate",
          assessment: "assessmentDeadline",
          offer: "offerDeadline"
        })[event.eventType];
        if (dateField && Object.prototype.hasOwnProperty.call(job.schema.paths, dateField)) {
          job[dateField] = null;
          await job.save();
        }
      }
    }

    // Delete from Google Calendar if connected
    const user = await User.findById(req.userId);
    if (user?.googleCalendarConnected && event.googleEventId && user.calendarSyncCancellations !== false) {
      try {
        await deleteGoogleEvent(req.userId, event.googleEventId);
      } catch (err) {
        console.error("Failed to delete event from Google Calendar", err.message);
      }
    }

    // Always delete the Event document (P0 fix: never return early)
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
      "googleCalendarConnected googleCalendarEmail calendarConnectionDate calendarAutoCreate calendarSyncUpdates calendarSyncCancellations calendarEnableReminders"
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

const calendarPreferencesSchema = z.object({
  calendarAutoCreate: z.boolean().optional(),
  calendarSyncUpdates: z.boolean().optional(),
  calendarSyncCancellations: z.boolean().optional(),
  calendarEnableReminders: z.boolean().optional(),
});

/**
 * PUT /api/calendar/preferences
 * Updates Google Calendar sync preference toggles
 */
export const updateCalendarPreferences = async (req, res, next) => {
  try {
    const data = calendarPreferencesSchema.parse(req.body);
    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    if (data.calendarAutoCreate !== undefined) user.calendarAutoCreate = data.calendarAutoCreate;
    if (data.calendarSyncUpdates !== undefined) user.calendarSyncUpdates = data.calendarSyncUpdates;
    if (data.calendarSyncCancellations !== undefined) user.calendarSyncCancellations = data.calendarSyncCancellations;
    if (data.calendarEnableReminders !== undefined) user.calendarEnableReminders = data.calendarEnableReminders;

    await user.save();

    res.json({
      success: true,
      preferences: {
        calendarAutoCreate: user.calendarAutoCreate,
        calendarSyncUpdates: user.calendarSyncUpdates,
        calendarSyncCancellations: user.calendarSyncCancellations,
        calendarEnableReminders: user.calendarEnableReminders,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/calendar/backfill
 * Idempotent backfill — creates Event records for existing Job scheduling fields
 * that existed before the auto-generation code was added.
 */
export const backfillJobEvents = async (req, res, next) => {
  try {
    const Job = (await import("../models/Job.js")).default;
    const { syncJobEvents } = await import("../services/jobService.js");

    const jobs = await Job.find({
      userId: req.userId,
      $or: [
        { interviewDate: { $ne: null } },
        { followUpDate: { $ne: null } },
        { assessmentDeadline: { $ne: null } },
        { offerDeadline: { $ne: null } }
      ]
    });

    let processed = 0;
    for (const job of jobs) {
      await syncJobEvents(job);
      processed++;
    }

    res.json({ success: true, message: `Backfill complete. Processed ${processed} jobs.` });
  } catch (error) {
    next(error);
  }
};

/**
 * Non-blocking startup backfill for all users. Called once on server boot.
 * Idempotent — skips jobs that already have an Event for the same sourceField.
 */
export const runStartupBackfill = async () => {
  try {
    const Job = (await import("../models/Job.js")).default;
    const { syncJobEvents } = await import("../services/jobService.js");

    const jobs = await Job.find({
      $or: [
        { interviewDate: { $ne: null } },
        { followUpDate: { $ne: null } },
        { assessmentDeadline: { $ne: null } },
        { offerDeadline: { $ne: null } }
      ]
    });

    let processed = 0;
    for (const job of jobs) {
      // Check for ANY existing event for this job (handles both old + new records).
      // Without this check, the backfill would create duplicates for jobs that
      // already had events before the sourceField column was introduced.
      const hasEvents = await Event.exists({ jobId: job._id });
      if (!hasEvents) {
        await syncJobEvents(job);
        processed++;
      }
    }

    if (processed > 0) {
      console.log(`[Backfill] Calendar sync complete: ${processed} jobs processed.`);
    }
  } catch (err) {
    console.error("[Backfill] Failed:", err.message);
  }
};
