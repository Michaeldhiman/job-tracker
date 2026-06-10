import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import app from "../src/app.js";
import mongoose from "mongoose";
import User from "../src/models/User.js";

let token = "";

beforeAll(async () => {
  let mongoUri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/job-tracker-test-jobs";
  
  // Safely isolate test database if running against the primary development URI
  if (mongoUri.includes('/job-crm')) {
    mongoUri = mongoUri.replace('/job-crm', '/job-crm-test-jobs');
  }
  
  await mongoose.connect(mongoUri);
  await User.deleteMany({});
  
  const res = await request(app).post("/api/auth/register").send({
    name: "Test User",
    email: "jobs-test@example.com",
    password: "password123"
  });
  
  token = res.body.token;
});

afterAll(async () => {
  await mongoose.connection.close();
});

describe("Jobs API", () => {
  let jobId = "";

  it("should create a job", async () => {
    const res = await request(app)
      .post("/api/jobs")
      .set("Authorization", `Bearer ${token}`)
      .send({
        company: "Google",
        role: "Software Engineer",
        status: "Applied"
      });

    expect(res.status).toBe(201);
    expect(res.body.job).toHaveProperty("_id");
    jobId = res.body.job._id;
  });

  it("should get jobs", async () => {
    const res = await request(app)
      .get("/api/jobs")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.jobs)).toBe(true);
    expect(res.body.jobs.length).toBeGreaterThan(0);
  });
});
