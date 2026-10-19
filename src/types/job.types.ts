// What the client sends in req.body when adding a job.
// `?` means the field is optional.
//
// recruiterId is NOT here: the controller takes it from the logged-in user's
// token, so nobody can post a job in another recruiter's name.
// companyLogoUrl is NOT here either: it comes from the uploaded file (req.file).
export interface AddJobInput {
    jobTitle: string;
    companyName: string;
    requiredSkills: string[];
    description?: string;
    salary?: number;
}

// What the repository saves: the client's fields plus the two the server adds.
export interface NewJob extends AddJobInput {
    recruiterId: string;
    companyLogoUrl?: string;
}
