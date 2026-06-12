// HTTP handlers for job CRUD, file upload, statistics, and CSV export.
import {
  createJob,
  getJobs,
  getJobById,
  updateJob,
  deleteJob,
  attachResume,
  getMonthlyStats,
  getSummaryStats
} from "../services/jobService.js";
import { generateCsv } from "../utils/csvUtil.js";
import { uploadToCloudinary } from "../fileUpload/cloudinary.js";
import csvParser from "csv-parser";
import { Readable } from "stream";

// POST /api/jobs
// Creates a new job record for the authenticated user.
export const createJobHandler = async (req, res, next) => {
  try {
    const job = await createJob(req.userId, req.body);
    res.status(201).json({ job });
  } catch (error) {
    next(error);
  }
};

// GET /api/jobs
// Returns a paginated list of jobs filtered by status/search query params.
export const getJobsHandler = async (req, res, next) => {
  try {
    const { status, search } = req.query;
    const { page, limit } = req.pagination || { page: 1, limit: 10 };
    const result = await getJobs(req.userId, {
      status,
      search,
      page,
      limit
    });
    res.json(result);
  } catch (error) {
    next(error);
  }
};

// GET /api/jobs/:id
// Fetch a single job document owned by the authenticated user.
export const getJobHandler = async (req, res, next) => {
  try {
    const job = await getJobById(req.userId, req.params.id);
    res.json({ job });
  } catch (error) {
    next(error);
  }
};

// PUT /api/jobs/:id
// Update fields on a job document.
export const updateJobHandler = async (req, res, next) => {
  try {
    const job = await updateJob(req.userId, req.params.id, req.body);
    res.json({ job });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/jobs/:id
// Permanently removes a job document.
export const deleteJobHandler = async (req, res, next) => {
  try {
    await deleteJob(req.userId, req.params.id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

// POST /api/jobs/:id/resume
// Attach a resume URL or upload file to Cloudinary and save URL to a job.
export const uploadResumeHandler = async (req, res, next) => {
  try {
    // Client must send either `resumeUrl` in body or a file named "resume".
    if (!req.file && !req.body.resumeUrl) {
      const err = new Error("Validation failed");
      err.status = 400;
      err.details = { resume: "Resume file or URL is required" };
      throw err;
    }

    let resumeUrl = req.body.resumeUrl;

    // If a file was uploaded, upload it to Cloudinary using the buffer.
    if (req.file) {
      try {
        // Upload the file buffer to Cloudinary.
        const { url } = await uploadToCloudinary(
          req.file.buffer,
          req.file.originalname
        );
        resumeUrl = url;
      } catch (cloudinaryError) {
        const err = new Error("Failed to upload file to Cloudinary");
        err.status = 500;
        err.details = { cloudinary: cloudinaryError.message };
        throw err;
      }
    }

    // Save the Cloudinary URL (or provided URL) to the database.
    const job = await attachResume(req.userId, req.params.id, resumeUrl);
    res.json({ job });
  } catch (error) {
    next(error);
  }
};

// GET /api/jobs/stats/monthly
// Aggregated count of jobs created per month.
export const getMonthlyStatsHandler = async (req, res, next) => {
  try {
    const stats = await getMonthlyStats(req.userId);
    res.json({ stats });
  } catch (error) {
    next(error);
  }
};

// GET /api/jobs/stats/summary
// Aggregated stats per status (Applied / Interview / Offer / Rejected).
export const getSummaryStatsHandler = async (req, res, next) => {
  try {
    const stats = await getSummaryStats(req.userId);
    res.json({ stats });
  } catch (error) {
    next(error);
  }
};

// GET /api/jobs/export
// Returns a CSV file containing up to 1000 jobs that match optional filters.
export const exportJobsHandler = async (req, res, next) => {
  try {
    const { jobs } = await getJobs(req.userId, {
      status: req.query.status,
      search: req.query.search,
      limit: 1000
    });

    const csv = await generateCsv(jobs);
    
    // Add UTF-8 BOM for proper Excel encoding
    const bom = '\uFEFF';
    const csvWithBom = bom + csv;

    res.setHeader("Content-Type", "text/csv;charset=utf-8");
    res.setHeader("Content-Disposition", "attachment; filename=jobs.csv");
    res.send(csvWithBom);
  } catch (error) {
    next(error);
  }
};

// POST /api/jobs/import
// Import jobs from CSV
export const importJobsHandler = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "CSV file is required" });
    }

    const results = [];
    const stream = Readable.from(req.file.buffer);

    stream
      .pipe(csvParser())
      .on("data", (data) => results.push(data))
      .on("end", async () => {
        try {
          const summary = {
            totalRows: results.length,
            successfulImports: 0,
            failedImports: 0,
            errors: []
          };

          for (let i = 0; i < results.length; i++) {
            const row = results[i];
            try {
              // Basic validation
              if (!row.company || row.company.length < 2) throw new Error("Invalid company");
              if (!row.role || row.role.length < 2) throw new Error("Invalid role");
              
              const payload = {
                company: row.company,
                role: row.role,
                status: row.status || "Applied",
                appliedDate: row.appliedDate ? new Date(row.appliedDate) : new Date(),
                source: row.source || "Other",
                priority: row.priority || "Medium",
                location: row.location,
                salary: row.salary ? Number(row.salary) : undefined,
                recruiterName: row.recruiterName,
                recruiterEmail: row.recruiterEmail,
                jobUrl: row.jobUrl,
                followUpDate: row.followUpDate ? new Date(row.followUpDate) : undefined,
                interviewDate: row.interviewDate ? new Date(row.interviewDate) : undefined,
                tags: row.tags ? row.tags.split(";").map(t => t.trim()) : [],
                notes: row.notes
              };

              await createJob(req.userId, payload);
              summary.successfulImports++;
            } catch (err) {
              summary.failedImports++;
              summary.errors.push({ row: i + 2, error: err.message });
            }
          }

          res.status(200).json({ success: true, summary });
        } catch (error) {
          next(error);
        }
      });
  } catch (error) {
    next(error);
  }
};

