import { Router } from "express";
import mongoose from "mongoose";
import auth from "../middleware/auth.js";
import Job from "../models/Job.js";

const router = Router();

router.use(auth);

// GET /api/analytics
router.get("/", async (req, res, next) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.userId);

    const [funnel, trends, timeMetrics] = await Promise.all([
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
      ])
    ]);

    res.json({
      success: true,
      data: {
        funnel,
        trends,
        timeMetrics: timeMetrics[0] || { avgDaysToInterview: null }
      }
    });
  } catch (error) {
    next(error);
  }
});

export default router;
