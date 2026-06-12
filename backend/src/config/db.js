// MongoDB connection helper using Mongoose.
import mongoose from "mongoose";
import { config } from "./runtimeConfig.js";

const connectDB = async () => {
  // Fail fast if the DB connection string is not provided.
  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is required but missing");
  }

  try {
    // `serverSelectionTimeoutMS` limits how long Mongoose waits for a server.
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: config.database.serverSelectionTimeoutMs
    });
    console.log("MongoDB connected");
  } catch (error) {
    console.error("MongoDB connection error:", error.message);
    // Re-throw so the caller (e.g. `server.js`) can decide how to handle it.
    throw error;
  }
};

export default connectDB;


