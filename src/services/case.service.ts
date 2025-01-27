import CaseDetails from "../models/case.model";
import RequestModel from "../models/request.model";
import { uploadFile, generatePresignedUrl } from "../services/aws.service";

// Fetch all cases with signed URLs
export const getAllCases = async () => {
    const cases = await CaseDetails.find()
        .populate({
            path: "relatedRequest",
            select: "requestNumber name surname",
        })
        .populate({
            path: "lawyer",
            select: "fullName",
        });

    // Signed URL'leri oluştur
    const casesWithSignedUrls = await Promise.all(
        cases.map(async (caseData) => {
            if (caseData.documents) {
                // `documents` içerisindeki her bir array için signed URL oluşturuyoruz
                for (const [key, value] of Object.entries(caseData.documents)) {
                    if (Array.isArray(value)) {
                        caseData.documents[key] = await Promise.all(
                            value.map(async (fileUrl) => {
                                const key = fileUrl.split("amazonaws.com/")[1];
                                if (!key) {
                                    console.error("Invalid file URL:", fileUrl);
                                    return fileUrl; // Orijinal URL'yi döndür
                                }
                                const signedUrl = await generatePresignedUrl(key);
                                return signedUrl;
                            })
                        );
                    }
                }
            }
            return caseData;
        })
    );

    return casesWithSignedUrls;
};

// Fetch a single case by ID with signed URLs
export const getCaseById = async (caseId: string) => {
    const caseData = await CaseDetails.findById(caseId)
        .populate({
            path: "relatedRequest",
            select: "requestNumber name surname",
        })
        .populate({
            path: "lawyer",
            select: "fullName",
        });

    if (!caseData) {
        throw new Error("Case not found");
    }

    // Signed URL'leri oluştur
    if (caseData.documents) {
        for (const [key, value] of Object.entries(caseData.documents)) {
            if (Array.isArray(value)) {
                caseData.documents[key] = await Promise.all(
                    value.map(async (fileUrl) => {
                        const key = fileUrl.split("amazonaws.com/")[1];
                        if (!key) {
                            console.error("Invalid file URL:", fileUrl);
                            return fileUrl; // Orijinal URL'yi döndür
                        }
                        const signedUrl = await generatePresignedUrl(key);
                        return signedUrl;
                    })
                );
            }
        }
    }

    return caseData;
};

// Create a new case
export const createCase = async (caseData: any, lawyerId: string, files: any) => {
    // Check if files exist
    if (!files || typeof files !== "object") {
        throw new Error("No valid files provided");
    }

    // Prepare the documents object
    const documents = {
        hearingReports: [],
        petitions: [],
        hearingMinutes: [],
    };

    // Process each file type
    if (files.hearingReports) {
        documents.hearingReports = await Promise.all(
            files.hearingReports.map(async (file: Express.Multer.File) => {
                const fileKey = `cases/hearingReports/${Date.now()}_${file.originalname}`;
                const uploadedUrl = await uploadFile(fileKey, file.buffer, file.mimetype);
                return uploadedUrl; // S3 URL
            })
        );
    }

    if (files.petitions) {
        documents.petitions = await Promise.all(
            files.petitions.map(async (file: Express.Multer.File) => {
                const fileKey = `cases/petitions/${Date.now()}_${file.originalname}`;
                const uploadedUrl = await uploadFile(fileKey, file.buffer, file.mimetype);
                return uploadedUrl; // S3 URL
            })
        );
    }

    if (files.hearingMinutes) {
        documents.hearingMinutes = await Promise.all(
            files.hearingMinutes.map(async (file: Express.Multer.File) => {
                const fileKey = `cases/hearingMinutes/${Date.now()}_${file.originalname}`;
                const uploadedUrl = await uploadFile(fileKey, file.buffer, file.mimetype);
                return uploadedUrl; // S3 URL
            })
        );
    }

    // Create the case with uploaded file URLs
    const newCase = new CaseDetails({
        ...caseData,
        lawyer: lawyerId,
        documents, // Add documents to the new case
    });

    await newCase.save();
    return newCase;
};

// Update a case by ID
export const updateCaseById = async (
    caseId: string,
    updateData: any,
    files: any
) => {
    const caseData = await CaseDetails.findById(caseId);
    if (!caseData) throw new Error("Case not found");

    const documents = { ...caseData.documents };

    // Process new file uploads
    if (files.hearingReports) {
        documents.hearingReports = [
            ...documents.hearingReports,
            ...(await Promise.all(
                files.hearingReports.map(async (file: Express.Multer.File) => {
                    const fileKey = `cases/hearingReports/${Date.now()}_${file.originalname}`;
                    const uploadedUrl = await uploadFile(fileKey, file.buffer, file.mimetype);
                    return uploadedUrl;
                })
            )),
        ];
    }

    if (files.petitions) {
        documents.petitions = [
            ...documents.petitions,
            ...(await Promise.all(
                files.petitions.map(async (file: Express.Multer.File) => {
                    const fileKey = `cases/petitions/${Date.now()}_${file.originalname}`;
                    const uploadedUrl = await uploadFile(fileKey, file.buffer, file.mimetype);
                    return uploadedUrl;
                })
            )),
        ];
    }

    if (files.hearingMinutes) {
        documents.hearingMinutes = [
            ...documents.hearingMinutes,
            ...(await Promise.all(
                files.hearingMinutes.map(async (file: Express.Multer.File) => {
                    const fileKey = `cases/hearingMinutes/${Date.now()}_${file.originalname}`;
                    const uploadedUrl = await uploadFile(fileKey, file.buffer, file.mimetype);
                    return uploadedUrl;
                })
            )),
        ];
    }

    // Update case with new data
    return await CaseDetails.findByIdAndUpdate(
        caseId,
        { ...updateData, documents },
        { new: true, runValidators: true }
    );
};

// Delete a case by ID
export const deleteCaseById = async (caseId: string) => {
    const caseDetails = await CaseDetails.findById(caseId);
    if (!caseDetails) {
        throw new Error("Case not found");
    }

    // Clear caseDetails reference in the related request
    if (caseDetails.relatedRequest) {
        const request = await RequestModel.findById(caseDetails.relatedRequest);
        if (request) {
            request.caseDetails = null;
            await request.save();
        }
    }

    return await CaseDetails.findByIdAndDelete(caseId);
};