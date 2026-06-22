import { Router } from "express";
import auth from "../middleware/auth.js";
import { pagination } from "../middleware/pagination.js";
import Job from "../models/Job.js";

const router = Router();

router.use(auth);

// GET /api/search
router.get("/", pagination, async (req, res, next) => {
  try {
    const { q, company, role, status, priority, location } = req.query;
    const { page, limit, skip } = req.pagination;

    const query = { userId: req.userId };

    if (q) {
      const regex = new RegExp(q, "i");
      query.$or = [
        { company: regex },
        { role: regex },
        { location: regex },
        { notes: regex },
        { tags: { $in: [regex] } }
      ];
    }

    if (company) query.company = new RegExp(company, "i");
    if (role) query.role = new RegExp(role, "i");
    if (status) {
      if (Array.isArray(status)) {
        query.status = { $in: status };
      } else if (typeof status === 'string' && status.includes(',')) {
        query.status = { $in: status.split(',') };
      } else {
        query.status = status;
      }
    }
    if (priority) query.priority = priority;
    if (location) query.location = new RegExp(location, "i");

    const [results, total] = await Promise.all([
      Job.find(query).sort({ appliedDate: -1 }).skip(skip).limit(limit),
      Job.countDocuments(query)
    ]);

    res.json({ results, total, page, limit });
  } catch (error) {
    next(error);
  }
});

export default router;
