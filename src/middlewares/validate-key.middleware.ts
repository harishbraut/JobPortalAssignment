// import type { Request, Response, NextFunction } from "express";
// import { env } from "../config/env.js";

// // Rejects any request whose `key` header does not match SECURITY_KEY in .env.
// export function validateSecurityKey(req: Request, res: Response, next: NextFunction) {
//     if (req.headers.key !== env.SECURITY_KEY) {
//         return res.status(403).json({
//             success: false,
//             message: "you are not allowed to call this API"
//         });
//     }

//     next();
// }
