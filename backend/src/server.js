// Application entry point: connect to MongoDB and start the HTTP server.
import dotenv from "dotenv";
import app from "./app.js";
import connectDB from "./config/db.js";

// Load environment variables (e.g. PORT, MONGO_URI, etc.).
dotenv.config();

// Port for the Express server, falling back to 5000 in development.
const PORT = process.env.PORT || 5000;

// Bootstraps the app: first connect to the database, then start listening.
const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`Server running http://localhost:${PORT}`);
    });
  } catch (error) {
    // If something fails during startup, log it and exit with failure.
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
};

// Immediately invoke the startup routine when this file is executed.
startServer();

