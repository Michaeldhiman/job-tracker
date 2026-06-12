// HTTP handlers for reading and updating the authenticated user's notification preferences.
import User from "../models/User.js";

/**
 * GET /api/notifications/preferences
 * Returns the current notification preferences for the authenticated user.
 */
export const getNotificationPreferences = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId).select("emailNotifs interviewReminders");
    if (!user) {
      const error = new Error("User not found");
      error.status = 404;
      throw error;
    }

    res.json({
      success: true,
      preferences: {
        emailNotifs: user.emailNotifs ?? true,
        interviewReminders: user.interviewReminders ?? true,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/notifications/preferences
 * Updates one or both notification preferences.
 * Body: { emailNotifs?: boolean, interviewReminders?: boolean }
 *
 * Business rule enforced server-side:
 *   If emailNotifs is set to false, interviewReminders is also forced to false
 *   to prevent orphaned enabled sub-settings with no delivery channel.
 */
export const updateNotificationPreferences = async (req, res, next) => {
  try {
    const { emailNotifs, interviewReminders } = req.body;

    // Validate — only accept booleans when provided
    const errors = {};
    if (emailNotifs !== undefined && typeof emailNotifs !== "boolean") {
      errors.emailNotifs = "Must be a boolean";
    }
    if (interviewReminders !== undefined && typeof interviewReminders !== "boolean") {
      errors.interviewReminders = "Must be a boolean";
    }
    if (Object.keys(errors).length) {
      const error = new Error("Validation failed");
      error.status = 400;
      error.details = errors;
      throw error;
    }

    const user = await User.findById(req.userId);
    if (!user) {
      const error = new Error("User not found");
      error.status = 404;
      throw error;
    }

    if (emailNotifs !== undefined) user.emailNotifs = emailNotifs;
    if (interviewReminders !== undefined) user.interviewReminders = interviewReminders;

    // Business rule: disabling master switch disables all sub-settings
    if (user.emailNotifs === false) {
      user.interviewReminders = false;
    }

    await user.save();

    res.json({
      success: true,
      preferences: {
        emailNotifs: user.emailNotifs,
        interviewReminders: user.interviewReminders,
      },
    });
  } catch (error) {
    next(error);
  }
};
