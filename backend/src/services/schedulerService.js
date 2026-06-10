import Job from "../models/Job.js";
import User from "../models/User.js";
import ActivityLog from "../models/ActivityLog.js";
import { sendEmail } from "./emailService.js";

/**
 * Main background task checks.
 * Scans DB for upcoming interviews, follow-ups, and weekly digests.
 */
export const checkRemindersAndDigests = async () => {
  const now = new Date();
  const next24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  console.log(`[Scheduler] Checking background tasks at ${now.toISOString()}`);

  try {
    // ─── 1. INTERVIEW REMINDERS ──────────────────────────────────────────────
    // Find jobs with interviewDate within the next 24 hours that haven't had reminders sent
    const upcomingInterviews = await Job.find({
      interviewDate: { $gt: now, $lte: next24Hours },
      interviewReminderSent: { $ne: true }
    });

    for (const job of upcomingInterviews) {
      const user = await User.findById(job.userId);
      if (user && user.interviewReminders) {
        // Dispatch Email
        const formattedDate = new Date(job.interviewDate).toLocaleString();
        await sendEmail({
          to: user.email,
          subject: `📅 Interview Reminder: ${job.role} at ${job.company}`,
          text: `Hi ${user.name},\n\nThis is a 24-hour reminder that you have an interview scheduled for the role of "${job.role}" at ${job.company} on ${formattedDate}.\n\nGood luck with your preparation!\n\nBest,\nObsidian CRM Team`,
          html: `<p>Hi <strong>${user.name}</strong>,</p><p>This is a 24-hour reminder that you have an interview scheduled for the role of <strong>${job.role}</strong> at <strong>${job.company}</strong> on <strong>${formattedDate}</strong>.</p><p>Good luck with your preparation!</p><br/><p>Best,<br/>Obsidian CRM Team</p>`
        });

        // Add In-App Notification (ActivityLog)
        await ActivityLog.create({
          userId: user._id,
          jobId: job._id,
          action: "Interview Reminder",
          details: `Upcoming interview for ${job.role} at ${job.company} on ${new Date(job.interviewDate).toLocaleDateString()}`
        });

        // Mark as sent
        job.interviewReminderSent = true;
        await job.save();
      }
    }

    // ─── 2. FOLLOW-UP REMINDERS ──────────────────────────────────────────────
    // Find jobs with followUpDate within the next 24 hours that haven't had reminders sent
    const upcomingFollowUps = await Job.find({
      followUpDate: { $gt: now, $lte: next24Hours },
      followUpReminderSent: { $ne: true }
    });

    for (const job of upcomingFollowUps) {
      const user = await User.findById(job.userId);
      if (user && user.emailNotifs) {
        // Dispatch Email
        const formattedDate = new Date(job.followUpDate).toLocaleDateString();
        await sendEmail({
          to: user.email,
          subject: `🔔 Follow-up Reminder: ${job.role} at ${job.company}`,
          text: `Hi ${user.name},\n\nThis is a reminder to follow up on your application for "${job.role}" at ${job.company}. Your follow-up is scheduled for ${formattedDate}.\n\nBest,\nObsidian CRM Team`,
          html: `<p>Hi <strong>${user.name}</strong>,</p><p>This is a reminder to follow up on your application for <strong>${job.role}</strong> at <strong>${job.company}</strong>. Your follow-up is scheduled for <strong>${formattedDate}</strong>.</p><br/><p>Best,<br/>Obsidian CRM Team</p>`
        });

        // Add In-App Notification (ActivityLog)
        await ActivityLog.create({
          userId: user._id,
          jobId: job._id,
          action: "Follow-up Reminder",
          details: `Time to follow up on application for ${job.role} at ${job.company}`
        });

        // Mark as sent
        job.followUpReminderSent = true;
        await job.save();
      }
    }

    // ─── 3. WEEKLY DIGEST ───────────────────────────────────────────────────
    // Find users with weeklyDigest enabled who haven't received a digest in the last 7 days
    const usersForDigest = await User.find({
      weeklyDigest: true,
      $or: [
        { lastWeeklyDigestSentAt: { $exists: false } },
        { lastWeeklyDigestSentAt: { $lte: sevenDaysAgo } }
      ]
    });

    for (const user of usersForDigest) {
      // Gather stats for the past week
      const [newJobs, upcomingInts, offers, rejections] = await Promise.all([
        Job.countDocuments({ userId: user._id, createdAt: { $gte: sevenDaysAgo } }),
        Job.countDocuments({ userId: user._id, interviewDate: { $gte: now } }),
        Job.countDocuments({ userId: user._id, status: "Offer", updatedAt: { $gte: sevenDaysAgo } }),
        Job.countDocuments({ userId: user._id, status: "Rejected", updatedAt: { $gte: sevenDaysAgo } })
      ]);

      await sendEmail({
        to: user.email,
        subject: `📈 Obsidian CRM: Your Weekly Job Search Summary`,
        text: `Hi ${user.name},\n\nHere is your job search summary for the past week:\n\n- New applications added: ${newJobs}\n- Upcoming interviews: ${upcomingInts}\n- Offers received: ${offers}\n- Rejections: ${rejections}\n\nKeep tracking and good luck!\n\nBest,\nObsidian CRM Team`,
        html: `
          <p>Hi <strong>${user.name}</strong>,</p>
          <p>Here is your job search summary for the past week:</p>
          <ul>
            <li><strong>New applications added:</strong> ${newJobs}</li>
            <li><strong>Upcoming interviews:</strong> ${upcomingInts}</li>
            <li><strong>Offers received:</strong> ${offers}</li>
            <li><strong>Rejections:</strong> ${rejections}</li>
          </ul>
          <p>Keep tracking and good luck!</p>
          <br/>
          <p>Best,<br/>Obsidian CRM Team</p>
        `
      });

      // Update sent timestamp
      user.lastWeeklyDigestSentAt = now;
      await user.save();
    }

  } catch (error) {
    console.error("[Scheduler] Error running background tasks:", error);
  }
};

let intervalId = null;

/**
 * Start background scheduler checks.
 * Runs checkRemindersAndDigests immediately, and then at the specified interval.
 * @param {number} intervalMs - Poll interval in milliseconds (default 10 minutes)
 */
export const startScheduler = (intervalMs = 10 * 60 * 1000) => {
  if (intervalId) return;

  // Run immediate first check
  checkRemindersAndDigests();

  intervalId = setInterval(checkRemindersAndDigests, intervalMs);
  console.log(`[Scheduler] Background task runner initialized (running every ${intervalMs / 60 / 1000} mins)`);
};

/** Stop the background scheduler checks */
export const stopScheduler = () => {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
    console.log("[Scheduler] Background task runner stopped.");
  }
};
