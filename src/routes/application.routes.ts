import { Router } from "express";
import { authenticateUser } from "../middlewares/auth.middleware.js";
import { uploadResume } from "../middlewares/fileUpload.middleware.js";
import { applyForTheJob, changeJobStatus, getApplicantsByRecruiterId, getMyApplications, downloadResume } from "../controller/application.controller.js";

const router = Router();

// Applicant applies to a job, with a PDF resume in the form field "resume".
router.post("/jobs/:jobId/apply", authenticateUser, uploadResume.single("resume"), applyForTheJob);

// Recruiter changes the status of one application on one of their jobs.
router.post("/jobs/:jobId/:applicationId/", authenticateUser, changeJobStatus);

// Recruiter lists all applications to their jobs. No id in the URL: the
// controller reads the recruiter from the token.
router.get("/recruiter/applications", authenticateUser, getApplicantsByRecruiterId);

// Applicant lists their own applications. No id in the URL: it comes from the token.
router.get("/applicant/applications", authenticateUser, getMyApplications);

// Download an application's resume (job's recruiter or the applicant only).
router.get("/applications/:applicationId/resume", authenticateUser, downloadResume);

export default router;
