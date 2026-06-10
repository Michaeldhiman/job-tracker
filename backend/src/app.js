// Core Express app setup: middlewares, CORS, JSON parsing, and static assets.
import express from "express";
import cors from "cors";
import morgan from "morgan";
import dotenv from "dotenv";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import mongoSanitize from "express-mongo-sanitize";

import authRoutes from "./routes/auth.routes.js";
import jobRoutes from "./routes/jobs.routes.js";
import errorHandler from "./middleware/errorHandler.js";
import { uploadsDir } from "./utils/pathHelper.js";

// Load environment variables from `.env` into `process.env`.
dotenv.config();

// Create a single Express application instance that will be used by `server.js`.
const app = express();

// Enable CORS for the frontend URL so the browser can call this API.
const allowedOrigins = ["http://localhost:3000", "http://localhost:5173"];
if (process.env.FRONTEND_URL) {
  allowedOrigins.push(process.env.FRONTEND_URL);
}

const corsOptions = {
  origin: allowedOrigins,
  credentials: true
};

app.use(cors(corsOptions));

// Security Middlewares
app.use(helmet());
app.use(mongoSanitize());

// Rate Limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs
  message: "Too many requests from this IP, please try again after 15 minutes"
});
app.use("/api/", apiLimiter);

// Parse incoming JSON and URL‑encoded payloads.
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));

// HTTP request logging in the console (dev-friendly format).
app.use(morgan("dev"));

// Expose uploaded files under `/uploads` URL path.
app.use("/uploads", express.static(uploadsDir));

import searchRoutes from "./routes/search.routes.js";
import analyticsRoutes from "./routes/analytics.routes.js";
import companyRoutes from "./routes/company.routes.js";
import resumeRoutes from "./routes/resume.routes.js";
import activityLogRoutes from "./routes/activityLog.routes.js";
import exportRoutes from "./routes/export.routes.js";

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    message: "Server is running",
    timestamp: new Date().toISOString()
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

// Global error handler should be registered after all routes and middleware.
app.use(errorHandler);

// Export the configured app so it can be started by `server.js`.
export default app;

