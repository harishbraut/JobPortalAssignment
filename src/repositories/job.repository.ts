import jobsModel from "../model/job.schema.js";
import type { NewJob } from "../types/job.types.js";

export default class JobsRepository {

    // Type `jobDetails.` inside this method and VS Code lists every field.
    // NewJob = the client's fields + recruiterId (from the token) + companyLogoUrl (from the upload).
    async addJob(jobDetails: NewJob) {
        const { companyName, jobTitle, recruiterId, requiredSkills, description, salary } = jobDetails;

        const isJobTitleExistForTheSameCompany = await jobsModel.findOne({ jobTitle: jobTitle, companyName: companyName }).lean();

        if (isJobTitleExistForTheSameCompany !== null) {
            throw new Error("This job title exists for the company already");
        }

        const job = new jobsModel(jobDetails);
        return await job.save();
    }

    async findByRecruiter(recruiterId: string) {
        return await jobsModel.find({ recruiterId: recruiterId }).lean();
    }

    async getAllJobs() {
        return await jobsModel.find({}).lean();
    }

    // Used by the navbar search box. Finds jobs whose title, company OR any
    // skill contains the text, ignoring upper/lower case ("java" finds "Java").
    // Pass recruiterId to search only inside that recruiter's own jobs.
    async searchJobs(text: string, recruiterId?: string) {
        // The text is put inside a regular expression, so characters like
        // "." "+" or "(" would have special meaning ("c++" would even crash).
        // Escaping them makes the search treat the text literally.
        const safeText = text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const pattern = new RegExp(safeText, "i");     // "i" = case-insensitive

        return await jobsModel.find({
            ...(recruiterId ? { recruiterId } : {}),
            // $or = match if ANY of these is true
            $or: [
                { jobTitle: pattern },
                { companyName: pattern },
                { requiredSkills: pattern },   // on an array: matches if any element matches
            ],
        }).lean();
    }

    async getJobsByRecruiterId(recruiterId: string) {
        return await jobsModel.find({ recruiterId: recruiterId }).lean();
    }

    async jobExists(jobId: string): Promise<boolean> {
        const job = await jobsModel.exists({ _id: jobId });
        return job !== null;
    }

    async getRecruiterIdForJob(jobId: string) {
        // findById returns one job (or null), not an array like find()
        const job = await jobsModel.findById(jobId, 'recruiterId').lean();
        return job ? job.recruiterId : null;
    }
}
