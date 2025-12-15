// Business logic for creating, updating, querying, and aggregating jobs.
import mongoose from "mongoose";
import Job from "../models/Job.js";

// Helper to create consistent error objects with optional extra details.
const buildError = (message, status = 400, details) => {
  const error = new Error(message);
  error.status = status;
  if (details) {
    error.details = details;
  }
  return error;
};

// Base MongoDB filter to scope all queries to a specific user.
// Mongoose automatically converts string ObjectIds in queries.
const baseQuery = (userId) => ({ userId });

// Create a new job after validating input.
export const createJob = async (userId, payload) => {
  const { company, status } = payload;

  const errors = {};
  if (!company) errors.company = "Company is required";
  if (status && !["Applied", "Interview", "Offer", "Rejected"].includes(status)) {
    errors.status = "Invalid status";
  }

  // If validation fails, throw a structured error consumed by the error handler.
  if (Object.keys(errors).length) {
    throw buildError("Validation failed", 400, errors);
  }

  const job = await Job.create({
    ...payload,
    userId,
    // Default `appliedDate` to now if not provided.
    appliedDate: payload.appliedDate || new Date()
  });

  return job;
};

// Get a paginated list of jobs with optional status and text search filters.
export const getJobs = async (userId, { status, search, page = 1, limit = 10 }) => {
  const query = baseQuery(userId);

  if (status) {
    query.status = status;
  }

  if (search) {
    const pattern = new RegExp(search, "i");
    query.$or = [{ company: pattern }, { role: pattern }];
  }

  const skip = (Math.max(page, 1) - 1) * limit;

  const [jobs, total] = await Promise.all([
    Job.find(query)
      // Sort by appliedDate (descending), but jobs without appliedDate will use createdAt
      // Using a compound sort that handles null values properly
      .sort({ 
        appliedDate: -1, 
        createdAt: -1 
      })
      .skip(skip)
      .limit(limit),
    Job.countDocuments(query)
  ]);

  return { jobs, total };
};

// Fetch a single job belonging to the given user.
export const getJobById = async (userId, jobId) => {
  // Validate ObjectId format before querying
  if (!mongoose.Types.ObjectId.isValid(jobId)) {
    throw buildError("Invalid job ID format", 400);
  }

  const job = await Job.findOne({ _id: jobId, userId });
  if (!job) {
    throw buildError("Job not found", 404);
  }

  return job;
};

// Update fields on an existing job document.
export const updateJob = async (userId, jobId, payload) => {
  // Validate ObjectId format before querying
  if (!mongoose.Types.ObjectId.isValid(jobId)) {
    throw buildError("Invalid job ID format", 400);
  }

  const job = await Job.findOne({ _id: jobId, userId });

  if (!job) {
    throw buildError("Job not found", 404);
  }

  Object.assign(job, payload);
  return job.save();
};

// Delete a job document owned by the user.
export const deleteJob = async (userId, jobId) => {
  // Validate ObjectId format before querying
  if (!mongoose.Types.ObjectId.isValid(jobId)) {
    throw buildError("Invalid job ID format", 400);
  }

  const result = await Job.findOneAndDelete({ _id: jobId, userId });

  if (!result) {
    throw buildError("Job not found", 404);
  }

  return result;
};

// Attach or replace a resume URL for a specific job.
export const attachResume = async (userId, jobId, resumeUrl) => {
  // Validate ObjectId format before querying
  if (!mongoose.Types.ObjectId.isValid(jobId)) {
    throw buildError("Invalid job ID format", 400);
  }

  const job = await Job.findOneAndUpdate(
    { _id: jobId, userId },
    { resumeUrl },
    { new: true }
  );

  if (!job) {
    throw buildError("Job not found", 404);
  }

  return job;
};

// Aggregation: count how many applications were created per month.
export const getMonthlyStats = async (userId) => {
  // Convert string userId to ObjectId for aggregation
  const userObjectId = new mongoose.Types.ObjectId(userId);
  
  const stats = await Job.aggregate([
    { $match: { userId: userObjectId } },
    // Filter out jobs without appliedDate, or use createdAt as fallback
    {
      $addFields: {
        dateToUse: { $ifNull: ["$appliedDate", "$createdAt"] }
      }
    },
    {
      $group: {
        _id: {
          year: { $year: "$dateToUse" },
          month: { $month: "$dateToUse" }
        },
        count: { $sum: 1 }
      }
    },
    { $sort: { "_id.year": -1, "_id.month": -1 } }
  ]);

  return stats;
};

// Aggregation: count jobs and average salaries per status.
export const getSummaryStats = async (userId) => {
  // Convert string userId to ObjectId for aggregation
  const userObjectId = new mongoose.Types.ObjectId(userId);
  
  const result = await Job.aggregate([
    { $match: { userId: userObjectId } },
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
        averageSalary: { $avg: "$salary" }
      }
    }
  ]);

  return result;
};

