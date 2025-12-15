// Helpers for working with paths relative to the backend root directory.
import path from "path";
import { fileURLToPath } from "url";

// Convert the current module URL to a filesystem path.
const currentFilePath = fileURLToPath(import.meta.url);
const utilsDir = path.dirname(currentFilePath); // backend/src/utils

// `backendRoot` points to the root of the backend project (two levels up from `utils`).
const backendRoot = path.resolve(utilsDir, "../..");




// Convenience helper for building absolute paths from the backend root.
export const resolveFromBackend = (...segments) =>
  path.join(backendRoot, ...segments);

// Shared absolute path to the uploads directory.
export const uploadsDir = resolveFromBackend("uploads");

