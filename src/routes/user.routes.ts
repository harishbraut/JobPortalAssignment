import { Router } from "express";
import { signup, login, logout } from "../controller/user.controller.js";
// import { validateSecurityKey } from "../middlewares/validate-key.middleware.js";

const router = Router();

router.post("/signup", signup);
router.post("/login", login);
router.get("/logout", logout);

export default router;
