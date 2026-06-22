import dotenv from "dotenv";
import app from "./app.js";
import connectDB from "./config/db.js";
import { startScheduler } from "./services/schedulerService.js";
import { config } from "./config/runtimeConfig.js";

// Load environment variables (e.g. PORT, MONGO_URI, etc.).
dotenv.config();

const PORT = config.port;

// Bootstraps the app: first connect to the database, then start listening.
const startServer = async () => {
  try {
    // connectDB() relies on MONGO_URI from the environment.
    await connectDB();
    app.listen(PORT, () => {
      console.log(`[Server] Running on http://localhost:${PORT}`);
      // Start background notification scheduler
      startScheduler();

      // Non-blocking startup backfill — never blocks app availability.
      // Runs in the background, idempotent across restarts.
      import("./controllers/calendarController.js").then(({ runStartupBackfill }) => {
        runStartupBackfill().catch(err => {
          console.error("[Backfill] runStartupBackfill failed:", err.message);
        });
      });
    });
  } catch (error) {
    console.error("[Server] Boot failure:", error);
    process.exit(1);
  }
};

startServer();
