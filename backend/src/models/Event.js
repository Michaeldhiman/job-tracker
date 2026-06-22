import mongoose from "mongoose";

const eventSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    date: {
      type: Date,
      required: true,
    },
    startTime: {
      type: String,
      required: true, // e.g. "14:00"
    },
    endTime: {
      type: String,
      required: true, // e.g. "15:00"
    },
    company: {
      type: String,
      trim: true,
    },
    interviewRound: {
      type: String,
      trim: true, // e.g., "Screening", "Technical", "HR"
    },
    googleEventId: {
      type: String,
      trim: true,
    },
    syncStatus: {
      type: String,
      enum: ["pending", "synced", "failed"],
      default: "pending",
    },
    // Legacy field — kept for backward-compatibility with existing records.
    // New code uses sourceField as the canonical lookup key.
    eventType: {
      type: String,
      enum: ["interview", "followUp", "assessment", "offer", "custom"],
      default: "custom",
    },
    // "job"    — auto-generated from a Job scheduling field
    // "custom" — manually created by the user
    source: {
      type: String,
      enum: ["job", "custom"],
      default: "custom",
    },
    // The exact Job field that produced this event.
    // Used as the canonical upsert key alongside jobId.
    sourceField: {
      type: String,
      enum: ["interviewDate", "followUpDate", "assessmentDeadline", "offerDeadline"],
      default: null,
    },
    // Duplicate-prevention flags for interview reminder emails.
    // Both are automatically reset to false if date or startTime changes.
    reminder24hSent: {
      type: Boolean,
      default: false,
    },
    reminder1hSent: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Reset reminder flags whenever date or startTime is modified so that
// rescheduled interviews always trigger fresh reminders.
eventSchema.pre("save", function resetReminders(next) {
  if (!this.isNew && (this.isModified("date") || this.isModified("startTime"))) {
    this.reminder24hSent = false;
    this.reminder1hSent = false;
  }
  next();
});

// Sync event date and startTime back to the Job record for auto-generated events.
// Uses sourceField as the canonical field name.
eventSchema.pre("save", async function syncToJob(next) {
  const field = this.sourceField;
  if (this.jobId && field) {
    try {
      const Job = mongoose.model("Job");
      const job = await Job.findById(this.jobId);
      if (job) {
        const [hours, minutes] = (this.startTime || "09:00").split(":").map(Number);
        // Build UTC midnight for the event date, then combine with start time
        const dateStr = new Date(this.date).toISOString().slice(0, 10);
        const combinedDate = new Date(`${dateStr}T${String(hours).padStart(2,"0")}:${String(minutes).padStart(2,"0")}:00.000Z`);

        const existingJobDate = job[field];
        if (!existingJobDate || new Date(existingJobDate).getTime() !== combinedDate.getTime()) {
          job[field] = combinedDate;
          await job.save();
        }
      }
    } catch (err) {
      console.error(`[EventSchema] Error syncing event ${this._id} to job:`, err.message);
    }
  }
  next();
});

eventSchema.index({ userId: 1, date: -1 });
eventSchema.index({ googleEventId: 1 });
// Compound index for fast upsert lookups by job + sourceField
eventSchema.index({ jobId: 1, sourceField: 1 }, { sparse: true });

export default mongoose.model("Event", eventSchema);
