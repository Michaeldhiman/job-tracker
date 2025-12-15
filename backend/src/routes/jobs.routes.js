// Job routes: CRUD operations, stats, resume upload, and CSV export.
import { Router } from "express";
import auth from "../middleware/auth.js";
import {
  createJobHandler,
  getJobsHandler,
  getJobHandler,
  updateJobHandler,
  deleteJobHandler,
  uploadResumeHandler,
  getMonthlyStatsHandler,
  getSummaryStatsHandler,
  exportJobsHandler
} from "../controllers/jobsController.js";

import upload from "../fileUpload/multerConfig.js";

const router = Router();

// All job routes require the user to be authenticated.
router.use(auth);

// Specific routes first (before generic /api/jobs routes)
// Aggregated stats endpoints.
router.get("/stats/monthly", getMonthlyStatsHandler);
router.get("/stats/summary", getSummaryStatsHandler);

// Export filtered jobs as CSV.
router.get("/export", exportJobsHandler);

// /api/jobs -> create and list operations.
router.route("/").post(createJobHandler).get(getJobsHandler);

// /api/jobs/:id -> get, update, and delete a single job.
router
  .route("/:id")
  .get(getJobHandler)
  .put(updateJobHandler)
  .delete(deleteJobHandler);

// Upload a resume file (field name: "resume") or attach a URL to a job.
router.post("/:id/resume", upload.single("resume"), uploadResumeHandler);

export default router;


