import { Router } from "express";
import { sendEmail } from "../services/emailService.js";
import { config, requireConfig } from "../config/runtimeConfig.js";

const router = Router();

router.post("/", async (req, res, next) => {
  try {
    const { name, email, subject, message } = req.body;
    
    if (!name || !email || !subject || !message) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    // Send notification email using Resend, or mock log if not configured.
    await sendEmail({
      to: requireConfig(config.contactEmail, "CONTACT_EMAIL"),
      subject: `[Contact Form] ${subject} - from ${name}`,
      text: `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`,
      html: `
        <h3>New Contact Form Submission</h3>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Subject:</strong> ${subject}</p>
        <p><strong>Message:</strong></p>
        <p>${message.replace(/\n/g, '<br/>')}</p>
      `
    });

    res.status(200).json({ success: true, message: "Contact message sent successfully" });
  } catch (error) {
    next(error);
  }
});

export default router;
