// middleware/auth.middleware.ts
import { Request, Response, NextFunction } from "express";
import { verifyAdminToken, verifyLawyerToken } from "../services/auth.service";

interface CustomRequest extends Request {
    user?: {
        id: string;
        role?: "admin" | "lawyer";
    };
}

// Combined Authentication and Authorization Middleware
export const authenticate = () => {
    return (req: CustomRequest, res: Response, next: NextFunction) => {
        const token = req.cookies.token;

        if (!token) {
            return res.status(401).json({ message: "Unauthorized: No token provided" });
        }

        try {
            let decoded;

            try {
                // Verify admin token first
                decoded = verifyAdminToken(token);
                req.user = { id: decoded.id, role: "admin" };
            } catch {
                // If admin token fails, verify lawyer token
                decoded = verifyLawyerToken(token);
                req.user = { id: decoded.id, role: "lawyer" };
            }

            next();
        } catch (error) {
            if (error.name === "TokenExpiredError") {
                return res.status(401).json({ message: "Access token expired" });
            }
            return res.status(401).json({ message: "Unauthorized: Invalid token" });
        }
    };
};

// Authorization Middleware for Specific Roles
export const authenticateAndAuthorize = (roles: string[]) => {
    return (req: CustomRequest, res: Response, next: NextFunction) => {
        authenticate()(req, res, (authError) => {
            console.log("Authenticated user in middleware:", req.user);

            if (authError) return next(authError);

            if (roles.length && (!req.user || !roles.includes(req.user.role))) {
                return res.status(403).json({ message: "Forbidden: Access denied" });
            }

            next();
        });
    };
};