// Business logic for creating, updating, querying, and aggregating jobs.
import mongoose from "mongoose";
import Job from "../models/Job.js";
import ActivityLog from "../models/ActivityLog.js";
import Event from "../models/Event.js";
import User from "../models/User.js";
import { createGoogleEvent, updateGoogleEvent, deleteGoogleEvent } from "./googleCalendarService.js";

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

import { PIPELINE_STATUSES } from "../config/constants.js";

// Create a new job after validating input.
export const createJob = async (userId, payload) => {
  const { company, status } = payload;

  const errors = {};
  if (!company) errors.company = "Company is required";
  if (status && !PIPELINE_STATUSES.includes(status)) {
    errors.status = "Invalid status";
  }

  // If validation fails, throw a structured error consumed by the error handler.
  if (Object.keys(errors).length) {
    throw buildError("Validation failed", 400, errors);
  }

  // Always assign an applied date if not provided since Wishlist is removed
  const initialAppliedDate = payload.appliedDate || new Date();

  const job = await Job.create({
    ...payload,
    userId,
    appliedDate: initialAppliedDate
  });

  try {
    await syncJobEvents(job);
  } catch (err) {
    console.error("Failed to sync calendar events during createJob:", err);
  }

  try {
    await ActivityLog.create({
      userId,
      jobId: job._id,
      action: "Job Added",
      details: `Added application for ${job.role} at ${job.company}`
    });
  } catch (err) {
    console.error("Failed to create ActivityLog for createJob:", err);
  }

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
      .populate("resumeId")
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

  const job = await Job.findOne({ _id: jobId, userId }).populate("resumeId");
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

  const oldStatus = job.status;

  Object.assign(job, payload);
  const savedJob = await job.save();

  try {
    await syncJobEvents(savedJob);
  } catch (err) {
    console.error("Failed to sync calendar events during updateJob:", err);
  }

  try {
    if (payload.status && payload.status !== oldStatus) {
      await ActivityLog.create({
        userId,
        jobId: savedJob._id,
        action: "Status Updated",
        details: `Moved ${savedJob.role} at ${savedJob.company} to ${payload.status}`
      });
    } else {
      await ActivityLog.create({
        userId,
        jobId: savedJob._id,
        action: "Job Updated",
        details: `Updated details for ${savedJob.role} at ${savedJob.company}`
      });
    }
  } catch (err) {
    console.error("Failed to create ActivityLog for updateJob:", err);
  }

  return savedJob.populate("resumeId");
};

// Delete a job document owned by the user.
export const deleteJob = async (userId, jobId) => {
  // Validate ObjectId format before querying
  if (!mongoose.Types.ObjectId.isValid(jobId)) {
    throw buildError("Invalid job ID format", 400);
  }

  const job = await Job.findOne({ _id: jobId, userId });
  if (!job) {
    throw buildError("Job not found", 404);
  }

  // Delete all events associated with this job
  try {
    const events = await Event.find({ jobId });
    const user = await User.findById(userId);
    const isGCalConnected = user?.googleCalendarConnected;

    for (const event of events) {
      if (isGCalConnected && event.googleEventId && user.calendarSyncCancellations !== false) {
        try {
          await deleteGoogleEvent(userId, event.googleEventId);
        } catch (err) {
          console.error(`Failed to delete Google event ${event.googleEventId} during job deletion:`, err.message);
        }
      }
      await Event.deleteOne({ _id: event._id });
    }
  } catch (err) {
    console.error("Error cleaning up job calendar events during deletion:", err);
  }

  await Job.deleteOne({ _id: jobId });

  try {
    await ActivityLog.create({
      userId,
      action: "Job Deleted",
      details: `Removed application for ${job.role} at ${job.company}`
    });
  } catch (err) {
    console.error("Failed to create ActivityLog for deleteJob:", err);
  }

  return job;
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

  try {
    await ActivityLog.create({
      userId,
      jobId: job._id,
      action: "Resume Attached",
      details: `Attached resume to ${job.role} at ${job.company}`
    });
  } catch (err) {
    console.error("Failed to create ActivityLog for attachResume:", err);
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

export const syncJobEvents = async (job) => {
  const userId = job.userId;
  const user = await User.findById(userId);
  const isGCalConnected = user?.googleCalendarConnected;

  const mappings = [
    {
      field: "interviewDate",
      sourceField: "interviewDate",
      type: "interview",
      title: `${job.company} - Interview (${job.role})`,
      getDefaultTimes: (date) => {
        const d = new Date(date);
        const start = d.toTimeString().substring(0, 5); // HH:MM
        const endD = new Date(d.getTime() + 60 * 60 * 1000);
        const end = endD.toTimeString().substring(0, 5);
        return { start, end };
      }
    },
    {
      field: "followUpDate",
      sourceField: "followUpDate",
      type: "followUp",
      title: `${job.company} - Follow-up (${job.role})`,
      getDefaultTimes: () => ({ start: "09:00", end: "10:00" })
    },
    {
      field: "assessmentDeadline",
      sourceField: "assessmentDeadline",
      type: "assessment",
      title: `${job.company} - Assessment Deadline (${job.role})`,
      getDefaultTimes: () => ({ start: "09:00", end: "10:00" })
    },
    {
      field: "offerDeadline",
      sourceField: "offerDeadline",
      type: "offer",
      title: `${job.company} - Offer Deadline (${job.role})`,
      getDefaultTimes: () => ({ start: "09:00", end: "10:00" })
    }
  ];

  for (const map of mappings) {
    const jobDateVal = job[map.field];
    // Use sourceField as the canonical lookup key for deduplication.
    // $or handles backward compatibility: old events only have eventType set,
    // new events use sourceField. Without $or, upgrading would create duplicates.
    let event = await Event.findOne({
      jobId: job._id,
      $or: [
        { sourceField: map.sourceField },
        { eventType: map.type }
      ]
    });

    if (jobDateVal) {
      // Fix: use UTC-safe date extraction to avoid timezone shifts.
      // Wrap in new Date() first — Mongoose may return a string for date fields
      // set via certain API payloads, and .toISOString() only exists on Date.
      const d = new Date(jobDateVal);
      const datePart = new Date(d.toISOString().slice(0, 10) + "T00:00:00.000Z");
      const { start, end } = map.getDefaultTimes(jobDateVal);

      if (event) {
        let changed = false;
        if (event.title !== map.title) { event.title = map.title; changed = true; }
        if (event.company !== job.company) { event.company = job.company; changed = true; }
        if (new Date(event.date).getTime() !== datePart.getTime()) { event.date = datePart; changed = true; }
        if (event.startTime !== start) { event.startTime = start; changed = true; }
        if (event.endTime !== end) { event.endTime = end; changed = true; }

        if (changed) {
          event.syncStatus = "pending";
          if (isGCalConnected && event.googleEventId) {
            try {
              if (user.calendarSyncUpdates !== false) {
                await updateGoogleEvent(userId, event.googleEventId, event, user);
                event.syncStatus = "synced";
              }
            } catch (err) {
              console.error(`[syncJobEvents] GCal update failed for event ${event._id}:`, err.message);
              event.syncStatus = "failed";
            }
          }
          await event.save();
        }
      } else {
        event = new Event({
          userId,
          jobId: job._id,
          eventType: map.type,
          source: "job",
          sourceField: map.sourceField,
          title: map.title,
          company: job.company,
          date: datePart,
          startTime: start,
          endTime: end,
          syncStatus: "pending"
        });

        if (isGCalConnected && user.calendarAutoCreate !== false) {
          try {
            const googleEventId = await createGoogleEvent(userId, event, user);
            event.googleEventId = googleEventId;
            event.syncStatus = "synced";
          } catch (err) {
            console.error(`[syncJobEvents] GCal create failed for event ${event._id}:`, err.message);
            event.syncStatus = "failed";
          }
        }
        await event.save();
      }
    } else {
      if (event) {
        if (isGCalConnected && event.googleEventId && user.calendarSyncCancellations !== false) {
          try {
            await deleteGoogleEvent(userId, event.googleEventId);
          } catch (err) {
            console.error(`[syncJobEvents] GCal delete failed for event ${event._id}:`, err.message);
          }
        }
        await Event.deleteOne({ _id: event._id });
      }
    }
  }
};

