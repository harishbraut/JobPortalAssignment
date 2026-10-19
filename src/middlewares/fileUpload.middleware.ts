import multer from "multer";

// memoryStorage: multer keeps the uploaded file in RAM (req.file.buffer) instead
// of writing it to disk. The controller then sends it to Cloudinary, so nothing
// is stored on this server and nothing is lost when the server restarts.
const storage = multer.memoryStorage();

// Resumes: PDF only, up to 4 MB. Used on POST /jobs/:jobId/apply.
// (Vercel rejects any request over 4.5 MB, so 5 MB would never work there.)
export const uploadResume = multer({
  storage,
  limits: { fileSize: 4 * 1024 * 1024 },          // 4 MB max
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/pdf") {
      cb(null, true);                              // accept
    } else {
      cb(new Error("only PDF files are allowed")); // reject
    }
  },
});

// Company logos: common image types only, up to 2 MB. Used on POST /addJob.
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/svg"];

export const uploadCompanyLogo = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 },          // 2 MB is plenty for a logo
  fileFilter: (req, file, cb) => {
    if (ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("only JPEG, PNG or WEBP images are allowed"));
    }
  },
});
