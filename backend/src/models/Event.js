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

eventSchema.index({ userId: 1, date: -1 });
eventSchema.index({ googleEventId: 1 });

export default mongoose.model("Event", eventSchema);
