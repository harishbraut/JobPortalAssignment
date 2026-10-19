import mongoose, { Schema, Types } from "mongoose";

// The allowed statuses, as a real array that exists at runtime.
// `as const` keeps the exact strings instead of widening them to `string`.
export const APPLICATION_STATUSES = ["applied", "shortlisted", "rejected", "accepted"] as const;

export type ApplicationStatus = typeof APPLICATION_STATUSES[number];

export function isApplicationStatus(value: unknown): value is ApplicationStatus {
    return APPLICATION_STATUSES.includes(value as ApplicationStatus);
}

export interface IApplication {
    _id: Types.ObjectId; // added by MongoDB automatically
    jobId: Types.ObjectId;       // _id of the job
    applicantId: Types.ObjectId; // _id of the user who applied
    status: ApplicationStatus;
    appliedAt: Date;
    // Where multer saved the uploaded PDF, e.g. "public/resumes/1729..._my_cv.pdf".
    // We store only the path: the file itself stays on disk, because MongoDB
    // documents are limited to 16 MB and big files slow every query down.
    resumePath: string;
}

const applicationsSchema = new Schema<IApplication>({
    jobId: {
        type: Schema.Types.ObjectId,
        ref: "jobs",
        required: true
    },
    applicantId: {
        type: Schema.Types.ObjectId,
        ref: "users",
        required: true
    },
    status: {
        type: String,
        enum: APPLICATION_STATUSES,
        default: "applied"
    },
    appliedAt: {
        type: Date,
        default: Date.now
    },
    resumePath: {
        type: String,
        // Every application must come with a resume, so the database rejects
        // one without it even if some other code path forgets to check.
        required: [true, "resume is required"]
    }
});

// The same user cannot apply to the same job twice.
applicationsSchema.index({ jobId: 1, applicantId: 1 }, { unique: true });

const applicationsModel = mongoose.model<IApplication>("applications", applicationsSchema);

export default applicationsModel;
