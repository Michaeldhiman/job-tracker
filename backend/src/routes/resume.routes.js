import { Router } from "express";
import mongoose from "mongoose";
import auth from "../middleware/auth.js";
import { pagination } from "../middleware/pagination.js";
import Resume from "../models/Resume.js";
import Job from "../models/Job.js";
import ActivityLog from "../models/ActivityLog.js";
import upload from "../fileUpload/multerConfig.js";
import { uploadToCloudinary, deleteFromCloudinary } from "../fileUpload/cloudinary.js";
import { z } from "zod";
import crypto from "crypto";

const router = Router();
router.use(auth);

const resumeSchemaZod = z.object({
  name: z.string().min(2, "Resume name must be at least 2 characters")
});

// POST /api/resumes — Upload a resume
router.post("/", upload.single("file"), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "File required" });
    }
    
    let name = req.body.name || req.file.originalname;
    
    // Calculate SHA-256 hash of file buffer
    const hash = crypto.createHash("sha256").update(req.file.buffer).digest("hex");

    // Check if the same file was already uploaded by this user
    const existingResume = await Resume.findOne({ userId: req.userId, hash });
    if (existingResume) {
      return res.status(200).json({ success: true, resume: existingResume });
    }
    
    const { url, public_id } = await uploadToCloudinary(req.file.buffer, req.file.originalname);
    
    const resume = await Resume.create({
      userId: req.userId,
      name,
      url,
      publicId: public_id,
      size: req.file.size,
      type: req.body.type || req.file.mimetype,
      hash
    });

    try {
      await ActivityLog.create({
        userId: req.userId,
        action: "Document Uploaded",
        details: `Uploaded resume "${name}"`
      });
    } catch (err) {
      console.error("Failed to create ActivityLog for resume upload:", err);
    }

    res.status(201).json({ success: true, resume });
  } catch (error) {
    next(error);
  }
});

// GET /api/resumes — Get all resumes with pagination, search, sort, filter, and usage details
router.get("/", pagination, async (req, res, next) => {
  try {
    const { page, limit, skip } = req.pagination;
    const { search, filter, sort } = req.query;
    const userObjectId = new mongoose.Types.ObjectId(req.userId);

    const pipeline = [
      { $match: { userId: userObjectId } }
    ];

    // Search by name
    if (search) {
      pipeline.push({
        $match: {
          name: { $regex: search, $options: "i" }
        }
      });
    }

    // Lookup jobs referencing this resume
    pipeline.push({
      $lookup: {
        from: "jobs",
        localField: "_id",
        foreignField: "resumeId",
        as: "applications"
      }
    });

    // Add usage count and format applications array for frontend details
    pipeline.push({
      $addFields: {
        usageCount: { $size: "$applications" },
        applications: {
          $map: {
            input: "$applications",
            as: "job",
            in: {
              _id: "$$job._id",
              company: "$$job.company",
              role: "$$job.role",
              status: "$$job.status"
            }
          }
        }
      }
    });

    // Filter by used/unused status
    if (filter) {
      if (filter === "used") {
        pipeline.push({ $match: { usageCount: { $gt: 0 } } });
      } else if (filter === "unused") {
        pipeline.push({ $match: { usageCount: 0 } });
      }
    }

    // Sort stages
    let sortStage = { createdAt: -1 }; // default
    if (sort) {
      switch (sort) {
        case "recently_updated":
          sortStage = { updatedAt: -1 };
          break;
        case "most_used":
          sortStage = { usageCount: -1, createdAt: -1 };
          break;
        case "least_used":
          sortStage = { usageCount: 1, createdAt: -1 };
          break;
        case "alphabetical":
          sortStage = { name: 1 };
          break;
        case "recently_uploaded":
        default:
          sortStage = { createdAt: -1 };
          break;
      }
    }
    pipeline.push({ $sort: sortStage });

    // Pagination using facet
    pipeline.push({
      $facet: {
        metadata: [{ $count: "total" }],
        data: [{ $skip: skip }, { $limit: limit }]
      }
    });

    const results = await Resume.aggregate(pipeline);
    
    const total = results[0]?.metadata[0]?.total || 0;
    const resumes = results[0]?.data || [];

    res.json({ success: true, resumes, total, page, limit });
  } catch (error) {
    next(error);
  }
});

// PUT /api/resumes/:id — Rename a resume and sync name on referencing job records
router.put("/:id", async (req, res, next) => {
  try {
    const validated = resumeSchemaZod.parse(req.body);
    
    const resume = await Resume.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { name: validated.name },
      { new: true }
    );

    if (!resume) {
      return res.status(404).json({ success: false, message: "Resume not found" });
    }

    // Sync rename to referencing jobs
    await Job.updateMany(
      { resumeId: req.params.id, userId: req.userId },
      { resumeName: validated.name }
    );

    res.json({ success: true, resume });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, message: "Validation error", errors: error.errors });
    }
    next(error);
  }
});

// DELETE /api/resumes/:id — Delete resume from Cloudinary and DB, unlink from jobs (preserving url and name)
router.delete("/:id", async (req, res, next) => {
  try {
    const resume = await Resume.findOne({ _id: req.params.id, userId: req.userId });
    if (!resume) {
      return res.status(404).json({ success: false, message: "Resume not found" });
    }

    // Delete file from Cloudinary if publicId exists
    if (resume.publicId) {
      try {
        await deleteFromCloudinary(resume.publicId);
      } catch (cloudinaryErr) {
        console.error("Cloudinary deletion failed:", cloudinaryErr);
        // Continue database deletion even if Cloudinary fails, to avoid orphaned DB records
      }
    }

    // Unlink from jobs but preserve the name and URL for historical purposes
    await Job.updateMany(
      { resumeId: req.params.id, userId: req.userId },
      { resumeId: null }
    );

    // Delete the database record
    await Resume.findByIdAndDelete(req.params.id);

    res.json({ success: true, message: "Deleted successfully" });
  } catch (error) {
    next(error);
  }
});

export default router;
