import mongoose, { Schema, Types } from "mongoose";

// The shape of one user document in MongoDB.
export interface IUser {
    _id: Types.ObjectId; // added by MongoDB automatically
    username: string;
    email: string;
    password: string; // bcrypt hash, never the plain password
    role: "recruiter" | "applicant";
    tokens: string[];
    createdAt: Date;
    updatedAt: Date;
}

const userSchema = new Schema<IUser>(
    {
        username: {
            type: String,
            required: [true, "username is a required value"],
            unique: true,
            trim: true,
            minLength: [4, "username should be at least 4 characters"],
        },
        email: {
            type: String,
            required: [true, "email is a required value"],
            unique: true,
            trim: true,
            lowercase: true,
            match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "invalid email format"],
        },
        password: {
            type: String,
            required: [true, "password is a required value"],
        },
        role: {
            type: String,
            enum: {
                values: ["recruiter", "applicant"],
                message: "{VALUE} is not a valid role",
            },
            required: true
        },
        tokens: [{
            type: String
        }]
    },
    { timestamps: true }
);

export const UserModel = mongoose.model<IUser>("users", userSchema);

export default UserModel;
