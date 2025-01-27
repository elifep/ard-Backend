import express from "express";
import {
    getAllIncidents,
    getIncidentById,
    getCategories,
    createIncident,
    updateIncidentById,
    deleteIncidentById,
} from "../controllers/incident.controller";

const router = express.Router();

// Sabit rotaları önce tanımlayın
router.get("/categories", getCategories);

// Daha sonra dinamik rotaları tanımlayın
router.get("/:id", getIncidentById);

// Diğer rotalar
router.get("/", getAllIncidents);
router.post("/", createIncident);
router.put("/:id", updateIncidentById);
router.delete("/:id", deleteIncidentById);

export default router;