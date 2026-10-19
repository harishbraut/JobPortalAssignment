// One-time script: moves logos and resumes that are still stored in public/
// to Cloudinary, and updates the database to point at the new copies.
// Safe to run again: it only touches records that still point to local files.
//
// Run with:  npx tsx --use-system-ca scripts/migrate-uploads-to-cloudinary.ts

import fs from "fs";
import path from "path";
import mongoose from "mongoose";
import dns from "dns";
import { v2 as cloudinary } from "cloudinary";
import { env } from "../src/config/env.js";

dns.setServers(["8.8.8.8", "1.1.1.1"]);
cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
    secure: true,
});

await mongoose.connect(env.MONGODB_URI);
const jobs = mongoose.connection.collection("jobs");
const applications = mongoose.connection.collection("applications");

// ---- Logos: "/images/x.png" → Cloudinary URL ----
for (const job of await jobs.find({ companyLogoUrl: /^\/images\// }).toArray()) {
    const file = path.join("public", job.companyLogoUrl);
    if (!fs.existsSync(file)) {
        console.log(`logo  MISSING  ${job.companyName}: ${file}`);
        continue;
    }
    const result = await cloudinary.uploader.upload(file, { folder: "jobportal/logos", resource_type: "image" });
    await jobs.updateOne({ _id: job._id }, { $set: { companyLogoUrl: result.secure_url } });
    console.log(`logo  moved    ${job.companyName}`);
}

// ---- Resumes: "public\resumes\x.pdf" → private Cloudinary id ----
for (const application of await applications.find({ resumePath: /^public[\\/]/ }).toArray()) {
    const file = application.resumePath.replace(/\\/g, "/");
    if (!fs.existsSync(file)) {
        console.log(`resume MISSING ${application._id}: ${file}`);
        continue;
    }
    const result = await cloudinary.uploader.upload(file, {
        folder: "jobportal/resumes",
        resource_type: "raw",
        type: "private",
        public_id: path.basename(file),
    });
    await applications.updateOne({ _id: application._id }, { $set: { resumePath: result.public_id } });
    console.log(`resume moved   ${application._id}`);
}

await mongoose.disconnect();
console.log("done");
