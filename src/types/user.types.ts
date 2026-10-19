// What the client sends in req.body.

export interface SignupInput {
    username: string;
    email: string;
    password: string;
    role: "recruiter" | "applicant";
}

export interface LoginInput {
    email: string;
    password: string;
}
