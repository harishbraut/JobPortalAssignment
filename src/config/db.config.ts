import mongoose from "mongoose";
import dns from "dns";
import { env } from "./env.js";

dns.setServers(["8.8.8.8", "1.1.1.1"]);

// The connection is created once and then reused. On Vercel the same app
// instance handles many requests, so connecting again on every request would
// be slow and could hit MongoDB Atlas's connection limit.
let connection: Promise<typeof mongoose> | null = null;

export async function connectToMongoDB(): Promise<void> {
    if (!connection) {
        connection = mongoose.connect(env.MONGODB_URI);
        mongoose.connection.on("error", function (err) {
            console.error("connection failed", err);
        });
    }

    try {
        await connection;
    } catch (error) {
        // Forget the failed attempt so the next request tries again.
        // (No process.exit here: on Vercel that would kill the function.)
        connection = null;
        throw error;
    }
}
