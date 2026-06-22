import { Router } from "express";
import mongoose from "mongoose";
import auth from "../middleware/auth.js";
import Job from "../models/Job.js";
import Resume from "../models/Resume.js";

const router = Router();

router.use(auth);

// GET /api/analytics
router.get("/", async (req, res, next) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.userId);

    const [funnel, trends, timeMetrics, totalResumes, storageResult, mostUsedResult, resumeUsage, sourceBreakdown] = await Promise.all([
      // Funnel metrics
      Job.aggregate([
        { $match: { userId } },
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 }
          }
        }
      ]),
      // Monthly applications trend
      Job.aggregate([
        { $match: { userId } },
        {
          $group: {
            _id: {
              year: { $year: "$appliedDate" },
              month: { $month: "$appliedDate" }
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { "_id.year": 1, "_id.month": 1 } }
      ]),
      // Average times (simplified)
      Job.aggregate([
        { $match: { userId, interviewDate: { $exists: true } } },
        {
          $project: {
            daysToInterview: {
              $divide: [
                { $subtract: ["$interviewDate", "$appliedDate"] },
                1000 * 60 * 60 * 24
              ]
            }
          }
        },
        {
          $group: {
            _id: null,
            avgDaysToInterview: { $avg: "$daysToInterview" }
          }
        }
      ]),
      // Total resumes count
      Resume.countDocuments({ userId }),
      // Storage calculation
      Resume.aggregate([
        { $match: { userId } },
        { $group: { _id: null, totalSize: { $sum: "$size" } } }
      ]),
      // Most used resume
      Job.aggregate([
        { $match: { userId, resumeId: { $ne: null } } },
        { $group: { _id: "$resumeId", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 1 },
        {
          $lookup: {
            from: "resumes",
            localField: "_id",
            foreignField: "_id",
            as: "resume"
          }
        },
        { $unwind: { path: "$resume", preserveNullAndEmptyArrays: true } }
      ]),
      // Resume usage distribution for charts
      Resume.aggregate([
        { $match: { userId } },
        {
          $lookup: {
            from: "jobs",
            localField: "_id",
            foreignField: "resumeId",
            as: "jobs"
          }
        },
        {
          $project: {
            name: 1,
            count: { $size: "$jobs" }
          }
        },
        { $sort: { count: -1, name: 1 } }
      ]),
      // Source breakdown: total applied vs reached interview vs reached offer per source
      Job.aggregate([
        { $match: { userId } },
        {
          $group: {
            _id: "$source",
            total: { $sum: 1 },
            interviews: {
              $sum: { $cond: [{ $in: ["$status", ["Interview", "Offer"]] }, 1, 0] }
            },
            offers: {
              $sum: { $cond: [{ $eq: ["$status", "Offer"] }, 1, 0] }
            }
          }
        },
        { $match: { _id: { $ne: null } } },
        { $sort: { total: -1 } }
      ])
    ]);

    const totalStorage = storageResult[0]?.totalSize || 0;
    const mostUsedResume = mostUsedResult[0] ? {
      _id: mostUsedResult[0]._id,
      name: mostUsedResult[0].resume?.name || "Deleted Resume",
      count: mostUsedResult[0].count
    } : null;

    // Compute cumulative stage counts for the bottleneck funnel.
    // Each stage count = jobs currently at that stage OR any later stage.
    // This gives true top-of-funnel numbers rather than a snapshot of current statuses.
    const sm = Object.fromEntries(funnel.map(f => [f._id, f.count]));
    const stageConversions = [
      { stage: "Applied",    count: (sm["Applied"] || 0) + (sm["Assessment"] || 0) + (sm["Interview"] || 0) + (sm["Offer"] || 0) + (sm["Rejected"] || 0) },
      { stage: "Assessment", count: (sm["Assessment"] || 0) + (sm["Interview"] || 0) + (sm["Offer"] || 0) },
      { stage: "Interview",  count: (sm["Interview"] || 0) + (sm["Offer"] || 0) },
      { stage: "Offer",      count: sm["Offer"] || 0 }
    ];

    res.json({
      success: true,
      data: {
        funnel,
        trends,
        timeMetrics: timeMetrics[0] || { avgDaysToInterview: null },
        resumeStats: {
          totalResumes,
          totalStorage,
          mostUsedResume,
          resumeUsage
        },
        sourceBreakdown,
        stageConversions
      }
    });
  } catch (error) {
    next(error);
  }
});

export default router;
