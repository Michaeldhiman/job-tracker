import mongoose from "mongoose";

const activityLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job"
    },
    action: {
      type: String,
      required: true
    },
    details: {
      type: String
    }
  },
  {
    timestamps: true
  }
);

activityLogSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.model("ActivityLog", activityLogSchema);
