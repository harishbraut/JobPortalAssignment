import UserModel from "../model/user.schema.js";
import bcrypt from "bcryptjs";
import type { Types } from "mongoose";
import type { SignupInput } from "../types/user.types.js";

const SALT_ROUNDS = 10;

// The schema can't check password length: by the time Mongoose validates,
// `password` already holds the 60-character hash. So we check it here.
const hashPassword = async (plainPassword: string): Promise<string> => {
    if (!plainPassword || plainPassword.length < 8) {
        throw new Error("password should be at least 8 characters");
    }
    return await bcrypt.hash(plainPassword, SALT_ROUNDS);
}

// All database operations for users live here.
export class UserRepository {

    async create(userData: SignupInput) {
        const hashedPassword = await hashPassword(userData.password);
        const newUser = new UserModel({ ...userData, password: hashedPassword });
        const createdUser = await newUser.save();
        console.log(`user id is ${createdUser._id}`);
        return createdUser;
    }

    async addToken(userId: Types.ObjectId, token: string) {
        return await UserModel.findByIdAndUpdate(userId, {
            $addToSet: {
                tokens: token,
            }
        }, {
            new: true
        });
    }

    // Returns the full user (including the password hash), or null.
    async findByEmail(email: string) {
        return await UserModel.findOne({ email: email });
    }
}

export default UserRepository;
