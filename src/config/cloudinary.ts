import { v2 as cloudinary, type UploadApiOptions, type UploadApiResponse } from "cloudinary";
import { env } from "./env.js";

cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
    secure: true,   // always give back https:// URLs
});

// Turns "My CV (final).pdf" into "My_CV__final_.pdf" so it is safe in a URL.
function safeName(originalName: string): string {
    return originalName.replace(/[^a-zA-Z0-9.]/g, "_");
}

// Uploads a file that multer kept in memory (file.buffer) and returns
// Cloudinary's answer (secure_url, public_id, ...).
function uploadBuffer(buffer: Buffer, options: UploadApiOptions): Promise<UploadApiResponse> {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(options, (error, result) => {
            if (error || !result) return reject(error ?? new Error("upload failed"));
            resolve(result);
        });
        stream.end(buffer);
    });
}

// Company logos are public: anyone may see them on the jobs page.
// Returns the https URL to store in job.companyLogoUrl.
export async function uploadCompanyLogo(file: Express.Multer.File): Promise<string> {
    const result = await uploadBuffer(file.buffer, {
        folder: "jobportal/logos",
        resource_type: "image",
    });
    return result.secure_url;
}

// Resumes are PRIVATE: no public URL works for them. They can only be fetched
// through a short-lived signed link that our server creates after its own
// permission check (see downloadResume). "raw" = keep the PDF exactly as uploaded.
// Returns the public_id to store in application.resumePath.
export async function uploadResume(file: Express.Multer.File): Promise<string> {
    const result = await uploadBuffer(file.buffer, {
        folder: "jobportal/resumes",
        resource_type: "raw",
        type: "private",
        public_id: `${Date.now()}_${safeName(file.originalname)}`,
    });
    return result.public_id;
}

// A download link for a private resume that stops working after 5 minutes.
export function signedResumeUrl(publicId: string): string {
    return cloudinary.utils.private_download_url(publicId, "", {
        resource_type: "raw",
        type: "private",
        expires_at: Math.floor(Date.now() / 1000) + 5 * 60,
    });
}

// Used when saving to MongoDB fails after the upload: removes the now-unused file.
// Errors are ignored so the user still gets the real error message.
export async function deleteLogo(url: string): Promise<void> {
    // URL looks like .../upload/v1729.../jobportal/logos/abc123.png → public_id "jobportal/logos/abc123"
    const match = url.match(/\/upload\/(?:v\d+\/)?(.+)\.[a-z0-9]+$/i);
    if (match) {
        await cloudinary.uploader.destroy(match[1], { resource_type: "image" }).catch(() => { });
    }
}

export async function deleteResume(publicId: string): Promise<void> {
    await cloudinary.uploader.destroy(publicId, { resource_type: "raw", type: "private" }).catch(() => { });
}
