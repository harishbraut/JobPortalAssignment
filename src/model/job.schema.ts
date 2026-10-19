import mongoose, { Schema, Types } from "mongoose";

export interface IJob {
    _id: Types.ObjectId; // added by MongoDB automatically
    jobTitle: string;
    companyName: string;
    requiredSkills: string[];
    recruiterId: Types.ObjectId; // _id of the user (recruiter) who posted the job
    description?: string;
    salary?: number;
    // URL the UI can put straight into <img src="...">, e.g. "/images/1729..._amazon.png".
    // Optional (`?`): a job without a logo is still a valid job, and jobs
    // created before this field existed don't have one.
    companyLogoUrl?: string;
    createdAt: Date;
}

const jobSchema = new Schema<IJob>({
    jobTitle: {
        type: String,
        required: [true, "job title is required field"],
        minlength: [3, "job title should be at least 3 characters"]
    },
    companyName: {
        type: String,
        required: [true, "company name is required field"],
        minlength: [2, "company name should be at least 2 characters"]
    },
    requiredSkills: {
        type: [String],
        // `minlength` only works on strings; arrays need a validator.
        validate: {
            validator: (skills: string[]) => skills.length >= 1,
            message: "at least one skill is required"
        }
    },
    recruiterId: {
        type: Schema.Types.ObjectId,
        ref: "users",
        required: true
    },
    description: String,
    salary: Number,
    // Only the URL is stored, not the image itself. The file lives in
    // public/images/ on disk; keeping big binary data out of MongoDB keeps
    // documents small and queries fast.
    companyLogoUrl: String,
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const jobsModel = mongoose.model<IJob>("jobs", jobSchema);

export default jobsModel;
