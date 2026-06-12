// Cloudinary configuration for uploading files.
import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";
import { config } from "../config/runtimeConfig.js";

// Load environment variables.
dotenv.config();

// Configure Cloudinary with credentials from environment variables.
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

/**
 * Upload a file buffer to Cloudinary.
 * @param {Buffer} fileBuffer - The file buffer from Multer.
 * @param {string} originalName - The original filename.
 * @param {string} folder - Optional folder name in Cloudinary (default: 'resumes').
 * @returns {Promise<{url: string, public_id: string}>} The Cloudinary URL and public ID.
 */
export const uploadToCloudinary = async (fileBuffer, originalName, folder = config.upload.resumeFolder) => {
  return await new Promise((resolve, reject) => {
    // Create a unique filename with timestamp.
    const timestamp = Date.now();
    const safeName = originalName.replace(/\s+/g, "-").replace(/[^a-zA-Z0-9.-]/g, "");
    
    // Pass only the unique base name without folder prefix since 'folder' option is set.
    const baseName = `${timestamp}-${safeName}`.split(".")[0];

    // Convert buffer to data URI format for Cloudinary.
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: "auto", // Automatically detect file type (PDF, DOC, etc.)
        folder: folder,
        public_id: baseName, // Cloudinary handles extensions automatically
        overwrite: false
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve({
            url: result.secure_url,
            public_id: result.public_id
          });
        }
      }
    );

    // Write the buffer to the upload stream.
    uploadStream.end(fileBuffer);
  });
};

/**
 * Delete a resource from Cloudinary by its public ID.
 * @param {string} publicId - The Cloudinary public ID of the resource.
 * @returns {Promise<any>} The result of the deletion.
 */
export const deleteFromCloudinary = async (publicId) => {
  if (!publicId) return null;
  return new Promise((resolve, reject) => {
    cloudinary.uploader.destroy(publicId, (error, result) => {
      if (error) {
        reject(error);
      } else {
        resolve(result);
      }
    });
  });
};

export default cloudinary;

