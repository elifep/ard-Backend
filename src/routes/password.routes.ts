import express from "express";
import {
    resetPasswordController,
} from "../controllers/password.controller";

const router = express.Router();

// Şifre sıfırlama talebi
router.post("/reset-password/request", resetPasswordController);

// Yeni şifre belirleme
router.post("/reset-password/confirm", resetPasswordController);

export default router;