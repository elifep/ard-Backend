import mongoose from "mongoose";
import RequestModel from "../models/request.model";
import UserModel from "../models/user.model";
import IncidentModel, { IIncident } from "../models/incident.model";

import { deleteFile, generatePresignedUrl, uploadFile } from "./aws.service";

// Fetch all requests with case details and incident information
export const getAllRequests = async () => {
    const requests = await RequestModel.find()
        .populate({
            path: "receivedBy",
            select: "fullName",
        })
        .populate({
            path: "assignedLawyer",
            select: "fullName",
        })
        .populate({
            path: "Incidents",
            select: "-__v -updatedAt -createdAt",
        });

    const requestsWithSignedUrls = await Promise.all(
        requests.map(async (request) => {
            // Handle submissions
            if (request.submissions && Array.isArray(request.submissions)) {
                request.submissions = await Promise.all(
                    request.submissions.map(async (submission) => {
                        if (submission.document.startsWith("http")) {
                            const key = submission.document.split("amazonaws.com/")[1];
                            submission.document = await generatePresignedUrl(key);
                        }
                        return submission;
                    })
                );
            }

            // Handle populated Incidents
            if (request.Incidents && !(request.Incidents instanceof mongoose.Types.ObjectId)) {
                const incident = request.Incidents as IIncident;

                if (Array.isArray(incident.uploadedFile)) {
                    incident.uploadedFile = await Promise.all(
                        incident.uploadedFile.map(async (fileUrl) => {
                            if (fileUrl.startsWith("http")) {
                                const key = fileUrl.split("amazonaws.com/")[1];
                                return await generatePresignedUrl(key);
                            }
                            return fileUrl;
                        })
                    );
                }
            }

            return request;
        })
    );

    return requestsWithSignedUrls;
};

// Fetch a single request by ID with case details and incident information
export const getRequestById = async (requestId: string) => {
    if (!mongoose.Types.ObjectId.isValid(requestId)) {
        throw new Error("Invalid requestId format.");
    }

    const request = await RequestModel.findById(requestId)
        .populate({
            path: "receivedBy",
            select: "fullName",
        })
        .populate({
            path: "assignedLawyer",
            select: "fullName",
        })
        .populate({
            path: "Incidents",
            select: "-__v -updatedAt -createdAt",
        });

    if (request) {
        // Handle submissions
        if (request.submissions && Array.isArray(request.submissions)) {
            request.submissions = await Promise.all(
                request.submissions.map(async (submission) => {
                    if (submission.document.startsWith("http")) {
                        const key = submission.document.split("amazonaws.com/")[1];
                        submission.document = await generatePresignedUrl(key);
                    }
                    return submission;
                })
            );
        }

        // Handle populated Incidents
        if (request.Incidents && !(request.Incidents instanceof mongoose.Types.ObjectId)) {
            const incident = request.Incidents as IIncident;

            if (Array.isArray(incident.uploadedFile)) {
                incident.uploadedFile = await Promise.all(
                    incident.uploadedFile.map(async (fileUrl) => {
                        if (fileUrl.startsWith("http")) {
                            const key = fileUrl.split("amazonaws.com/")[1];
                            return await generatePresignedUrl(key);
                        }
                        return fileUrl;
                    })
                );
            }
        }
    }

    return request;
};

// Create a new request with optional file upload
export const createRequest = async (requestData: any, files?: Express.Multer.File[]) => {
    let { Incidents, assignedLawyer, receivedBy, submissions, ...otherRequestData } = requestData;

    // Gelen veriyi loglayarak kontrol edin
    console.log("Received Request Data:", requestData);
    console.log("Received Incidents:", Incidents);

    // 1. `Incidents` kontrolü
    if (Incidents && typeof Incidents === 'string') {
        try {
            Incidents = JSON.parse(Incidents); // Eğer stringse parse et
        } catch (error) {
            throw new Error('Invalid Incidents format. Expected JSON object.');
        }
    }
    if (Incidents && typeof Incidents !== 'object') {
        throw new Error('Invalid Incidents data: Expected an object.');
    }

    // 2. `receivedBy` kullanıcı doğrulama
    if (receivedBy) {
        if (!mongoose.Types.ObjectId.isValid(receivedBy)) {
            throw new Error("Invalid ObjectId for receivedBy.");
        }
        const receivedByUser = await UserModel.findById(receivedBy);
        if (!receivedByUser || receivedByUser.role !== "admin") {
            throw new Error("receivedBy field must reference an admin user.");
        }
    }

    // 3. `assignedLawyer` kullanıcı doğrulama
    let lawyerUser = null;
    if (assignedLawyer) {
        if (!mongoose.Types.ObjectId.isValid(assignedLawyer)) {
            throw new Error("Invalid ObjectId for assignedLawyer.");
        }
        lawyerUser = await UserModel.findById(assignedLawyer);
        if (!lawyerUser || lawyerUser.role !== "lawyer") {
            throw new Error("assignedLawyer field must reference a lawyer user.");
        }
    }

    // 4. Dosya yükleme işlemi
    const uploadedFileUrls = await Promise.all(
        files.map(async (file, index) => {
            const description = requestData.submissions[index]?.documentDescription || "Açıklama yok";
            const fileKey = `requests/${Date.now()}_${file.originalname}`;
            try {
                const fileUrl = await uploadFile(fileKey, file.buffer, file.mimetype);
                return { document: fileUrl, documentDescription: description };
            } catch (error) {
                console.error("S3 yükleme hatası:", error);
                throw new Error("Dosya yükleme sırasında hata oluştu.");
            }
        })
    );

    // 5. Incident oluşturma
    let incidentId = null;
    if (Incidents) {
        const newIncident = new IncidentModel(Incidents);
        const savedIncident = await newIncident.save();
        incidentId = savedIncident._id;
    }

    // 6. Request oluşturma
    const newRequest = new RequestModel({
        ...otherRequestData,
        submissions: uploadedFileUrls,
        receivedBy,
        assignedLawyer,
        Incidents: incidentId,
    });

    console.log("New request created service:", newRequest);

    await newRequest.save();

    // 7. Avukata request ilişkilendir
    if (lawyerUser) {
        lawyerUser.requests = lawyerUser.requests || [];
        lawyerUser.requests.push(newRequest._id);
        await lawyerUser.save();
    }

    // 8. Incident ilişkilendir
    if (incidentId) {
        await IncidentModel.findByIdAndUpdate(incidentId, { relatedRequest: newRequest._id });
    }

    return newRequest;
};

// Update an existing request by ID with optional file upload
export const updateRequestById = async (
    requestId: string,
    updateData: any,
    files?: { [fieldname: string]: Express.Multer.File[] }
) => {
    console.log("Received Update Data:", updateData);
    console.log("Received Files:", files);
    console.log("RequestID:", requestId);
    if (!mongoose.Types.ObjectId.isValid(requestId)) {
        throw new Error("Invalid requestId format.");
    }

    // Mevcut request'i bulun ve `Incidents` ile birlikte doldurun
    const existingRequest = await RequestModel.findById(requestId)
        .populate({
            path: "Incidents",
            select: "uploadedFile", // Yalnızca `uploadedFile` alanını alıyoruz
        })
        .exec();

    if (!existingRequest) {
        throw new Error("Request not found.");
    }

    const { Incidents, removedFiles, removedIncidentFiles, assignedLawyer, receivedBy, caseDetails, ...otherUpdateData } = updateData;

    // 1. `receivedBy` kullanıcı doğrulama
    if (receivedBy) {
        if (!mongoose.Types.ObjectId.isValid(receivedBy)) {
            throw new Error("Invalid ObjectId for receivedBy.");
        }
        const receivedByUser = await UserModel.findById(receivedBy);
        if (!receivedByUser || receivedByUser.role !== "admin") {
            throw new Error("receivedBy field must reference an admin user.");
        }
        otherUpdateData.receivedBy = receivedByUser._id;
    }

    // 2. `assignedLawyer` kullanıcı doğrulama ve güncelleme
    if (assignedLawyer) {
        if (!mongoose.Types.ObjectId.isValid(assignedLawyer)) {
            throw new Error("Invalid ObjectId for assignedLawyer.");
        }
        const newLawyer = await UserModel.findById(assignedLawyer);
        if (!newLawyer || newLawyer.role !== "lawyer") {
            throw new Error("assignedLawyer field must reference a lawyer user.");
        }

        // Remove from old lawyer
        if (existingRequest.assignedLawyer) {
            await UserModel.findByIdAndUpdate(existingRequest.assignedLawyer, {
                $pull: { requests: requestId },
            });
        }

        // Add to new lawyer
        await UserModel.findByIdAndUpdate(assignedLawyer, {
            $addToSet: { requests: requestId },
        });

        otherUpdateData.assignedLawyer = newLawyer._id;
    }

    // Handle caseDetails
    if (caseDetails && caseDetails !== "null") {
        if (!mongoose.Types.ObjectId.isValid(caseDetails)) {
            throw new Error("Invalid ObjectId for caseDetails.");
        }
        otherUpdateData.caseDetails = caseDetails;
    } else {
        delete otherUpdateData.caseDetails;
    }

    // 3. Dosya Yükleme İşlemleri
    let updatedSubmissions = existingRequest.submissions || [];
    const incomingSubmissions = updateData.submissions || [];

    // 1. Submissions: Eklenen dosyalar
    if (files?.newSubmissions?.length > 0) {
        const uploadedNewFiles = await Promise.all(
            files.newSubmissions.map(async (file) => {
                const fileKey = `requests/${Date.now()}_${file.originalname}`;
                const fileUrl = await uploadFile(fileKey, file.buffer, file.mimetype);
                return { document: fileUrl, documentDescription: "Uploaded new file" };
            })
        );
        updatedSubmissions = [...updatedSubmissions, ...uploadedNewFiles];
    }

    // 2. Submissions: Silinen dosyalar
    if (Array.isArray(removedFiles) && removedFiles.length > 0) {
        // Geçersiz değerleri filtrele
        const validRemovedFiles = removedFiles.filter((fileUrl) => fileUrl && fileUrl.trim() !== '');
        await Promise.all(
            validRemovedFiles.map((fileUrl) => {
                const fileKey = fileUrl.split("/").pop();
                return deleteFile(fileKey);
            })
        );
        updatedSubmissions = updatedSubmissions.filter(
            (submission) => !validRemovedFiles.includes(submission.document)
        );
    }

    // **Incident Dosyalarını Güncelleme**
    let updatedIncidentFiles: string[] = [];
    if (existingRequest.Incidents && typeof existingRequest.Incidents === "object") {
        const incidentDoc = existingRequest.Incidents as unknown as { uploadedFile: string[] };

        if (incidentDoc?.uploadedFile) {
            updatedIncidentFiles = incidentDoc.uploadedFile;
        }
    }

    const incomingIncidentFiles = updateData.Incidents?.uploadedFile || [];

    // 1. Incident Files: Eklenen dosyalar
    if (files?.newIncidentFiles) {
        const uploadedNewIncidentFiles = await Promise.all(
            files.newIncidentFiles.map(async (file) => {
                const fileKey = `incidents/${Date.now()}_${file.originalname}`;
                const fileUrl = await uploadFile(fileKey, file.buffer, file.mimetype);
                return fileUrl;
            })
        );
        updatedIncidentFiles = [...incomingIncidentFiles, ...uploadedNewIncidentFiles];
    }

    // 2. Incident Files: Silinen dosyalar
    if (removedIncidentFiles) {
        await Promise.all(
            removedIncidentFiles.map((fileUrl) => {
                const fileKey = fileUrl.split("/").pop();
                return deleteFile(fileKey);
            })
        );
        updatedIncidentFiles = updatedIncidentFiles.filter(
            (fileUrl) => !removedIncidentFiles.includes(fileUrl)
        );
    }

    // 4. Incident güncellemesi
    if (Incidents) {
        let parsedIncidents;

        // Incidents verisini parse et
        if (typeof Incidents === "string") {
            try {
                parsedIncidents = JSON.parse(Incidents);
            } catch (error) {
                throw new Error("Invalid Incidents data format.");
            }
        } else {
            parsedIncidents = Incidents;
        }

        if (parsedIncidents._id && mongoose.Types.ObjectId.isValid(parsedIncidents._id)) {
            await IncidentModel.findByIdAndUpdate(
                parsedIncidents._id,
                { ...parsedIncidents, uploadedFile: updatedIncidentFiles },
                { new: true }
            );
        } else {
            const newIncident = new IncidentModel({
                ...parsedIncidents,
                uploadedFile: updatedIncidentFiles,
            });
            const savedIncident = await newIncident.save();
            otherUpdateData.Incidents = savedIncident._id;
        }
    }

    // 5. Request'i güncelle
    const updatedRequest = await RequestModel.findByIdAndUpdate(
        requestId,
        {
            ...existingRequest.toObject(),
            ...otherUpdateData,
            submissions: updatedSubmissions,
        },
        { new: true }
    );

    // 6. Güncellenmiş request'i döndür
    if (!updatedRequest) {
        throw new Error("Error updating request.");
    }
    return updatedRequest;
};

// Delete a request by ID
export const deleteRequestById = async (requestId: string) => {
    if (!mongoose.Types.ObjectId.isValid(requestId)) {
        throw new Error("Invalid requestId format.");
    }

    const request = await RequestModel.findById(requestId);
    if (!request) {
        throw new Error("Request not found");
    }

    // 1. AWS S3 üzerindeki dosyaları sil
    if (request.submissions && request.submissions.length > 0) {
        const deletePromises = request.submissions.map((submission) => {
            const fileKey = submission.document.split("/").pop();
            return deleteFile(fileKey);
        });
        await Promise.all(deletePromises); // Tüm dosyaları paralel olarak sil
    }

    // 2. İlişkili Incident'i sil
    if (request.Incidents) {
        await IncidentModel.findByIdAndDelete(request.Incidents);
    }

    // 3. Avukattan başvuruyu kaldır
    if (request.assignedLawyer) {
        const lawyer = await UserModel.findById(request.assignedLawyer);
        if (lawyer) {
            lawyer.requests = lawyer.requests.filter((req) => req.toString() !== requestId);
            await lawyer.save();
        }
    }

    // 4. Request'i sil
    await RequestModel.findByIdAndDelete(requestId);
    return { message: "Request and associated data deleted successfully." };
};

// Status Güncelleme Servisi
export const updateRequestStatusService = async (requestId: string, status: string) => {
    // Geçerli `status` değerlerini kontrol edin
    const validStatuses = ["pending", "approved", "rejected"];
    if (!validStatuses.includes(status)) {
        throw new Error("Invalid status value");
    }

    // `requestId`'nin geçerli olup olmadığını kontrol edin
    if (!mongoose.Types.ObjectId.isValid(requestId)) {
        throw new Error("Invalid requestId format");
    }

    // Request'i bulun ve güncelleyin
    const updatedRequest = await RequestModel.findByIdAndUpdate(
        requestId,
        { status }, // Yeni status değeri
        { new: true } // Güncellenmiş belgeyi döndür
    );

    if (!updatedRequest) {
        throw new Error("Request not found");
    }

    return updatedRequest;
};