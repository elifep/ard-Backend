// controllers/lawyer.controller.ts
import { Request, Response } from "express";
import * as LawyerService from "../services/lawyer.service";
import CaseModel from "../models/case.model";

interface CustomRequest extends Request {
    user?: {
        id: string;
        role?: "admin" | "lawyer";
    };
}

// Get all cases for a lawyer
export const getCasesByLawyer = async (req: CustomRequest, res: Response) => {
    try {
        let cases;
        if (req.user?.role === "admin") {
            // Admin tüm davaları görebilir
            cases = await CaseModel.find()
                .populate("relatedRequest", "requestNumber name surname")
                .populate("lawyer", "fullName email");
        } else if (req.user?.role === "lawyer") {
            // Avukat sadece kendine atanmış davaları görebilir
            const lawyerId = req.user.id;
            cases = await LawyerService.getCasesByLawyer(lawyerId);
        } else {
            return res.status(403).json({ error: "Access denied" });
        }

        res.status(200).json(cases);
    } catch (error) {
        console.error("Error fetching cases:", error);
        res.status(500).json({ error: "Error fetching cases" });
    }
};

// Get a single case by ID for a lawyer
export const getCaseByIdAndLawyer = async (req: CustomRequest, res: Response) => {
    try {
        const lawyerId = req.user?.id as string;
        const singleCase = await LawyerService.getCaseByIdAndLawyer(req.params.id, lawyerId);
        res.status(200).json(singleCase);
    } catch (error) {
        console.error("Error fetching case:", error);
        res.status(500).json({ error: error.message || "Error fetching case" });
    }
};

// Get all requests for a lawyer
export const getRequestsByLawyer = async (req: CustomRequest, res: Response) => {
    try {
        const lawyerId = req.user?.id as string;
        const requests = await LawyerService.getRequestsByLawyer(lawyerId);
        res.status(200).json(requests);
    } catch (error) {
        console.error("Error fetching requests for lawyer:", error);
        res.status(500).json({ error: "Error fetching requests for lawyer" });
    }
};