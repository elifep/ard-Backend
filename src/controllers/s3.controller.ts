import { Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import {
    uploadFile,
    deleteFile,
    getFile,
    listFiles,
    generatePresignedUrl,
} from "../services/aws.service";

// Upload file to S3
export const uploadToS3 = async (req: Request, res: Response): Promise<void> => {
    try {
        const files = req.files || (req.file ? [req.file] : []); // Tekli veya çoklu dosya kontrolü
        if (!files.length) {
            res.status(400).json({ error: "No files uploaded" });
            return;
        }

        // MIME türü kontrolü
        const allowedMimeTypes = ["image/jpeg", "image/png", "application/pdf"];
        const uploadedFiles = await Promise.all(
            (files as Express.Multer.File[]).map(async (file) => {
                if (!allowedMimeTypes.includes(file.mimetype)) {
                    throw new Error(`Unsupported file type: ${file.mimetype}`);
                }

                const fileKey = `uploads/${uuidv4()}_${file.originalname}`;
                const fileUrl = await uploadFile(fileKey, file.buffer, file.mimetype);
                return { fileUrl, key: fileKey };
            })
        );

        res.status(201).json({ message: "Files uploaded successfully", files: uploadedFiles });
    } catch (error) {
        console.error("Error uploading to S3:", error);
        res.status(500).json({ error: error.message || "Error uploading files" });
    }
};

// Delete file from S3
export const deleteFromS3 = async (req: Request, res: Response): Promise<void> => {
    try {
        const { key } = req.params;
        if (!key) {
            res.status(400).json({ error: "File key is required" });
            return;
        }

        const result = await deleteFile(key);
        res.status(200).json(result);
    } catch (error) {
        console.error("Error deleting from S3:", error);
        res.status(500).json({ error: "Error deleting file" });
    }
};

// Get file from S3
export const getFromS3 = async (req: Request, res: Response): Promise<void> => {
    try {
        const { key } = req.params;
        if (!key) {
            res.status(400).json({ error: "File key is required" });
            return;
        }

        const file = await getFile(key);
        console.log("Fetched file:", file);
        res.status(200).json(file);
    } catch (error) {
        console.error("Error generating pre-signed URL:", error);
        res.status(500).json({ error: "Error generating pre-signed URL" });
    }
};

// List files in S3
export const listFilesInS3 = async (_req: Request, res: Response): Promise<void> => {
    try {
        const files = await listFiles();
        const filesWithUrls = await Promise.all(
            files.map(async (file) => ({
                key: file.key,
                lastModified: file.lastModified,
                size: file.size,
                url: await generatePresignedUrl(file.key),
            }))
        );

        res.status(200).json(filesWithUrls);
    } catch (error) {
        console.error("Error listing files in S3:", error);
        res.status(500).json({ error: "Error listing files" });
    }
};