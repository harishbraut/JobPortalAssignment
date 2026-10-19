import type { Request, Response } from "express";
import jwt, { type SignOptions } from "jsonwebtoken";
import bcrypt from "bcryptjs";
import type { Types } from "mongoose";
import UserRepository from "../repositories/user.repository.js";
import type { SignupInput, LoginInput } from "../types/user.types.js";
import { env } from "../config/env.js";
import { TOKEN_COOKIE } from "../middlewares/auth.middleware.js";

const userRepository = new UserRepository();

function issueToken(userId: Types.ObjectId, role: string): string {
    return jwt.sign({ id: userId.toString(), role }, env.JWT_SECRET, {
        expiresIn: env.JWT_EXPIRY as SignOptions["expiresIn"]
    });
}

// Request<params, resBody, reqBody>: the third type tells TypeScript what
// req.body holds, so `req.body.` autocompletes. It does NOT check the data at
// runtime, so a client can still send anything. Mongoose validates the user
// fields when saving, and any error comes back as a 400 below.
export async function signup(req: Request<{}, {}, SignupInput>, res: Response) {
    try {
        const user = await userRepository.create(req.body);
        console.log("new user created");
        const token = issueToken(user._id, user.role);
        await userRepository.addToken(user._id, token);
        res.status(201).json({
            msg: "user created successfully"
        });
    } catch (error) {
        return res.status(400).json({
            msg: error instanceof Error ? error.message : "signup failed"
        });
    }
}

export async function login(req: Request<{}, {}, LoginInput>, res: Response) {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ msg: "email and password are required fields" });
    }

    try {
        const user = await userRepository.findByEmail(email);
        if (!user) {
            return res.status(401).json({ msg: "invalid email or password" });
        }

        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) {
            return res.status(401).json({ msg: "invalid email or password" });
        }

        const token = issueToken(user._id, user.role);
        await userRepository.addToken(user._id, token);

        // Also store the token in a cookie, so the browser sends it automatically.
        // The cookie expires at the same moment as the token (exp is in seconds).
        const { exp } = jwt.decode(token) as { exp: number };
        res.cookie(TOKEN_COOKIE, token, {
            httpOnly: true,     // page JavaScript can't read it, so an XSS bug can't steal it
            sameSite: "lax",    // not sent on POSTs from other websites (blocks CSRF)
            secure: process.env.NODE_ENV === "production",   // HTTPS only once deployed
            expires: new Date(exp * 1000),
        });

        // The token is still in the JSON too, so Postman keeps working as before.
        return res.status(200).json({ msg: "login successful", token });
    } catch (error) {
        return res.status(500).json({ msg: "login failed" });
    }
}

// GET /logout: delete the cookie and go back to the jobs page.
export function logout(req: Request, res: Response) {
    res.clearCookie(TOKEN_COOKIE);
    res.redirect("/jobs");
}
