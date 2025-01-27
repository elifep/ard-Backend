import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import logger from "../utils/logger";
import User from "../models/user.model";
import {
    generateAdminToken,
    generateLawyerToken,
    generateRefreshToken,
    verifyRefreshToken,
} from "../services/auth.service";

interface CustomRequest extends Request {
    user?: {
        id: string;
        role?: "admin" | "lawyer";
    };
}

// Kullanıcı Giriş
export const loginUser = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;

        // Environment'taki admin kontrolü
        if (email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD) {
            const accessToken = generateAdminToken({ role: "admin", id: "env-admin" });
            const refreshToken = generateRefreshToken({ role: "admin", id: "env-admin" });

            logger.info("Master admin logged in", { email, role: "admin", ip: req.ip });

            res.cookie("refreshToken", refreshToken, {
                httpOnly: true,
                sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
                secure: process.env.NODE_ENV === "production",
            });

            res.cookie("token", accessToken, {
                httpOnly: true,
                sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
                secure: process.env.NODE_ENV === "production",
            });

            return res.status(200).json({
                message: "Admin login successful",
                token: accessToken,
                refreshToken,
                user: { id: "env-admin", role: "admin" },
            });
        }

        // Veritabanındaki kullanıcı kontrolü
        const user = await User.findOne({ email });
        if (!user) {
            logger.warn("Login failed - User not found", { email, ip: req.ip });
            return res.status(404).json({ error: "User not found" });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            logger.warn("Login failed - Invalid password", { email, ip: req.ip });
            return res.status(401).json({ error: "Invalid credentials" });
        }

        // Eski refresh tokenı kontrol et ve geçersiz kıl
        if (user.refreshToken) {
            user.refreshToken = null; // Eski tokenı temizle
            await user.save();
        }

        // Yeni token'ları oluştur
        const accessToken =
            user.role === "admin"
                ? generateAdminToken({ id: user._id, role: user.role })
                : generateLawyerToken({ id: user._id, role: user.role });

        const refreshToken = generateRefreshToken({ id: user._id, role: user.role });

        // Kullanıcının refresh tokenını güncelleyin (tekil hale getirme)
        user.refreshToken = refreshToken;
        await user.save();

        logger.info("User logged in successfully", { email, role: user.role, ip: req.ip });

        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
            secure: process.env.NODE_ENV === "production",
        });

        res.cookie("token", accessToken, {
            httpOnly: true,
            sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
            secure: process.env.NODE_ENV === "production",
        });

        res.status(200).json({
            message: "Login successful",
            token: accessToken,
            refreshToken,
            user: { id: user._id, role: user.role },
        });
    } catch (error) {
        logger.error("Error during login", { message: error.message, stack: error.stack });
        res.status(500).json({ error: "Error logging in user" });
    }
};

// Refresh Token Endpoint
export const refreshToken = async (req: Request, res: Response) => {
    const { refreshToken } = req.cookies;

    if (!refreshToken) {
        logger.warn("Refresh token missing in request", { ip: req.ip });
        return res.status(400).json({ error: "Refresh token is required" });
    }

    try {
        const decoded = verifyRefreshToken(refreshToken);

        if (!decoded.role || !decoded.id) {
            logger.warn("Invalid refresh token payload", { ip: req.ip });
            return res.status(400).json({ error: "Invalid token payload" });
        }

        logger.info("Token yenileme işlemi başlatıldı.", { ip: req.ip });

        if (decoded.id === "env-admin" && decoded.role === "admin") {
            const newAccessToken = generateAdminToken({ id: decoded.id, role: decoded.role });
            const newRefreshToken = generateRefreshToken({ id: decoded.id, role: decoded.role });

            logger.info("Master admin refreshed tokens", { role: decoded.role, ip: req.ip });

            res.cookie("refreshToken", newRefreshToken, {
                httpOnly: true,
                sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
                secure: process.env.NODE_ENV === "production",
            });

            res.cookie("token", newAccessToken, {
                httpOnly: true,
                sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
                secure: process.env.NODE_ENV === "production",
            });

            logger.info("Yeni access token oluşturuldu.", { userId: decoded.id });

            return res.status(200).json({ accessToken: newAccessToken });
        }

        const user = await User.findOne({ _id: decoded.id, refreshToken });
        if (!user) {
            logger.warn("Invalid refresh token detected", { userId: decoded.id, ip: req.ip });
            return res.status(401).json({ error: "Invalid refresh token" });
        }

        // Yeni Token'ları oluştur
        const newRefreshToken = generateRefreshToken({ id: user._id, role: user.role });
        user.refreshToken = newRefreshToken; // Yeni token'ı kaydet
        await user.save();

        const newAccessToken =
            user.role === "admin"
                ? generateAdminToken({ id: user._id, role: user.role })
                : generateLawyerToken({ id: user._id, role: user.role });

        logger.info("Refresh token used successfully", {
            userId: user._id,
            email: user.email,
            role: user.role,
            ip: req.ip,
        });

        res.cookie("refreshToken", newRefreshToken, {
            httpOnly: true,
            sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
            secure: process.env.NODE_ENV === "production",
        });

        res.cookie("token", newAccessToken, {
            httpOnly: true,
            sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
            secure: process.env.NODE_ENV === "production",
        });

        res.status(200).json({ accessToken: newAccessToken });
    } catch (error) {
        logger.error("Error during token refresh", { message: error.message, stack: error.stack });
        res.status(401).json({ error: "Invalid refresh token" });
    }
};

// Kullanıcı Logout
export const logoutUser = (req: Request, res: Response): void => {
    res.clearCookie("token", {
        httpOnly: true,
        sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
        secure: process.env.NODE_ENV === "production",
    });

    res.clearCookie("refreshToken", {
        httpOnly: true,
        sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
        secure: process.env.NODE_ENV === "production",
    });

    res.status(200).json({ message: "Logged out successfully" });
};

// Kullanıcı Doğrulama
export const verifyUser = (req: CustomRequest, res: Response) => {
    if (!req.user || !req.user.id) {
        return res.status(401).json({ message: "Unauthorized: Invalid token or user ID missing" });
    }

    console.log("User ID:", req.user.id);
    console.log("User Role:", req.user.role);
    res.status(200).json({ id: req.user.id, role: req.user.role });
};