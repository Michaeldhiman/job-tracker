// Multer configuration for handling resume uploads in memory (for Cloudinary).
import multer from "multer";

// Use memory storage to keep files in memory as buffers.
// This is recommended when uploading to cloud storage like Cloudinary.
const storage = multer.memoryStorage();

// Only accept PDF or Word document MIME types.
const fileFilter = (_req, file, cb) => {
  const allowed = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ];

  if (!allowed.includes(file.mimetype)) {
    return cb(new Error("Only PDF or Word documents are allowed"));
  }

  cb(null, true);
};

// Export a preconfigured Multer instance capped at 5 MB per file.
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter
});

export default upload;


