import { Router } from "express";
import auth from "../middleware/auth.js";
import { pagination } from "../middleware/pagination.js";
import Resume from "../models/Resume.js";
import upload from "../fileUpload/multerConfig.js";
import { uploadToCloudinary } from "../fileUpload/cloudinary.js";
import { z } from "zod";
import { validateRequest } from "../utils/validation.js";

const router = Router();
router.use(auth);

const resumeSchemaZod = z.object({
  name: z.string().min(2),
  type: z.string().optional()
});

router.post("/", upload.single("file"), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: "File required" });
    
    let name = req.body.name || req.file.originalname;
    
    const { url } = await uploadToCloudinary(req.file.buffer, req.file.originalname, "resumes");
    
    const resume = await Resume.create({
      userId: req.userId,
      name,
      url,
      type: req.body.type
    });

    res.status(201).json({ success: true, resume });
  } catch (error) {
    next(error);
  }
});

router.get("/", pagination, async (req, res, next) => {
  try {
    const { page, limit, skip } = req.pagination;
    const [resumes, total] = await Promise.all([
      Resume.find({ userId: req.userId }).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Resume.countDocuments({ userId: req.userId })
    ]);
    res.json({ success: true, resumes, total, page, limit });
  } catch (error) {
    next(error);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const resume = await Resume.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    if (!resume) return res.status(404).json({ success: false, message: "Not found" });
    res.json({ success: true, message: "Deleted" });
  } catch (error) {
    next(error);
  }
});

export default router;
