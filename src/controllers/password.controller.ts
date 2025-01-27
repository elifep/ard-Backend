import { Request, Response } from "express";
import * as PasswordService from "../services/password.service";

// login sayfasında sifre sıfırlama
export const resetPasswordController = async (req: Request, res: Response) => {
    try {
        const { token, newPassword } = req.body;

        if (!token || !newPassword) {
            return res.status(400).json({ error: "Token and new password are required." });
        }

        const result = await PasswordService.resetPassword(token, newPassword);

        res.status(200).json(result);
    } catch (error) {
        console.error("Error resetting password:", error);
        res.status(500).json({ error: error.message });
    }
};
