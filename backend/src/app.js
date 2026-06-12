// Core Express app setup: middlewares, CORS, JSON parsing, and static assets.
import express from "express";
import cors from "cors";
import morgan from "morgan";
import dotenv from "dotenv";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import mongoSanitize from "express-mongo-sanitize";
import mongoose from "mongoose";
import { config } from "./config/runtimeConfig.js";

import authRoutes from "./routes/auth.routes.js";
import jobRoutes from "./routes/jobs.routes.js";
import errorHandler from "./middleware/errorHandler.js";

// Load environment variables from `.env` into `process.env`.
dotenv.config();

// Create a single Express application instance that will be used by `server.js`.
const app = express();

// Enable CORS for configured local, preview, and production URLs.
const allowedOrigins = config.cors.origins;

app.use(cors({
  origin: (origin, callback) => {
    const isAllowed =
      !origin ||
      allowedOrigins.includes(origin) ||
      (config.cors.allowLocalhost && origin.startsWith("http://localhost:"));

    if (isAllowed) {
      callback(null, true);
    } else {
      callback(new Error(`CORS Error: Origin ${origin} not allowed`));
    }
  },
  credentials: true
}));

// Security Middlewares
app.use(helmet());
app.use(mongoSanitize());

// Rate Limiting
const apiLimiter = rateLimit({
  windowMs: config.request.rateLimitWindowMs,
  max: config.request.rateLimitMax,
  message: "Too many requests from this IP, please try again later"
});
app.use("/api/", apiLimiter);

// Parse incoming JSON and URL‑encoded payloads.
app.use(express.json({ limit: config.request.bodyLimit }));
app.use(express.urlencoded({ extended: true, limit: config.request.bodyLimit }));

// HTTP request logging in the console (dev-friendly format).
app.use(morgan("dev"));



import searchRoutes from "./routes/search.routes.js";
import analyticsRoutes from "./routes/analytics.routes.js";
import companyRoutes from "./routes/company.routes.js";
import resumeRoutes from "./routes/resume.routes.js";
import activityLogRoutes from "./routes/activityLog.routes.js";
import exportRoutes from "./routes/export.routes.js";
import calendarRoutes from "./routes/calendar.routes.js";
import contactRoutes from "./routes/contact.routes.js";
import notificationRoutes from "./routes/notification.routes.js";

// Health check endpoint
app.get("/health", (req, res) => {
  const dbState = mongoose.connection.readyState;
  const isDbHealthy = dbState === 1; // 1 = connected
  const statusCode = isDbHealthy ? 200 : 500;
  
  res.status(statusCode).json({
    status: isDbHealthy ? "OK" : "ERROR",
    message: isDbHealthy ? "Server is running and database is connected" : "Database connection issue",
    timestamp: new Date().toISOString(),
    services: {
      server: "UP",
      database: isDbHealthy ? "UP" : "DOWN"
    }
  });
});

// Mount feature routes under the `/api` namespace.
app.use("/api/auth", authRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/search", searchRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/companies", companyRoutes);
app.use("/api/resumes", resumeRoutes);
app.use("/api/activity-logs", activityLogRoutes);
app.use("/api/export", exportRoutes);
app.use("/api/calendar", calendarRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/notifications", notificationRoutes);

// Global error handler should be registered after all routes and middleware.
app.use(errorHandler);

// Export the configured app so it can be started by `server.js`.
export default app;

