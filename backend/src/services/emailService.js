import { Resend } from "resend";
import { requireConfig } from "../config/runtimeConfig.js";

const apiKey = process.env.RESEND_API_KEY;
const fromAddress = process.env.RESEND_FROM;

// Initialize Resend client only when API key is provided.
// Without a key the service falls back to console mock mode — safe for local dev.
let resend = null;
if (apiKey) {
  requireConfig(fromAddress, "RESEND_FROM");
  resend = new Resend(apiKey);
  console.log("[Email Service] Resend client initialized.");
} else {
  console.log("[Email Service] Running in Console Logging (Mock) mode. Set RESEND_API_KEY for real emails.");
}

/**
 * Core dispatch function — sends via Resend or falls back to mock logging.
 * @param {Object} options
 * @param {string} options.to       - Recipient email address
 * @param {string} options.subject  - Email subject line
 * @param {string} options.html     - HTML body
 * @param {string} [options.text]   - Plain-text fallback
 */
export const sendEmail = async ({ to, subject, html, text }) => {
  if (resend) {
    try {
      const { data, error } = await resend.emails.send({
        from: fromAddress,
        to,
        subject,
        html,
        text,
      });
      if (error) {
        console.error(`[Email Service] Resend error sending to ${to}:`, error);
        throw new Error(error.message);
      }
      console.log(`[Email Service] Sent: ${data.id} to ${to}`);
      return data;
    } catch (err) {
      console.error(`[Email Service] Failed to send email to ${to}:`, err);
      throw err;
    }
  } else {
    // Mock mode — log to console so dev/CI runs without real credentials
    console.log(`
=========================================
[EMAIL SERVICE - MOCK NOTIFICATION]
To:      ${to}
Subject: ${subject}
-----------------------------------------
${text || html}
=========================================
    `);
    return { mock: true, id: `mock_${Date.now()}` };
  }
};

// ─── Interview Email Templates ─────────────────────────────────────────────

/**
 * Send a 24-hour interview reminder email.
 * @param {Object} opts
 * @param {string} opts.to      - Recipient email
 * @param {string} opts.name    - Recipient name
 * @param {string} opts.company - Company name
 * @param {string} opts.role    - Job role / position
 * @param {string} opts.date    - Formatted interview date (e.g. "June 15, 2026")
 * @param {string} opts.time    - Formatted interview time (e.g. "10:00 AM")
 */
export const sendInterview24HourReminder = async ({ to, name, company, role, date, time }) => {
  const subject = `Interview Tomorrow: ${company}`;
  const text = `Hi ${name},\n\nYou have an upcoming interview tomorrow.\n\nCompany: ${company}\nRole: ${role}\nDate: ${date}\nTime: ${time}\n\nGood luck with your interview.\n\nBest,\nSnap Job Team`;
  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#09090b;font-family:Inter,Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#09090b;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background-color:#121214;border:1px solid rgba(255,255,255,0.08);border-radius:16px;overflow:hidden;max-width:600px;">
        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#4f46e5,#10b981);padding:32px 40px;text-align:center;">
            <p style="margin:0;font-size:13px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:rgba(255,255,255,0.8);">SNAP JOB</p>
            <h1 style="margin:12px 0 0;font-size:26px;font-weight:800;color:#ffffff;">Interview Tomorrow</h1>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:40px;">
            <p style="margin:0 0 24px;font-size:16px;color:#e3e1ec;">Hi <strong>${name}</strong>,</p>
            <p style="margin:0 0 28px;font-size:15px;line-height:1.6;color:#a1a1aa;">You have an upcoming interview <strong style="color:#e3e1ec;">tomorrow</strong>. Here are the details:</p>
            <!-- Details Card -->
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#1c1c1f;border:1px solid rgba(255,255,255,0.06);border-radius:12px;margin-bottom:32px;">
              <tr><td style="padding:28px 32px;">
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding:8px 0;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#71717a;width:80px;">Company</td>
                    <td style="padding:8px 0;font-size:15px;font-weight:600;color:#e3e1ec;">${company}</td>
                  </tr>
                  <tr>
                    <td style="padding:8px 0;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#71717a;">Role</td>
                    <td style="padding:8px 0;font-size:15px;font-weight:600;color:#e3e1ec;">${role}</td>
                  </tr>
                  <tr>
                    <td style="padding:8px 0;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#71717a;">Date</td>
                    <td style="padding:8px 0;font-size:15px;font-weight:600;color:#e3e1ec;">${date}</td>
                  </tr>
                  <tr>
                    <td style="padding:8px 0;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#71717a;">Time</td>
                    <td style="padding:8px 0;font-size:15px;font-weight:600;color:#4f46e5;">${time}</td>
                  </tr>
                </table>
              </td></tr>
            </table>
            <p style="margin:0 0 32px;font-size:15px;line-height:1.6;color:#a1a1aa;">Take some time tonight to review the job description, research the company, and prepare your key talking points. You've got this!</p>
            <p style="margin:0;font-size:14px;color:#71717a;">Good luck with your interview.<br><strong style="color:#a1a1aa;">Snap Job Team</strong></p>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="padding:20px 40px;border-top:1px solid rgba(255,255,255,0.06);text-align:center;">
            <p style="margin:0;font-size:11px;color:#52525b;">You're receiving this because you enabled interview reminders in Snap Job.<br>Manage your preferences in <a href="#" style="color:#4f46e5;text-decoration:none;">Settings</a>.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  return sendEmail({ to, subject, html, text });
};

/**
 * Send a 1-hour interview reminder email.
 * @param {Object} opts
 * @param {string} opts.to      - Recipient email
 * @param {string} opts.name    - Recipient name
 * @param {string} opts.company - Company name
 * @param {string} opts.role    - Job role / position
 * @param {string} opts.time    - Formatted interview time (e.g. "10:00 AM")
 */
export const sendInterview1HourReminder = async ({ to, name, company, role, time }) => {
  const subject = `Interview Starting Soon: ${company}`;
  const text = `Hi ${name},\n\nYour interview begins in 1 hour.\n\nCompany: ${company}\nRole: ${role}\nTime: ${time}\n\nBest of luck.\n\nSnap Job Team`;
  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#09090b;font-family:Inter,Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#09090b;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background-color:#121214;border:1px solid rgba(255,255,255,0.08);border-radius:16px;overflow:hidden;max-width:600px;">
        <!-- Header — amber urgency color -->
        <tr>
          <td style="background:linear-gradient(135deg,#f59e0b,#ef4444);padding:32px 40px;text-align:center;">
            <p style="margin:0;font-size:13px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:rgba(255,255,255,0.8);">SNAP JOB</p>
            <h1 style="margin:12px 0 0;font-size:26px;font-weight:800;color:#ffffff;">Starting in 1 Hour</h1>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:40px;">
            <p style="margin:0 0 24px;font-size:16px;color:#e3e1ec;">Hi <strong>${name}</strong>,</p>
            <p style="margin:0 0 28px;font-size:15px;line-height:1.6;color:#a1a1aa;">Your interview is <strong style="color:#f59e0b;">starting in 1 hour</strong>. Time to get ready!</p>
            <!-- Details Card -->
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#1c1c1f;border:1px solid rgba(255,255,255,0.06);border-radius:12px;margin-bottom:32px;">
              <tr><td style="padding:28px 32px;">
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding:8px 0;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#71717a;width:80px;">Company</td>
                    <td style="padding:8px 0;font-size:15px;font-weight:600;color:#e3e1ec;">${company}</td>
                  </tr>
                  <tr>
                    <td style="padding:8px 0;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#71717a;">Role</td>
                    <td style="padding:8px 0;font-size:15px;font-weight:600;color:#e3e1ec;">${role}</td>
                  </tr>
                  <tr>
                    <td style="padding:8px 0;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#71717a;">Time</td>
                    <td style="padding:8px 0;font-size:17px;font-weight:800;color:#f59e0b;">${time}</td>
                  </tr>
                </table>
              </td></tr>
            </table>
            <p style="margin:0 0 32px;font-size:15px;line-height:1.6;color:#a1a1aa;">Take a deep breath, stay confident, and remember — you prepared for this. Best of luck!</p>
            <p style="margin:0;font-size:14px;color:#71717a;"><strong style="color:#a1a1aa;">Snap Job Team</strong></p>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="padding:20px 40px;border-top:1px solid rgba(255,255,255,0.06);text-align:center;">
            <p style="margin:0;font-size:11px;color:#52525b;">You're receiving this because you enabled interview reminders in Snap Job.<br>Manage your preferences in <a href="#" style="color:#4f46e5;text-decoration:none;">Settings</a>.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  return sendEmail({ to, subject, html, text });
};
