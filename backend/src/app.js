// Core Express app setup: middlewares, CORS, JSON parsing, and static assets.
import express from "express";
import cors from "cors";
import morgan from "morgan";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.routes.js";
import jobRoutes from "./routes/jobs.routes.js";
import errorHandler from "./middleware/errorHandler.js";
import { uploadsDir } from "./utils/pathHelper.js";

// Load environment variables from `.env` into `process.env`.
dotenv.config();

// Create a single Express application instance that will be used by `server.js`.
const app = express();

// Enable CORS for the frontend URL so the browser can call this API.
// Allow both common Vite ports (3000 and 5173) for development
const corsOptions = {
  origin: process.env.FRONTEND_URL || [
    "http://localhost:3000",
    "http://localhost:5173"
  ],
  credentials: true
};

app.use(cors(corsOptions));

// Parse incoming JSON and URL‑encoded payloads.
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// HTTP request logging in the console (dev-friendly format).
app.use(morgan("dev"));

// Expose uploaded files under `/uploads` URL path.
app.use("/uploads", express.static(uploadsDir));

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

// Global error handler should be registered after all routes and middleware.
app.use(errorHandler);

// Export the configured app so it can be started by `server.js`.
export default app;

