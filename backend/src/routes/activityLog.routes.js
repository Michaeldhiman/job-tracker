import { Router } from "express";
import auth from "../middleware/auth.js";
import { pagination } from "../middleware/pagination.js";
import ActivityLog from "../models/ActivityLog.js";

const router = Router();
router.use(auth);

router.get("/", pagination, async (req, res, next) => {
  try {
    const { page, limit, skip } = req.pagination;
    const [logs, total] = await Promise.all([
      ActivityLog.find({ userId: req.userId })
        .populate("jobId", "company role")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      ActivityLog.countDocuments({ userId: req.userId })
    ]);
    res.json({ success: true, logs, total, page, limit });
  } catch (error) {
    next(error);
  }
});

export default router;
