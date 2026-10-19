import { Router } from "express";
import { addJob, getAllRecruiterJobs } from "../controller/job.controller.js";
import { authenticateUser } from "../middlewares/auth.middleware.js"
import { uploadCompanyLogo } from "../middlewares/fileUpload.middleware.js";

const router = Router();

// Order matters: authenticateUser runs first, so people who are not logged in
// are rejected before multer writes anything to disk.
// .single("companyLogo") = one file, sent in the form field named "companyLogo".
router.post("/addJob", authenticateUser, uploadCompanyLogo.single("companyLogo"), addJob);

// No id in the URL: the controller reads the recruiter from the token, so
// "/recruiter/jobs" always means "the jobs of whoever is logged in".
router.get("/recruiter/jobs", authenticateUser, getAllRecruiterJobs);

export default router;
