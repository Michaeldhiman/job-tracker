import dotenv from "dotenv";
import app from "./app.js";
import connectDB from "./config/db.js";
import { startScheduler } from "./services/schedulerService.js";

// Load environment variables (e.g. PORT, MONGO_URI, etc.).
dotenv.config();

// Port for the Express server, falling back to 5000 in development.
const PORT = process.env.PORT || 5000;

// Bootstraps the app: first connect to the database, then start listening.
const startServer = async () => {
  try {
    // connectDB() relies on MONGO_URI from the environment.
    await connectDB();
    app.listen(PORT, () => {
      console.log(`[Server] Running on http://localhost:${PORT}`);
      // Start background notification scheduler
      startScheduler();
    });
  } catch (error) {
    console.error("[Server] Boot failure:", error);
    process.exit(1);
  }
};

startServer();
