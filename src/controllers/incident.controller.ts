import { Request, Response } from "express";
import * as IncidentService from "../services/incident.service";

// Get All Incidents
export const getAllIncidents = async (_req: Request, res: Response) => {
    try {
        const incidents = await IncidentService.getAllIncidents();
        res.status(200).json(incidents);
    } catch (error) {
        console.error("Error fetching incidents:", error);
        res.status(500).json({ error: "Error fetching incidents" });
    }
};

// Get Single Incident by ID
export const getIncidentById = async (req: Request, res: Response) => {
    try {
        const incident = await IncidentService.getIncidentById(req.params.id);
        if (!incident) {
            res.status(404).json({ error: "Incident not found" });
            return;
        }
        res.status(200).json(incident);
    } catch (error) {
        console.error("Error fetching incident:", error);
        res.status(500).json({ error: "Error fetching incident" });
    }
};

// Get Categories
export const getCategories = async (_req: Request, res: Response) => {
    try {
        const categories = await IncidentService.getCategories();
        res.status(200).json(categories);
    } catch (error) {
        console.error("Error fetching categories:", error);
        res.status(500).json({ error: "Error fetching categories" });
    }
};

// Create New Incident
export const createIncident = async (req: Request, res: Response) => {
    try {
        const newIncident = await IncidentService.createIncident(req.body);
        res.status(201).json(newIncident);
    } catch (error) {
        console.error("Error creating incident:", error);
        res.status(500).json({ error: "Error creating incident" });
    }
};

// Update Incident by ID
export const updateIncidentById = async (req: Request, res: Response) => {
    try {
        const updatedIncident = await IncidentService.updateIncidentById(req.params.id, req.body);
        if (!updatedIncident) {
            res.status(404).json({ error: "Incident not found" });
            return;
        }
        res.status(200).json(updatedIncident);
    } catch (error) {
        console.error("Error updating incident:", error);
        res.status(500).json({ error: "Error updating incident" });
    }
};

// Delete Incident by ID
export const deleteIncidentById = async (req: Request, res: Response) => {
    try {
        const deletedIncident = await IncidentService.deleteIncidentById(req.params.id);
        if (!deletedIncident) {
            res.status(404).json({ error: "Incident not found" });
            return;
        }
        res.status(200).json({ message: "Incident deleted successfully" });
    } catch (error) {
        console.error("Error deleting incident:", error);
        res.status(500).json({ error: "Error deleting incident" });
    }
};