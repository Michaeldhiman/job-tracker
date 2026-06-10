import { Router } from "express";
import auth from "../middleware/auth.js";
import { pagination } from "../middleware/pagination.js";
import Company from "../models/Company.js";
import { z } from "zod";
import { validateRequest } from "../utils/validation.js";

const router = Router();
router.use(auth);

const companySchemaZod = z.object({
  name: z.string().min(2),
  website: z.string().url().optional().or(z.literal("")),
  location: z.string().optional(),
  industry: z.string().optional(),
  careerPage: z.string().url().optional().or(z.literal("")),
  notes: z.string().optional()
});

router.post("/", validateRequest(companySchemaZod), async (req, res, next) => {
  try {
    const company = await Company.create({ ...req.body, userId: req.userId });
    res.status(201).json({ success: true, company });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: "Company already exists" });
    }
    next(error);
  }
});

router.get("/", pagination, async (req, res, next) => {
  try {
    const { page, limit, skip } = req.pagination;
    const [companies, total] = await Promise.all([
      Company.find({ userId: req.userId }).sort({ name: 1 }).skip(skip).limit(limit),
      Company.countDocuments({ userId: req.userId })
    ]);
    res.json({ success: true, companies, total, page, limit });
  } catch (error) {
    next(error);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const company = await Company.findOne({ _id: req.params.id, userId: req.userId });
    if (!company) return res.status(404).json({ success: false, message: "Not found" });
    res.json({ success: true, company });
  } catch (error) {
    next(error);
  }
});

router.put("/:id", validateRequest(companySchemaZod.partial()), async (req, res, next) => {
  try {
    const company = await Company.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      req.body,
      { new: true }
    );
    if (!company) return res.status(404).json({ success: false, message: "Not found" });
    res.json({ success: true, company });
  } catch (error) {
    next(error);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const company = await Company.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    if (!company) return res.status(404).json({ success: false, message: "Not found" });
    res.json({ success: true, message: "Deleted" });
  } catch (error) {
    next(error);
  }
});

export default router;
