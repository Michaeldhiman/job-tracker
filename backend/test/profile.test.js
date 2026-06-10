import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import app from "../src/app.js";
import mongoose from "mongoose";
import User from "../src/models/User.js";

let token = "";
let userId = "";

beforeAll(async () => {
  let mongoUri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/job-tracker-test-profile";
  
  if (mongoUri.includes('/job-crm')) {
    mongoUri = mongoUri.replace('/job-crm', '/job-crm-test-profile');
  }
  
  await mongoose.connect(mongoUri);
  await User.deleteMany({});
  
  const res = await request(app).post("/api/auth/register").send({
    name: "Test User",
    email: "profile-test@example.com",
    password: "password123"
  });
  
  token = res.body.token;
  userId = res.body.user.id;
});

afterAll(async () => {
  await mongoose.connection.close();
});

describe("Profile and Preferences API", () => {
  it("should get current profile", async () => {
    const res = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.user).toHaveProperty("email", "profile-test@example.com");
    expect(res.body.user.emailNotifs).toBe(true);
    expect(res.body.user.interviewReminders).toBe(true);
    expect(res.body.user.weeklyDigest).toBe(false);
  });

  it("should update profile preferences and persist them", async () => {
    // Toggle preferences
    const updateRes = await request(app)
      .put("/api/auth/profile")
      .set("Authorization", `Bearer ${token}`)
      .send({
        emailNotifs: false,
        interviewReminders: false,
        weeklyDigest: true,
        theme: "dark"
      });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.success).toBe(true);
    expect(updateRes.body.user.emailNotifs).toBe(false);
    expect(updateRes.body.user.interviewReminders).toBe(false);
    expect(updateRes.body.user.weeklyDigest).toBe(true);
    expect(updateRes.body.user.theme).toBe("dark");

    // Fetch again to verify persistence
    const getRes = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${token}`);

    expect(getRes.status).toBe(200);
    // Since getCurrentUser returns raw user (un-sanitized), check properties on it
    const dbUser = getRes.body.user;
    expect(dbUser.emailNotifs).toBe(false);
    expect(dbUser.interviewReminders).toBe(false);
    expect(dbUser.weeklyDigest).toBe(true);
    expect(dbUser.theme).toBe("dark");
  });
});
