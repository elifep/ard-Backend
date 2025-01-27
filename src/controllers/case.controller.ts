import { Request, Response } from "express";
import * as CaseService from "../services/case.service";

interface CustomRequest extends Request {
    user?: {
        id: string;
        role?: "admin" | "lawyer";
    };
}

// Get all cases
export const getAllCases = async (_req: Request, res: Response) => {
    try {
        const cases = await CaseService.getAllCases();
        res.status(200).json(cases);
    } catch (error) {
        console.error("Error fetching cases:", error);
        res.status(500).json({ error: "Error fetching cases" });
    }
};

// Get a single case by ID
export const getCaseById = async (req: Request, res: Response) => {
    try {
        const singleCase = await CaseService.getCaseById(req.params.id);
        if (!singleCase) {
            res.status(404).json({ error: "Case not found" });
            return;
        }
        res.status(200).json(singleCase);
    } catch (error) {
        console.error("Error fetching case:", error);
        res.status(500).json({ error: "Error fetching case" });
    }
};

// Create a new case
export const createCase = async (req: CustomRequest, res: Response) => {
    try {
        // Get authenticated lawyer ID
        const lawyerId = req.user?.id as string;

        // Check if the user is authenticated
        if (!lawyerId) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        // Call the service to create a new case
        const newCase = await CaseService.createCase(req.body, lawyerId, req.files);
        console.log("New Case:", newCase);

        res.status(201).json(newCase);
    } catch (error) {
        console.error("Error creating case:", error);
        res.status(500).json({ error: error.message || "Error creating case" });
    }
};

// Update a case by ID
export const updateCaseById = async (req: Request, res: Response) => {
    try {
        const updatedCase = await CaseService.updateCaseById(
            req.params.id,
            req.body,
            req.files as Express.Multer.File[]
        );
        if (!updatedCase) {
            res.status(404).json({ error: "Case not found" });
            return;
        }
        console.log("Updated Case:", updatedCase);
        res.status(200).json(updatedCase);
    } catch (error) {
        console.error("Error updating case:", error);
        res.status(500).json({ error: "Error updating case" });
    }
};

// Delete a case by ID
export const deleteCaseById = async (req: Request, res: Response) => {
    try {
        const deletedCase = await CaseService.deleteCaseById(req.params.id);
        if (!deletedCase) {
            res.status(404).json({ error: "Case not found" });
            return;
        }
        res.status(200).json({ message: "Case deleted successfully" });
    } catch (error) {
        console.error("Error deleting case:", error);
        res.status(500).json({ error: "Error deleting case" });
    }
};