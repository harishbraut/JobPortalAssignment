import type { Request, Response } from "express";
import { Readable } from "stream";
import ApplicationRepository from "../repositories/application.repository.js";
import JobsRepository from "../repositories/job.repository.js";
import { isApplicationStatus, APPLICATION_STATUSES } from "../model/application.schema.js";
import { uploadResume, deleteResume, signedResumeUrl } from "../config/cloudinary.js";

const applicationRepository = new ApplicationRepository();
// Applying and changing a status need job lookups too (does the job exist? who posted it?)
const jobsRepository = new JobsRepository();

// Route: GET /recruiter/applications   (authenticateUser → here)
// Lists every application made to any job the logged-in recruiter posted.
export async function getApplicantsByRecruiterId(req: Request, res: Response) {
    try {
        // From the token, not the URL: a recruiter only ever sees their own applicants.
        const idofrecruiter = res.locals.userId;
        const allApplicationsForThisrecruiter = await applicationRepository.getJobApplicantsByRecruiterId(idofrecruiter);
        return res.status(200).json({
            message: "All applicants data fetched successfully",
            allApplicationsForThisrecruiter
        });
    } catch (error) {
        return res.status(400).json({
            message: error instanceof Error ? error.message : "could not fetch applications by this recruiter"
        })
    }
}

// Route: GET /applications/:applicationId/resume   (authenticateUser → here)
// Sends the resume PDF, but only to the recruiter who posted the job
// or to the applicant who uploaded it.
export async function downloadResume(req: Request<{ applicationId: string }>, res: Response) {
    try {
        const application = await applicationRepository.getApplicationForResume(req.params.applicationId);
        if (!application) {
            return res.status(404).json({ message: "application not found" });
        }

        // populate() replaced these ids with small objects.
        const job = application.jobId as unknown as { recruiterId: { equals(id: string): boolean } } | null;
        const applicant = application.applicantId as unknown as { _id: { equals(id: string): boolean }; username: string } | null;

        const userId = res.locals.userId;
        const isJobRecruiter = !!job && job.recruiterId.equals(userId);
        const isOwnApplication = !!applicant && applicant._id.equals(userId);
        if (!isJobRecruiter && !isOwnApplication) {
            return res.status(403).json({ message: "you are not allowed to download this resume" });
        }

        if (!application.resumePath) {
            return res.status(404).json({ message: "this application has no resume" });
        }

        // resumePath holds the Cloudinary id of a PRIVATE file. Our server fetches it
        // with a short-lived signed link and passes it on, so the browser never sees
        // a Cloudinary URL that could be shared with others.
        const cloudinaryResponse = await fetch(signedResumeUrl(application.resumePath));
        if (!cloudinaryResponse.ok || !cloudinaryResponse.body) {
            return res.status(404).json({ message: "resume file not found" });
        }

        // attachment() makes the browser save the file instead of opening it,
        // under a readable name like "harishr_resume.pdf".
        res.attachment(`${applicant?.username ?? "applicant"}_resume.pdf`);
        res.type("application/pdf");
        Readable.fromWeb(cloudinaryResponse.body as any).pipe(res);
    } catch (error) {
        return res.status(400).json({
            message: error instanceof Error ? error.message : "could not download resume"
        });
    }
}

// Route: GET /applicant/applications   (authenticateUser → here)
// Lists every job the logged-in applicant applied to, with the current status.
export async function getMyApplications(req: Request, res: Response) {
    if (res.locals.role !== "applicant") {
        return res.status(403).json({ message: "only applicants have applications" });
    }

    try {
        const applications = await applicationRepository.getApplicationsByApplicantId(res.locals.userId);
        return res.status(200).json({
            message: "applications fetched successfully",
            applications
        });
    } catch (error) {
        return res.status(400).json({
            message: error instanceof Error ? error.message : "could not fetch your applications"
        });
    }
}

// Route: POST /jobs/:jobId/apply   (authenticateUser → uploadResume.single("resume") → here)
export async function applyForTheJob(req: Request<{ jobId: string }>, res: Response) {
    const jobId = req.params.jobId;        // from the URL: /jobs/:jobId/apply
    const userId = res.locals.userId;      // from the token (set by the middleware)
    const role = res.locals.role;          // from the token

    // Role first: "you are not allowed" is the more important answer than
    // "you forgot the file". A recruiter should hear they can't apply at all.
    if (role !== "applicant") {
        return res.status(403).json({ message: "only applicants can apply for jobs" });
    }

    // req.file is set by multer (kept in memory). It is missing when the form had
    // no "resume" field. A non-PDF never gets here: fileFilter rejects it first.
    if (!req.file) {
        return res.status(400).json({ message: "resume (PDF) is required" });
    }

    let resumeId: string | undefined;
    try {
        // Check the job before uploading, so we don't store files for nothing.
        if (!(await jobsRepository.jobExists(jobId))) {
            return res.status(404).json({ message: "job not found" });
        }

        // Upload the PDF to Cloudinary as a private file; store its id.
        resumeId = await uploadResume(req.file);

        const application = await applicationRepository.applyForTheJob(jobId, userId, resumeId);
        return res.status(201).json({ message: "applied successfully", application });
    } catch (error) {
        // The application was not saved, so the uploaded resume is not needed.
        if (resumeId) await deleteResume(resumeId);

        // 11000 is MongoDB's "duplicate key" error. It comes from the unique
        // index on { jobId, applicantId } in application.schema.ts, i.e. this
        // applicant already applied for this job. 409 Conflict fits that case.
        if (error instanceof Error && "code" in error && error.code === 11000) {
            return res.status(409).json({ message: "you have already applied for this job" });
        }

        // Anything else, e.g. a jobId that isn't a valid ObjectId ("123").
        return res.status(400).json({
            message: error instanceof Error ? error.message : "could not apply"
        });
    }
}


export async function changeJobStatus(req: Request, res: Response) {
    try {
        const applicationId = req.params.applicationId;
        const jobId: string = req.params.jobId;
        const status = req.body.status;
        const userId = res.locals.userId;      // from the token (set by the middleware)
        const role = res.locals.role;

        // 1. Cheap checks first (no database needed): role, then the body.
        //    No point querying MongoDB for a request we will refuse anyway.
        if (role !== 'recruiter') {
            return res.status(403).json({
                message: "you are as a applicant not authorized to make this request"
            })
        }

        if (!isApplicationStatus(status)) {
            return res.status(400).json({
                message: `status must be one of: ${APPLICATION_STATUSES.join(", ")}`
            })
        }

        // 2. Does the application exist? Checked separately from step 3 so the
        //    client gets an accurate message instead of "for another job id".
        const jobID = await applicationRepository.getJobIdForApplication(applicationId);

        if (!jobID) {
            return res.status(404).json({
                message: "application not found"
            })
        }

        // 3. Does the application belong to the job in the URL? Without this, a
        //    recruiter could put their OWN jobId in the URL (passing step 4)
        //    next to an application from SOMEONE ELSE'S job, and change it.
        if (!jobID.jobId.equals(jobId)) {
            return res.status(404).json({
                message: "this application is for another job id"
            })
        }

        // 4. Did this recruiter post that job?
        const recruiterId = await jobsRepository.getRecruiterIdForJob(jobId);

        if (!recruiterId || !recruiterId.equals(userId)) {
            return res.status(403).json({
                message: "you are not the recruiter who posted this job"
            })
        }

        // 5. All checks passed: update it.
        const application = await applicationRepository.updateApplicantStatus(applicationId, status);
        return res.status(200).json({ message: "job status updated succesfully", application });
    } catch (error) {
        return res.status(400).json({
            message: error instanceof Error ? error.message : "could not update status"
        });
    }
}
