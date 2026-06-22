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
  });

  it("should update profile preferences and persist them", async () => {
    // Toggle preferences
    const updateRes = await request(app)
      .put("/api/auth/profile")
      .set("Authorization", `Bearer ${token}`)
      .send({
        emailNotifs: false,
        interviewReminders: false,
        theme: "dark"
      });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.success).toBe(true);
    expect(updateRes.body.user.emailNotifs).toBe(false);
    expect(updateRes.body.user.interviewReminders).toBe(false);
    expect(updateRes.body.user.theme).toBe("dark");

    // Fetch again to verify persistence
    const getRes = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${token}`);

    expect(getRes.status).toBe(200);
    const dbUser = getRes.body.user;
    expect(dbUser.emailNotifs).toBe(false);
    expect(dbUser.interviewReminders).toBe(false);
    expect(dbUser.theme).toBe("dark");
  });

  it("should fail to change password with incorrect current password", async () => {
    const res = await request(app)
      .put("/api/auth/profile")
      .set("Authorization", `Bearer ${token}`)
      .send({
        currentPassword: "wrongpassword",
        newPassword: "newpassword123"
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toContain("Incorrect current password");
  });

  it("should fail to change password with short new password", async () => {
    const res = await request(app)
      .put("/api/auth/profile")
      .set("Authorization", `Bearer ${token}`)
      .send({
        currentPassword: "password123",
        newPassword: "123"
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toContain("New password must be at least 6 characters long");
  });

  it("should successfully change password with valid details", async () => {
    const res = await request(app)
      .put("/api/auth/profile")
      .set("Authorization", `Bearer ${token}`)
      .send({
        currentPassword: "password123",
        newPassword: "newpassword123"
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    // Verify login with new password
    const loginRes = await request(app)
      .post("/api/auth/login")
      .send({
        email: "profile-test@example.com",
        password: "newpassword123"
      });

    expect(loginRes.status).toBe(200);
    expect(loginRes.body.token).toBeDefined();
  });
});
