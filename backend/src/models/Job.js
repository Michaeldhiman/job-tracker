// Mongoose model representing a single job application.
import mongoose from "mongoose";
import { PIPELINE_STATUSES } from "../config/constants.js";

// Embedded document used to track a history of status changes over time.
const historySchema = new mongoose.Schema(
  {
    status: {
      type: String,
      required: true
      // Enum removed to safely preserve legacy status records (Wishlist, OA, etc.)
    },
    at: {
      type: Date,
      required: true,
      default: Date.now
    }
  },
  // Use parent document's _id instead of adding one for each history entry.
  { _id: false }
);

// Embedded document used to track interview rounds
const interviewRoundSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },
    date: {
      type: Date,
      required: true
    },
    notes: {
      type: String,
      trim: true
    },
    completed: {
      type: Boolean,
      default: false
    }
  }
);

const jobSchema = new mongoose.Schema(
  {
    // Owner of the job record (user that created the application).
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    company: {
      type: String,
      required: true,
      trim: true
    },
    role: {
      type: String,
      required: true,
      trim: true
    },
    status: {
      type: String,
      enum: PIPELINE_STATUSES,
      default: "Applied"
    },
    subStage: {
      type: String,
      trim: true,
      default: null
    },
    appliedDate: {
      type: Date
    },
    source: {
      type: String,
      enum: ["LinkedIn", "Naukri", "Referral", "Career Page", "Indeed", "Internshala", "Other"],
      default: "Other"
    },
    priority: {
      type: String,
      enum: ["Low", "Medium", "High"],
      default: "Medium"
    },
    location: {
      type: String,
      trim: true
    },
    salary: {
      type: Number
    },
    recruiterName: {
      type: String,
      trim: true
    },
    recruiterEmail: {
      type: String,
      trim: true
    },
    jobUrl: {
      type: String,
      trim: true
    },
    followUpDate: {
      type: Date
    },
    interviewDate: {
      type: Date
    },
    assessmentDeadline: {
      type: Date
    },
    offerDeadline: {
      type: Date
    },
    // Free-form labels like "remote", "onsite", "senior", etc.
    tags: [
      {
        type: String,
        trim: true
      }
    ],
    // Link to an uploaded resume or external URL.
    resumeUrl: {
      type: String,
      trim: true
    },
    resumeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Resume"
    },
    resumeName: {
      type: String,
      trim: true
    },
    notes: {
      type: String,
      trim: true
    },
    // List of status changes (e.g. Applied → Technical → Offer).
    history: {
      type: [historySchema],
      default: []
    },
    interviews: {
      type: [interviewRoundSchema],
      default: []
    },
    interviewReminderSent: {
      type: Boolean,
      default: false
    },
    followUpReminderSent: {
      type: Boolean,
      default: false
    }
  },
  {
    // Adds `createdAt` and `updatedAt` timestamps automatically.
    timestamps: true
  }
);

// Indexes for faster queries
jobSchema.index({ userId: 1, status: 1 });
jobSchema.index({ userId: 1, company: 1 });
jobSchema.index({ userId: 1, appliedDate: -1 });

// Pre-save hook that ensures the `history` array stays in sync with `status`.
jobSchema.pre("save", function handleHistory(next) {
  const now = new Date();

  // On first save, create an initial history entry if one does not exist.
  if (this.isNew && (!this.history || this.history.length === 0)) {
    const initialAt = this.appliedDate || now;
    this.history = [{ status: this.status, at: initialAt }];
  }

  // On subsequent updates, append a new history entry whenever status changes.
  if (this.isModified("status") && !this.isNew) {
    this.history.push({ status: this.status, at: now });
  }

  next();
});

const Job = mongoose.model("Job", jobSchema);

export default Job;

