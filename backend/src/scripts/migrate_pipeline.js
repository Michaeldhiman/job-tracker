import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import Job from "../models/Job.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "../../.env") });

const MONGODB_URI = process.env.MONGO_URI || process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/job-tracker";

const migratePipeline = async () => {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI);
    console.log("Connected.");

    console.log("Migrating Job pipeline statuses...");

    // 1. Wishlist -> Applied
    const wishlistRes = await Job.updateMany(
      { status: "Wishlist" },
      { 
        $set: { status: "Applied" }
      }
    );
    console.log(`Migrated ${wishlistRes.modifiedCount} 'Wishlist' jobs to 'Applied'.`);

    // Ensure all jobs have an appliedDate (Wishlist ones might not)
    // We update all where appliedDate is missing/null, setting it to createdAt.
    const appliedDateRes = await Job.updateMany(
      { appliedDate: { $eq: null } },
      [{ $set: { appliedDate: "$createdAt" } }]
    );
    console.log(`Set missing appliedDate on ${appliedDateRes.modifiedCount} jobs.`);

    // 2. OA -> Assessment
    const oaRes = await Job.updateMany(
      { status: "OA" },
      { $set: { status: "Assessment", subStage: "OA" } }
    );
    console.log(`Migrated ${oaRes.modifiedCount} 'OA' jobs to 'Assessment' (subStage: OA).`);

    // 3. Screening -> Assessment
    const screeningRes = await Job.updateMany(
      { status: "Screening" },
      { $set: { status: "Assessment", subStage: "Screening" } }
    );
    console.log(`Migrated ${screeningRes.modifiedCount} 'Screening' jobs to 'Assessment' (subStage: Screening).`);

    // 4. Technical -> Interview
    const techRes = await Job.updateMany(
      { status: "Technical" },
      { $set: { status: "Interview", subStage: "Technical" } }
    );
    console.log(`Migrated ${techRes.modifiedCount} 'Technical' jobs to 'Interview' (subStage: Technical).`);

    // 5. HR -> Interview
    const hrRes = await Job.updateMany(
      { status: "HR" },
      { $set: { status: "Interview", subStage: "HR" } }
    );
    console.log(`Migrated ${hrRes.modifiedCount} 'HR' jobs to 'Interview' (subStage: HR).`);

    console.log("Migration completed successfully.");
    process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
};

migratePipeline();
