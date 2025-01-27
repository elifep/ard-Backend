import express from "express";
import { uploadFields } from "../config/upload";
import {
    getAllRequests,
    getRequestById,
    createRequest,
    updateRequestById,
    deleteRequestById,
    updateRequestStatus,
} from "../controllers/request.controller";
import { authenticateAndAuthorize } from "../middleware/auth.middleware";

const router = express.Router();

router.get("/", authenticateAndAuthorize(["admin"]), getAllRequests);
router.get("/:id", authenticateAndAuthorize(["admin"]), getRequestById);
router.post("/", uploadFields, createRequest); // vatandaş ve admin olabilir
router.put("/:id", authenticateAndAuthorize(["admin"]), uploadFields, updateRequestById);
router.delete("/:id", authenticateAndAuthorize(["admin"]), deleteRequestById);
router.patch("/:id/status", authenticateAndAuthorize(["admin"]), updateRequestStatus);

export default router;