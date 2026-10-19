import type { Request, Response } from "express";
import JobsRepository from "../repositories/job.repository.js";
import { AddJobInput } from "../types/job.types.js";
import { uploadCompanyLogo, deleteLogo } from "../config/cloudinary.js";

const jobsRepository = new JobsRepository();

export async function getAllRecruiterJobs(req: Request, res: Response) {
    try {
        const idofrecruiter = res.locals.userId;
        const alljobsByThisrecruiter = await jobsRepository.getJobsByRecruiterId(idofrecruiter);
        return res.status(200).json({
            message: "job fetched successfully",
            alljobsByThisrecruiter
        });
    }
    catch (error) {
        return res.status(400).json({
            message: error instanceof Error ? error.message : "could not fetch jobs by this recruiter"
        })

    }
}


// Route: POST /addJob   (authenticateUser → uploadCompanyLogo.single("companyLogo") → here)
// The request is sent as form-data (not JSON) because it carries a file.
// Multer reads the text fields into req.body and the image into req.file.
export async function addJob(req: Request<{}, {}, AddJobInput>, res: Response) {
    // Only recruiters post jobs. Checked before uploading anything.
    if (res.locals.role !== "recruiter") {
        return res.status(403).json({ message: "only recruiters can add jobs" });
    }

    let companyLogoUrl: string | undefined;
    try {
        // The logo is optional. If one was sent, upload it to Cloudinary and
        // store its https URL; the jobs page uses it directly in <img src>.
        if (req.file) {
            companyLogoUrl = await uploadCompanyLogo(req.file);
        }

        const addedJob = await jobsRepository.addJob({
            ...req.body,
            // From the token, not the body: a recruiter can only post jobs as themselves.
            recruiterId: res.locals.userId,
            companyLogoUrl,
        });
        console.log("job created successfully", addedJob._id.toString());
        return res.status(201).json({
            message: "job added successfully",
            addedJob
        });
    } catch (error) {
        // e.g. duplicate job title, or a validation error: the job was not
        // saved, so the logo we just uploaded is not needed.
        if (companyLogoUrl) await deleteLogo(companyLogoUrl);
        return res.status(400).json({
            message: error instanceof Error ? error.message : "could not add job"
        });
    }
}
