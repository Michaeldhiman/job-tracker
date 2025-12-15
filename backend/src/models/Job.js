// Mongoose model representing a single job application.
import mongoose from "mongoose";

// Embedded document used to track a history of status changes over time.
const historySchema = new mongoose.Schema(
  {
    status: {
      type: String,
      required: true,
      enum: ["Applied", "Interview", "Offer", "Rejected"]
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
      trim: true
    },
    status: {
      type: String,
      enum: ["Applied", "Interview", "Offer", "Rejected"],
      default: "Applied"
    },
    appliedDate: {
      type: Date
    },
    salary: {
      type: Number
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
    notes: {
      type: String,
      trim: true
    },
    // List of status changes (e.g. Applied → Interview → Offer).
    history: {
      type: [historySchema],
      default: []
    }
  },
  {
    // Adds `createdAt` and `updatedAt` timestamps automatically.
    timestamps: true
  }
);

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


