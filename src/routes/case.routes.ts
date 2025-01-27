import express from "express";
import {
    getAllCases,
    getCaseById,
    createCase,
    updateCaseById,
    deleteCaseById,
} from "../controllers/case.controller";
import { uploadFields } from "../config/upload";

const router = express.Router();

// Route to Get All Cases
router.get("/", getAllCases);

// Route to Get a Single Case by ID
router.get("/:id", getCaseById);

// Kimlik doğrulama ve yetkilendirme ekleniyor
router.post("/", uploadFields, createCase);

// Route to Update a Case by ID
router.put("/:id", uploadFields, updateCaseById);

// Route to Delete a Case by ID
router.delete("/:id", deleteCaseById);

export default router;