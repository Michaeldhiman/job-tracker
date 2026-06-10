// Mongoose model representing an application user (auth + role).
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      // Very basic email pattern validation.
      match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    },
    password: {
      type: String,
      required: true,
      minlength: 6
    },
    // Simple role field in case you introduce admin-only features later.
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user"
    },
    theme: {
      type: String,
      enum: ["light", "dark", "system"],
      default: "system"
    },
    emailNotifs: {
      type: Boolean,
      default: true
    },
    interviewReminders: {
      type: Boolean,
      default: true
    },
    weeklyDigest: {
      type: Boolean,
      default: false
    },
    lastWeeklyDigestSentAt: {
      type: Date
    }
  },
  {
    // Automatically adds `createdAt` and `updatedAt`.
    timestamps: true
  }
);

// Hash password before saving if it has been modified.
userSchema.pre("save", async function hashPassword(next) {
  if (!this.isModified("password")) {
    return next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Instance method to compare a candidate password to the hashed one.
userSchema.methods.comparePassword = function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.password);
};

// Reuse existing compiled model in hot-reload environments if present.
const User = mongoose.models.User || mongoose.model("User", userSchema);

export default User;


