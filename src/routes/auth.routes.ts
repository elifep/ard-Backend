import express from "express";
import { loginUser, logoutUser, verifyUser, refreshToken } from "../controllers/auth.controller";
import { authenticate } from "../middleware/auth.middleware";

const router = express.Router();

router.post("/login", loginUser);
router.post("/logout", authenticate(), logoutUser);
router.post("/refresh-token", refreshToken);
router.get("/verify", authenticate(), verifyUser);

export default router;