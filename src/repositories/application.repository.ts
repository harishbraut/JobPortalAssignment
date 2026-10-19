import applicationsModel, { type ApplicationStatus } from "../model/application.schema.js"
import jobsModel from "../model/job.schema.js";

export default class ApplicationRepository {

    // Applications have no recruiterId, so we go through the jobs:
    // recruiter → their jobs (jobs.recruiterId) → applications for those jobs (applications.jobId)
    async getJobApplicantsByRecruiterId(recruiterId: string) {
        const jobIds = await jobsModel.find({ recruiterId }).distinct("_id");
        return await applicationsModel
            .find({ jobId: { $in: jobIds } })
            .populate("applicantId", "username email")              // never send password/tokens
            .populate("jobId", "jobTitle companyName salary")
            .lean();
    }

    // One application with what the resume download needs: the file path, the
    // applicant's name, and the job's recruiterId (for the permission check).
    async getApplicationForResume(applicationId: string) {
        return await applicationsModel
            .findById(applicationId, "resumePath applicantId jobId")
            .populate("applicantId", "username")
            .populate("jobId", "recruiterId")
            .lean();
    }

    // Every application this applicant made, newest first, with the job's details filled in.
    async getApplicationsByApplicantId(applicantId: string) {
        return await applicationsModel
            .find({ applicantId })
            .sort({ appliedAt: -1 })
            .populate("jobId", "jobTitle companyName companyLogoUrl salary")
            .lean();
    }

    // `status: ApplicationStatus` (not `string`) means TypeScript only accepts
    // the four allowed values here. The controller checks the request body with
    // isApplicationStatus() first, so a plain string can never reach this point.
    async updateApplicantStatus(applicationId: string, status: ApplicationStatus) {

        const application = await applicationsModel.findById(applicationId);

        if (!application) {
            throw new Error("application not found");
        }

        // Change the field on the document and save() it, instead of updateOne():
        // - updateOne() returns a summary ({ acknowledged, modifiedCount }),
        //   not the application, so the API response would be wrong.
        // - updateOne() skips schema validation (the enum check) by default;
        //   save() always runs it.
        // validateModifiedOnly: only check the fields we changed (status).
        // By default save() validates EVERY field, so applications created
        // before `resumePath` existed (they have none) would fail its
        // `required` rule, and their status could never be updated.
        application.status = status;
        return await application.save({ validateModifiedOnly: true });
    }

    // Applying for a job = creating one document in the applications collection.
    // We pass only these three fields; `status` ("applied") and `appliedAt` (now)
    // are filled in by the defaults in the schema.
    async applyForTheJob(jobId: string, applicantId: string, resumePath: string) {
        return await applicationsModel.create({ jobId, applicantId, resumePath });
    }

    // Returns { _id, jobId } of the application, or null if it does not exist.
    // Used to make sure the application really belongs to the job in the URL.
    async getJobIdForApplication(applicationId: string) {
        return await applicationsModel.findById(applicationId, 'jobId').lean();
    }
}
