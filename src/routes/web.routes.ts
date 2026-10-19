import { Router } from "express";
import { showJobsPage, showApplicationsPage, showMyApplicationsPage } from "../controller/web.controller.js";

// Routes that return HTML pages (EJS), kept apart from the JSON API routes.
const router = Router();

// The jobs list is the main page, so "/" simply sends the browser to it.
router.get("/", (req, res) => res.redirect("/jobs"));
router.get("/jobs", showJobsPage);
router.get("/applications", showApplicationsPage);
router.get("/my-applications", showMyApplicationsPage);
router.get("/signup", (req, res) => {
    if (res.locals.userId) return res.redirect("/jobs");   // already logged in
    res.render("signuppage", { title: "SignUp" });
});
router.get("/login", (req, res) => {
    if (res.locals.userId) return res.redirect("/jobs");   // already logged in
    res.render("loginpage", { title: "Login" });
});


export default router;
