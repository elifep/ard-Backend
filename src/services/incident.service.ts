import Incident from "../models/incident.model";

// Service to fetch all incidents
export const getAllIncidents = async () => {
    return await Incident.find();
};

// Service to fetch a single incident by ID
export const getIncidentById = async (incidentId: string) => {
    return await Incident.findById(incidentId);
};

// Service to fetch unique categories
export const getCategories = async (): Promise<string[]> => {
    // Tüm incidentları çekip kategorileri filtreler
    const incidents = await Incident.find().select("category");
    const uniqueCategories = [...new Set(incidents.map((incident) => incident.category))];
    return uniqueCategories;
};

// Service to create a new incident
export const createIncident = async (incidentData: any) => {
    const newIncident = new Incident(incidentData);
    await newIncident.save();
    return newIncident;
};

// Service to update an incident by ID
export const updateIncidentById = async (incidentId: string, updateData: any) => {
    return await Incident.findByIdAndUpdate(incidentId, updateData, {
        new: true, // Return the updated document
        runValidators: true, // Validate the updated fields
    });
};

// Service to delete an incident by ID
export const deleteIncidentById = async (incidentId: string) => {
    return await Incident.findByIdAndDelete(incidentId);
};