import { Request, Response } from "express";
import * as RequestService from "../services/request.service";
import { uploadFile } from "../services/aws.service";
import RequestModel from "../models/request.model";
import IncidentModel from "../models/incident.model";
import logger from "../utils/logger";

interface CustomRequest extends Request {
    user?: {
        id: string;
        role?: "admin" | "lawyer";
    };
}

// Get All Requests
export const getAllRequests = async (_req: Request, res: Response) => {
    try {
        const requests = await RequestService.getAllRequests();
        res.status(200).json(requests);
    } catch (error) {
        console.error("Error fetching requests:", error);
        res.status(500).json({ error: "Error fetching requests" });
    }
};

// Get Single Request by ID
export const getRequestById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const request = await RequestService.getRequestById(req.params.id);
        if (!request) {
            res.status(404).json({ error: "Request with the given ID not found" });
            return;
        }
        res.status(200).json(request);
    } catch (error) {
        console.error("Error fetching request:", error);
        res.status(500).json({ error: "Error fetching request" });
    }
};

// Create New Request with File Upload
export const createRequest = async (req: CustomRequest, res: Response) => {
    try {
        // Kullanıcı bilgilerini al (JWT'den veya req.user'dan)
        const userId = req.user?.id || "Unknown User";
        const userRole = req.user?.role || "Unknown Role";

        // Multer tarafından ayrıştırılan dosyalar
        const submissionsFiles = req.files['submissions'] as Express.Multer.File[] || [];
        const incidentFiles = req.files['incidentFiles'] as Express.Multer.File[] || [];

        // Body'den gelen veriler
        const { submissions, Incidents, ...otherData } = req.body;

        // Log: İstek alındı
        logger.info('New request creation initiated', {
            userId,
            userRole,
            requestBody: req.body,
        });

        const cleanData = (otherData) => {
            Object.keys(otherData).forEach((key) => {
                if (otherData[key] === null || otherData[key] === "") {
                    delete otherData[key]; // Alanı tamamen kaldır
                }
            });
            return otherData;
        };

        console.log("Other Data:", otherData);
        console.log("Submissions Files:", submissionsFiles);
        console.log("Incident Files:", incidentFiles);


        // 1. Submissions Dosya Yükleme
        const submissionUrls = await Promise.all(
            submissionsFiles.map(async (file, index) => {
                const description = submissions?.[index]?.documentDescription || "Açıklama yok";
                const fileUrl = await uploadFile(`submissions/${Date.now()}_${file.originalname}`, file.buffer, file.mimetype);
                return { document: fileUrl, documentDescription: description };
            })
        );

        // 2. Incident Dosya Yükleme
        const incidentUrls = await Promise.all(
            incidentFiles.map(async (file) => {
                const fileUrl = await uploadFile(`incidents/${Date.now()}_${file.originalname}`, file.buffer, file.mimetype);
                return fileUrl; // Dosya URL'sini döndür
            })
        );

        console.log("Incidents:", incidentUrls);

        // 3. Incident Nesnesi Oluştur
        let parsedIncidents = {};
        if (Incidents && typeof Incidents === 'string') {
            parsedIncidents = JSON.parse(Incidents);
        }
        console.log("Parsed Incident Data:", parsedIncidents);
        // `uploadedFile` alanını incidentUrls ile dolduruyoruz
        const newIncident = new IncidentModel({
            ...parsedIncidents,
            uploadedFile: incidentUrls, // Dosya URL'lerini ekle
        });
        const savedIncident = await newIncident.save();
        console.log("Saved Incident:", savedIncident);

        const requestData = cleanData(req.body);

        // 4. Yeni Request Oluştur
        const newRequest = new RequestModel({
            ...requestData,
            submissions: submissionUrls,
            Incidents: savedIncident._id, // Incident ID'sini ekle
        });
        console.log("New Request Object:", newRequest);

        await newRequest.save();

        // Log: Başarıyla oluşturuldu
        logger.info('Request created successfully', {
            userId,
            userRole,
            requestId: newRequest._id,
            incidentId: savedIncident._id,
        });

        res.status(201).json(newRequest);
    } catch (error) {
        if (error.name === "ValidationError") {
            logger.error('Error creating request', {
                error: error.message,
                stack: error.stack,
            });
            // Handle Mongoose validation errors
            const errors = Object.keys(error.errors).reduce((acc, key) => {
                acc[key] = error.errors[key].message;
                return acc;
            }, {});
            return res.status(400).json({ errors });
        }
        console.error("Error creating request:", error);
        res.status(500).json({ error: error.message });
    }
};

// Update Request by ID with Optional File Upload
export const updateRequestById = async (req: Request, res: Response) => {
    try {
        const requestId = req.params.id;

        // Multer tarafından ayrıştırılan dosyalar
        const files = req.files as { [fieldname: string]: Express.Multer.File[] };

        // Gelen veriler
        const { submissions, Incidents, ...otherData } = req.body;

        // Boş stringleri null yapma işlemi
        // Verileri temizle
        const cleanData = (data) => {
            Object.keys(data).forEach((key) => {
                if (data[key] === "" || data[key] === null || data[key] === undefined) {
                    data[key] = null; // Boş stringleri veya geçersiz değerleri null yap
                }
                if (Array.isArray(data[key])) {
                    data[key] = data[key].filter((item) => item && item.trim() !== ''); // Boş elemanları kaldır
                }
            });
            return data;
        };

        // Gelen verileri temizle
        const cleanedData = cleanData(otherData);

        // RequestService çağrısı
        const updatedRequest = await RequestService.updateRequestById(
            requestId,
            { ...cleanedData, submissions, Incidents },
            files
        );

        res.status(200).json(updatedRequest);
    } catch (error) {
        if (error.name === "ValidationError") {
            // Handle Mongoose validation errors
            const errors = Object.keys(error.errors).reduce((acc, key) => {
                acc[key] = error.errors[key].message;
                return acc;
            }, {});
            return res.status(400).json({ errors });
        }
        console.error("Error updating request:", error);
        res.status(500).json({ error: error.message });
    }
};

// Delete Request by ID
export const deleteRequestById = async (req: Request, res: Response) => {
    try {
        const requestId = req.params.id;
        const deletedRequest = await RequestService.deleteRequestById(requestId);
        if (!deletedRequest) {
            res.status(404).json({ error: "Request with the given ID not found" });
            return;
        }
        res.status(200).json({ message: "Request deleted successfully" });
    } catch (error) {
        console.error("Error deleting request:", error);
        res.status(500).json({ error: "Error deleting request" });
    }
};

// Update Request Status
export const updateRequestStatus = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const updatedRequest = await RequestService.updateRequestStatusService(id, status);

        res.status(200).json({
            message: "Status updated successfully",
            request: updatedRequest,
        });
    } catch (error: any) {
        console.error("Error updating status:", error.message);
        if (error.message === "Invalid status value") {
            return res.status(400).json({ error: error.message });
        } else if (error.message === "Request not found") {
            return res.status(404).json({ error: error.message });
        }
        res.status(500).json({ error: "Error updating status" });
    }
};