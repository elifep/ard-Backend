import express from "express";
import {
    getCasesByLawyer,
    getCaseByIdAndLawyer,
    getRequestsByLawyer,
} from "../controllers/lawyer.controller";

const router = express.Router();

// Get all cases for a lawyer
router.get("/cases",  getCasesByLawyer);

// Get a single case by Id for a lawyer
router.get("/cases/:id", getCaseByIdAndLawyer);

//  Get all requests for a lawyer
router.get("/requests", getRequestsByLawyer);

export default router;