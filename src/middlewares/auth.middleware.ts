import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

// What we put inside the token in user.controller.ts: jwt.sign({ id, role })
interface TokenPayload {
    id: string;
    role: string;
}

// The cookie's name. Used here, in login (set it) and logout (clear it).
export const TOKEN_COOKIE = "token";

// Postman sends the token in the Authorization header; the browser sends it in a cookie.
function readToken(req: Request): string | undefined {
    return req.headers.authorization?.split(" ")[1] ?? req.cookies?.[TOKEN_COOKIE];
}

// Returns the token's contents, or null if it is missing, fake or expired.
function verifyToken(token: string | undefined): TokenPayload | null {
    if (!token) return null;
    try {
        return jwt.verify(token, env.JWT_SECRET) as unknown as TokenPayload;
    } catch {
        return null;
    }
}

// For protected routes: no valid token → 401, request stops here.
export function authenticateUser(req: Request, res: Response, next: NextFunction) {
    const token = readToken(req);
    if (!token) {
        return res.status(401).json({ msg: "token is missing" });
    }

    const payload = verifyToken(token);
    if (!payload) {
        return res.status(401).json({ msg: "invalid or expired token" });
    }

    res.locals.userId = payload.id;
    res.locals.role = payload.role;
    next();
}

// For EVERY request (pages too): never blocks. Fills userId/role if someone is
// logged in, so EJS can check `locals.userId` (e.g. show Logout instead of Login).
export function loadLoggedInUser(req: Request, res: Response, next: NextFunction) {
    const payload = verifyToken(readToken(req));
    if (payload) {
        res.locals.userId = payload.id;
        res.locals.role = payload.role;
    }
    next();
}
