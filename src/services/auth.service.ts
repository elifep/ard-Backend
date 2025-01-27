import jwt, { JwtPayload } from "jsonwebtoken";
import { JWT_SECRET, USERJWT_SECRET, REFRESHJWT_SECRET } from "../config/environment";

// Generate Admin Token
export const generateAdminToken = (payload: object, expiresIn: string = "10m") => {
    return jwt.sign(payload, JWT_SECRET, { expiresIn });
};

// Generate Lawyer Token
export const generateLawyerToken = (payload: object, expiresIn: string = "10m") => {
    return jwt.sign(payload, USERJWT_SECRET, { expiresIn });
};

// Generate Refresh Token
export const generateRefreshToken = (payload: object, expiresIn: string = "5d") => {
    return jwt.sign(payload, REFRESHJWT_SECRET, { expiresIn });
};

// Verify Admin Token
export const verifyAdminToken = (token: string) => {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (error) {
        throw new Error("Invalid admin token");
    }
};

// Verify Lawyer Token
export const verifyLawyerToken = (token: string) => {
    try {
        return jwt.verify(token, USERJWT_SECRET);
    } catch (error) {
        throw new Error("Invalid lawyer token");
    }
};

// Verify Refresh Token
export const verifyRefreshToken = (token: string): JwtPayload => {
    try {
        const decoded = jwt.verify(token, REFRESHJWT_SECRET);
        if (typeof decoded === "string") {
            throw new Error("Invalid token payload");
        }
        return decoded;
    } catch (error) {
        throw new Error("Invalid refresh token");
    }
};