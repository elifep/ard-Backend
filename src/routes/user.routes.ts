import express from "express";
import {
    getAllUsers,
    getUserById,
    createUser,
    updateUserById,
    deleteUserById,
    getUsersByRole,
} from "../controllers/user.controller";
import { authenticateAndAuthorize } from "../middleware/auth.middleware";

const router = express.Router();

// Route to get all users
router.get("/", authenticateAndAuthorize(["admin"]), getAllUsers);

// Route to get users by role
router.get("/role", authenticateAndAuthorize(["admin"]), getUsersByRole);

// Route to get a user by ID
router.get("/:id", getUserById);

// Route to create a new user
router.post("/", authenticateAndAuthorize(["admin"]), createUser);

// Route to update a user by ID
router.put("/:id", updateUserById);

// Route to delete a user by ID
router.delete("/:id", authenticateAndAuthorize(["admin"]), deleteUserById);

export default router;