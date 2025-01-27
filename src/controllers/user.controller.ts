import { Request, Response } from "express";
import * as UserService from "../services/user.service";
import User from "../models/user.model";

// Get all users
export const getAllUsers = async (_req: Request, res: Response) => {
    try {
        const users = await UserService.getAllUsers();
        res.status(200).json(users);
    } catch (error) {
        console.error("Error fetching users:", error);
        res.status(500).json({ error: "Error fetching users" });
    }
};

// Get users by role
export const getUsersByRole = async (req: Request, res: Response) => {
    try {
        const { role } = req.query; // Role parametresini alıyoruz
        if (!role || (role !== "admin" && role !== "lawyer")) {
            res.status(400).json({ error: "Invalid role parameter" });
            return;
        }

        const users = await UserService.getUsersByRole(role as "admin" | "lawyer");
        res.status(200).json(users);
    } catch (error) {
        console.error("Error fetching users by role:", error);
        res.status(500).json({ error: "Error fetching users by role" });
    }
};

// Get user by ID
export const getUserById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        if (!id || id === "undefined") {
            res.status(400).json({ error: "Invalid user ID" });
            return;
        }

        const user = await UserService.getUserById(id);
        console.log("User:", user);
        if (!user) {
            res.status(404).json({ error: "User not found" });
            return;
        }
        res.status(200).json(user);
    } catch (error) {
        res.status(500).json({ error: "Error fetching user" });
    }
};

// Create new user
export const createUser = async (req: Request, res: Response) => {
    try {
        const newUser = new User(req.body);
        await newUser.save();
        res.status(201).json(newUser);
    } catch (error: any) {
        if (error.code === 11000) { // MongoDB unique constraint violation
            const field = Object.keys(error.keyValue)[0];
            return res.status(400).json({
                error: `Bu ${field} zaten kullanımda. Lütfen farklı bir ${field} deneyin.`,
            });
        }
        console.error("Error creating user:", error);
        res.status(500).json({ error: "Error creating user" });
    }
};

// Update user by ID
export const updateUserById = async (req: Request, res: Response) => {
    try {
        const updatedUser = await UserService.updateUserById(req.params.id, req.body);

        if (!updatedUser) {
            res.status(404).json({ error: "User not found" });
            return;
        }

        res.status(200).json(updatedUser);
    } catch (error) {
        console.error("Error updating user:", error);
        res.status(500).json({ error: error.message });
    }
};

// Delete user by ID
export const deleteUserById = async (req: Request, res: Response) => {
    try {
        const deletedUser = await UserService.deleteUserById(req.params.id);
        if (!deletedUser) {
            res.status(404).json({ error: "User not found" });
            return;
        }
        res.status(200).json({ message: "User deleted successfully" });
    } catch (error) {
        console.error("Error deleting user:", error);
        res.status(500).json({ error: "Error deleting user" });
    }
};