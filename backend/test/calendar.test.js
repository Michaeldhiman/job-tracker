import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import app from "../src/app.js";
import mongoose from "mongoose";
import User from "../src/models/User.js";
import Event from "../src/models/Event.js";

let token = "";
let userId = "";

beforeAll(async () => {
  let mongoUri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/job-tracker-test-calendar";
  
  if (mongoUri.includes('/job-crm')) {
    mongoUri = mongoUri.replace('/job-crm', '/job-crm-test-calendar');
  }
  
  await mongoose.connect(mongoUri);
  await User.deleteMany({});
  await Event.deleteMany({});
  
  const res = await request(app).post("/api/auth/register").send({
    name: "Test User",
    email: "calendar-test@example.com",
    password: "password123"
  });
  
  token = res.body.token;
  userId = res.body.user.id;
});

afterAll(async () => {
  await mongoose.connection.close();
});

describe("Calendar Events API", () => {
  let eventId = "";

  it("should create a custom event in the database", async () => {
    const res = await request(app)
      .post("/api/calendar/events")
      .set("Authorization", `Bearer ${token}`)
      .send({
        title: "Technical Interview with Stripe",
        company: "Stripe",
        interviewRound: "Technical",
        date: "2026-06-15",
        startTime: "14:00",
        endTime: "15:00",
        location: "Zoom",
        meetingLink: "https://zoom.us/j/123456",
        description: "Coding prep on graphs and trees."
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.event).toHaveProperty("_id");
    expect(res.body.event.title).toBe("Technical Interview with Stripe");
    expect(res.body.event.syncStatus).toBe("pending"); // pending because google calendar is not connected for this test user
    
    eventId = res.body.event._id;
  });

  it("should fetch custom events list for the user", async () => {
    const res = await request(app)
      .get("/api/calendar/events")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.events)).toBe(true);
    expect(res.body.events.length).toBe(1);
    expect(res.body.events[0]._id).toBe(eventId);
  });

  it("should update a custom event details", async () => {
    const res = await request(app)
      .put(`/api/calendar/events/${eventId}`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        title: "Stripe System Design Interview",
        company: "Stripe",
        interviewRound: "System Design",
        date: "2026-06-15",
        startTime: "15:30",
        endTime: "16:30",
        location: "Google Meet",
        meetingLink: "https://meet.google.com/abc-def-ghi",
        description: "Updated prep for microservices."
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.event.title).toBe("Stripe System Design Interview");
    expect(res.body.event.startTime).toBe("15:30");
  });

  it("should delete a custom event", async () => {
    const deleteRes = await request(app)
      .delete(`/api/calendar/events/${eventId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(deleteRes.status).toBe(200);
    expect(deleteRes.body.success).toBe(true);

    const getRes = await request(app)
      .get("/api/calendar/events")
      .set("Authorization", `Bearer ${token}`);

    expect(getRes.status).toBe(200);
    expect(getRes.body.events.length).toBe(0);
  });
});
