import express from "express";
import {
    deleteFromS3,
    getFromS3,
    listFilesInS3,
} from "../controllers/s3.controller";

const router = express.Router();

router.delete("/delete/:key", deleteFromS3); // Delete a file by key
router.get("/get/:key", getFromS3); // Get a file by key
router.get("/list", listFilesInS3); // List all files in S3

export default router;