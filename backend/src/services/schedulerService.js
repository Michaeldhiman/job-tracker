import cron from "node-cron";
import Event from "../models/Event.js";
import User from "../models/User.js";
import ActivityLog from "../models/ActivityLog.js";
import { sendInterview24HourReminder, sendInterview1HourReminder } from "./emailService.js";
import { config } from "../config/runtimeConfig.js";

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Combine an Event's `date` field (midnight UTC) with its `startTime` string
 * (e.g. "14:30") to produce a precise interview start Date object in local time.
 */
const getInterviewStart = (event) => {
  const base = new Date(event.date);
  const [hours, minutes] = event.startTime.split(":").map(Number);
  // Build a proper local datetime: use the event date's year/month/day
  const dt = new Date(
    base.getFullYear(),
    base.getMonth(),
    base.getDate(),
    hours,
    minutes,
    0,
    0
  );
  return dt;
};

/** Format a Date as "June 15, 2026" */
const formatDate = (d) =>
  d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

/** Format a time string "HH:MM" as "10:00 AM" */
const formatTime = (timeStr) => {
  const [h, m] = timeStr.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 || 12;
  return `${hour12}:${String(m).padStart(2, "0")} ${period}`;
};

const minutes = (value) => value * 60 * 1000;

// ─── Core Jobs ────────────────────────────────────────────────────────────────

/**
 * Scan events with an interview starting in the next 24 hours (±15-min window)
 * and dispatch the 24-hour reminder email + in-app activity log entry.
 */
export const check24HourReminders = async () => {
  const now = new Date();
  // Target window: 23h 45min → 24h from now (catches any tick in the 15-min cron cycle)
  const halfWindow = config.scheduler.reminderWindowMinutes;
  const lead = config.scheduler.reminder24HourLeadMinutes;
  const windowStart = new Date(now.getTime() + minutes(lead - halfWindow));
  const windowEnd = new Date(now.getTime() + minutes(lead + halfWindow));

  try {
    // Fetch events whose 24h reminder hasn't been sent yet
    const events = await Event.find({
      date:             { $gte: new Date(now.toDateString()) },
      reminder24hSent:  { $ne: true },
    });

    for (const event of events) {
      const interviewStart = getInterviewStart(event);

      // Precise time check: is the interview between 23h45min and 24h15min from now?
      if (interviewStart < windowStart || interviewStart > windowEnd) {
        continue;
      }

      const user = await User.findById(event.userId);
      if (!user || !user.emailNotifs || !user.interviewReminders) {
        continue;
      }

      const dateLabel = formatDate(interviewStart);
      const timeLabel = formatTime(event.startTime);
      const company   = event.company || "the company";
      const role      = event.title;

      await sendInterview24HourReminder({
        to: user.email,
        name: user.name,
        company,
        role,
        date: dateLabel,
        time: timeLabel,
      });

      // In-app activity log entry
      await ActivityLog.create({
        userId: user._id,
        jobId:  event.jobId || undefined,
        action: "Interview Reminder",
        details: `24-hour reminder: ${role}${company !== "the company" ? ` at ${company}` : ""} — ${dateLabel} at ${timeLabel}`,
      });

      // Mark as sent to prevent duplicate emails
      event.reminder24hSent = true;
      await event.save();

      console.log(`[Scheduler] 24h reminder sent → ${user.email} (${role} at ${company})`);
    }
  } catch (err) {
    console.error("[Scheduler] Error in 24h reminder job:", err);
  }
};

/**
 * Scan events with an interview starting in the next 1 hour (±15-min window)
 * and dispatch the 1-hour reminder email + in-app activity log entry.
 */
export const check1HourReminders = async () => {
  const now = new Date();
  // Target window: 45min → 75min from now
  const halfWindow = config.scheduler.reminderWindowMinutes;
  const lead = config.scheduler.reminder1HourLeadMinutes;
  const windowStart = new Date(now.getTime() + minutes(lead - halfWindow));
  const windowEnd = new Date(now.getTime() + minutes(lead + halfWindow));

  try {
    // Fetch events whose 1h reminder hasn't been sent yet
    const events = await Event.find({
      date:            { $gte: new Date(now.toDateString()) },
      reminder1hSent:  { $ne: true },
    });

    for (const event of events) {
      const interviewStart = getInterviewStart(event);

      // Precise time check
      if (interviewStart < windowStart || interviewStart > windowEnd) {
        continue;
      }

      const user = await User.findById(event.userId);
      if (!user || !user.emailNotifs || !user.interviewReminders) {
        continue;
      }

      const timeLabel = formatTime(event.startTime);
      const company   = event.company || "the company";
      const role      = event.title;

      await sendInterview1HourReminder({
        to: user.email,
        name: user.name,
        company,
        role,
        time: timeLabel,
      });

      // In-app activity log entry
      await ActivityLog.create({
        userId: user._id,
        jobId:  event.jobId || undefined,
        action: "Interview Reminder",
        details: `1-hour reminder: ${role}${company !== "the company" ? ` at ${company}` : ""} at ${timeLabel}`,
      });

      // Mark as sent
      event.reminder1hSent = true;
      await event.save();

      console.log(`[Scheduler] 1h reminder sent → ${user.email} (${role} at ${company})`);
    }
  } catch (err) {
    console.error("[Scheduler] Error in 1h reminder job:", err);
  }
};

// ─── Scheduler Lifecycle ──────────────────────────────────────────────────────

let job24h = null;
let job1h  = null;

/**
 * Start the background cron scheduler.
 * Runs both reminder checks every 15 minutes and fires an immediate first pass.
 */
export const startScheduler = () => {
  if (job24h || job1h) return; // prevent double-start

  job24h = cron.schedule(config.scheduler.cronExpression, check24HourReminders, {
    timezone: config.scheduler.timezone,
  });
  job1h = cron.schedule(config.scheduler.cronExpression, check1HourReminders, {
    timezone: config.scheduler.timezone,
  });

  console.log(`[Scheduler] Background reminder cron jobs started (${config.scheduler.cronExpression}).`);

  // Immediate first pass so reminders fire on boot without waiting 15 minutes
  check24HourReminders();
  check1HourReminders();
};

/**
 * Stop the background cron scheduler gracefully.
 * Called during graceful shutdown or in tests.
 */
export const stopScheduler = () => {
  if (job24h) { job24h.stop(); job24h = null; }
  if (job1h)  { job1h.stop();  job1h  = null; }
  console.log("[Scheduler] Background reminder cron jobs stopped.");
};
