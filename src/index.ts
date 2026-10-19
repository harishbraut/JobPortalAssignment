import express, { type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import multer from "multer";
import path from "path";
import expressLayouts from "express-ejs-layouts";
import ejs from "ejs";
import cookieParser from "cookie-parser";
import { loadLoggedInUser } from "./middlewares/auth.middleware.js";
import { env } from "./config/env.js";
import { connectToMongoDB } from "./config/db.config.js";
import userRoutes from "./routes/user.routes.js";
import jobRoutes from "./routes/job.routes.js";
import applicationRoutes from "./routes/application.routes.js";
import webRoutes from "./routes/web.routes.js";

export function createApp() {

    const app = express();

    // Make sure MongoDB is connected before any route runs. The first request
    // connects; later requests reuse the same connection (see db.config.ts).
    app.use(async (req, res, next) => {
        try {
            await connectToMongoDB();
            next();
        } catch (error) {
            console.error("database connection failed", error);
            res.status(503).json({ message: "database is not available, please try again" });
        }
    });

    app.use(cors());
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

    // Reads the Cookie header into req.cookies, e.g. req.cookies.token
    app.use(cookieParser());

    // On every request: if a valid token cookie/header is present, fill
    // res.locals.userId and res.locals.role. Must come after cookieParser().
    app.use(loadLoggedInUser);

    // ---- EJS (server-rendered pages) ----
    // res.render("home") will look for views/home.ejs.
    // process.cwd() is the project folder (where you run npm run dev), so this
    // works both with tsx (src/) and after building (dist/).
    // app.engine registers EJS explicitly. Without it Express loads "ejs" by name at
    // runtime, and Vercel's bundler would not know to include the ejs package.
    app.engine("ejs", ejs.renderFile);
    app.set("view engine", "ejs");
    app.set("views", path.join(process.cwd(), "views"));

    // express-ejs-layouts wraps every rendered page in views/layout.ejs.
    // The page's own HTML is inserted where layout.ejs has <%- body %>, so the
    // <head>, navbar and footer are written once instead of in every page.
    app.use(expressLayouts);
    app.set("layout", "layout");

    // Our own CSS/JS for the pages: public/assets/css/style.css → /assets/css/style.css
    // Locally Express serves it. On Vercel this line is ignored and Vercel serves
    // the public/ folder itself, at the same URLs.
    app.use("/assets", express.static("public/assets"));

    // "/" now shows the home page (see web.routes.ts). The JSON check that
    // used to live at "/" moved here, so you can still see if the API is up.
    app.get("/health", (req, res) => {
        res.status(200).json({
            status: "ok",
            msg: "server is running"
        });
    });

    // Pages first, then the JSON APIs.
    app.use(webRoutes);
    app.use(userRoutes);
    app.use(jobRoutes);
    app.use(applicationRoutes);

    // Error-handling middleware. Express recognises it by its FOUR parameters
    // (err first), and it must come AFTER the routes. When a middleware fails,
    // for example multer's fileFilter rejecting a .docx, Express skips the
    // controller and jumps straight here. Without this, Express answers with
    // its default HTML error page and status 500, which is not useful to an API client.
    app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
        // Errors that multer creates itself, e.g. LIMIT_FILE_SIZE for files over the limit.
        if (err instanceof multer.MulterError) {
            const message = err.code === "LIMIT_FILE_SIZE"
                ? "file is too large (logos up to 2 MB, resumes up to 4 MB)"
                : err.message;
            return res.status(400).json({ message });
        }

        // Our own errors, e.g. "only PDF files are allowed" from fileFilter.
        return res.status(400).json({ message: err.message });
    });

    return app;
}

const app = createApp();

// Vercel imports this file and calls the exported app for each request.
export default app;

// Locally (npm run dev / npm start) we start a normal server ourselves.
// Vercel sets the VERCEL environment variable, so this part is skipped there.
if (!process.env.VERCEL) {
    try {
        await connectToMongoDB();
        console.log("connected to mongo successfully");
        app.listen(env.PORT, () => {
            console.log(`server started on port ${env.PORT}`);
        });
    } catch (error) {
        console.log("some issue with server", error);
    }
}
