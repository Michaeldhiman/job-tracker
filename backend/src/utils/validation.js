import { z } from "zod";

export const jobSchemaZod = z.object({
  company: z.string().min(2, "Company name must be at least 2 characters"),
  role: z.string().min(2, "Role must be at least 2 characters"),
  status: z.enum(["Wishlist", "Applied", "OA", "Screening", "Technical", "HR", "Offer", "Rejected"]).optional(),
  appliedDate: z.string().or(z.date()).optional().nullable().or(z.literal("")),
  source: z.enum(["LinkedIn", "Naukri", "Referral", "Career Page", "Indeed", "Internshala", "Other"]).optional(),
  priority: z.enum(["Low", "Medium", "High"]).optional(),
  location: z.string().optional(),
  salary: z.number().or(z.string().transform(Number)).optional(),
  recruiterName: z.string().optional(),
  recruiterEmail: z.string().email("Invalid email").optional().or(z.literal("")),
  jobUrl: z.string().url("Invalid URL").optional().or(z.literal("")),
  followUpDate: z.string().or(z.date()).optional(),
  interviewDate: z.string().or(z.date()).optional(),
  tags: z.array(z.string()).or(z.string().transform(str => str.split(";").map(s => s.trim()))).optional(),
  notes: z.string().optional(),
  resumeId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid resume ID").optional().or(z.literal("")).nullable(),
  resumeName: z.string().optional().or(z.literal("")).nullable(),
  resumeUrl: z.string().url("Invalid URL").optional().or(z.literal("")).nullable()
});

export const validateRequest = (schema) => (req, res, next) => {
  try {
    req.body = schema.parse(req.body);
    next();
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Validation Error",
      errors: error.errors
    });
  }
};
