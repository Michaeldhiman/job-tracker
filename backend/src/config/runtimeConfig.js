import dotenv from "dotenv";
import {
  REQUEST_LIMITS,
  UPLOAD_LIMITS,
  CLOUDINARY_FOLDERS,
  AUTH_DEFAULTS,
  DATABASE_DEFAULTS,
  SCHEDULER_DEFAULTS,
  GOOGLE_CALENDAR_DEFAULTS,
} from "./constants.js";

dotenv.config();

const toInt = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const toBool = (value, fallback = false) => {
  if (value === undefined) return fallback;
  return ["1", "true", "yes", "on"].includes(String(value).toLowerCase());
};

const csv = (value) =>
  (value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

export const config = {
  port: toInt(process.env.PORT, 5000),
  frontendUrl: process.env.FRONTEND_URL,
  backendUrl: process.env.BACKEND_URL,
  contactEmail: process.env.CONTACT_EMAIL,
  cors: {
    origins: csv(process.env.CORS_ORIGINS || process.env.FRONTEND_URL),
    allowLocalhost: process.env.NODE_ENV !== "production",
  },
  request: {
    bodyLimit: REQUEST_LIMITS.BODY_LIMIT,
    defaultPageLimit: REQUEST_LIMITS.DEFAULT_PAGE,
    exportJobLimit: REQUEST_LIMITS.EXPORT_JOB_LIMIT,
    rateLimitWindowMs: toInt(process.env.RATE_LIMIT_WINDOW_MS, 15 * 60 * 1000),
    rateLimitMax: toInt(process.env.RATE_LIMIT_MAX, 1000),
  },
  upload: {
    maxFileSizeBytes: UPLOAD_LIMITS.MAX_FILE_SIZE_BYTES,
    resumeFolder: CLOUDINARY_FOLDERS.RESUMES,
  },
  auth: {
    jwtExpiresIn: AUTH_DEFAULTS.JWT_EXPIRES_IN,
    googleStateExpiresIn: AUTH_DEFAULTS.GOOGLE_STATE_EXPIRES_IN,
  },
  database: {
    serverSelectionTimeoutMs: DATABASE_DEFAULTS.SERVER_SELECTION_TIMEOUT_MS,
  },
  scheduler: {
    cronExpression: process.env.SCHEDULER_CRON_EXPRESSION || "*/15 * * * *",
    timezone: process.env.SCHEDULER_TIMEZONE || "UTC",
    reminderWindowMinutes: SCHEDULER_DEFAULTS.REMINDER_WINDOW_MINUTES,
    reminder24HourLeadMinutes: SCHEDULER_DEFAULTS.REMINDER_24H_LEAD_MINUTES,
    reminder1HourLeadMinutes: SCHEDULER_DEFAULTS.REMINDER_1H_LEAD_MINUTES,
  },
  googleCalendar: {
    tokenRefreshSkewMs: GOOGLE_CALENDAR_DEFAULTS.TOKEN_REFRESH_SKEW_MS,
    syncPastDays: GOOGLE_CALENDAR_DEFAULTS.SYNC_PAST_DAYS,
    syncMaxResults: GOOGLE_CALENDAR_DEFAULTS.SYNC_MAX_RESULTS,
    reminderEmailMinutes: GOOGLE_CALENDAR_DEFAULTS.REMINDER_EMAIL_MINUTES,
    reminderPopupMinutes: GOOGLE_CALENDAR_DEFAULTS.REMINDER_POPUP_MINUTES,
  },
};

export const requireConfig = (value, name) => {
  if (!value) {
    const error = new Error(`${name} environment variable is required`);
    error.status = 500;
    throw error;
  }
  return value;
};

