import type { Request, Response } from "express";
import JobsRepository from "../repositories/job.repository.js";
import ApplicationRepository from "../repositories/application.repository.js";

const jobsRepository = new JobsRepository();
const applicationRepository = new ApplicationRepository();

// Page controllers call res.render() instead of res.json(): they send back HTML.
// The object passed to res.render() becomes the variables in the .ejs file.

// GET /jobs              → recruiter: only their own jobs; everyone else: all jobs
// GET /jobs?query=java   → the same, filtered by the search text
export async function showJobsPage(req: Request, res: Response) {
    const query = typeof req.query.query === "string" ? req.query.query.trim() : "";

    // Set by loadLoggedInUser (from the cookie) when someone is logged in.
    const isRecruiter = res.locals.role === "recruiter";
    const recruiterId: string | undefined = isRecruiter ? res.locals.userId : undefined;

    try {
        let jobs;
        if (query) {
            jobs = await jobsRepository.searchJobs(query, recruiterId);
        } else if (recruiterId) {
            jobs = await jobsRepository.getJobsByRecruiterId(recruiterId);
        } else {
            jobs = await jobsRepository.getAllJobs();
        }

        res.render("jobs", {
            title: isRecruiter ? "My Jobs" : "Jobs",
            jobs,
            query,
            isRecruiter,
        });
    } catch (error) {
        res.status(500).render("jobs", {
            title: "Jobs",
            jobs: [],
            query,
            isRecruiter,
            errorMessage: "Could not load jobs right now. Please try again.",
        });
    }
}

// GET /my-applications → every job the logged-in applicant applied to
export async function showMyApplicationsPage(req: Request, res: Response) {
    if (!res.locals.userId) return res.redirect("/login");
    if (res.locals.role !== "applicant") return res.redirect("/applications");

    try {
        const applications = await applicationRepository.getApplicationsByApplicantId(res.locals.userId);
        res.render("my-applications", { title: "My Applications", applications });
    } catch (error) {
        res.status(500).render("my-applications", {
            title: "My Applications",
            applications: [],
            errorMessage: "Could not load your applications right now. Please try again.",
        });
    }
}

// GET /applications → everyone who applied to the logged-in recruiter's jobs
export async function showApplicationsPage(req: Request, res: Response) {
    // Only recruiters have applicants. Others are sent to the login or jobs page.
    if (!res.locals.userId) return res.redirect("/login");
    if (res.locals.role !== "recruiter") return res.redirect("/jobs");

    try {
        const applications = await applicationRepository.getJobApplicantsByRecruiterId(res.locals.userId);
        res.render("applications", { title: "Applications", applications });
    } catch (error) {
        res.status(500).render("applications", {
            title: "Applications",
            applications: [],
            errorMessage: "Could not load applicants right now. Please try again.",
        });
    }
}
