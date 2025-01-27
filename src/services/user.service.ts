import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User from "../models/user.model";

// Get all users
export const getAllUsers = async () => {
    try {
        return await User.find();
    } catch (error) {
        throw new Error(`Error fetching users: ${error.message}`);
    }
};

// Get users by role
export const getUsersByRole = async (role: "admin" | "lawyer") => {
    try {
        return await User.find({ role });
    } catch (error) {
        throw new Error(`Error fetching users by role: ${error.message}`);
    }
};

// Get user by ID
export const getUserById = async (userId: string) => {
    if (userId === "env-admin") {
        return {
            id: "env-admin",
            role: "admin",
            email: process.env.ADMIN_EMAIL,
            name: "Environment Admin",
        }; // Sahte bir admin nesnesi döndürün
    }

    try {
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            throw new Error("Invalid ObjectId format");
        }

        const user = await User.findById(userId);
        if (!user) throw new Error("User not found");
        return user;
    } catch (error) {
        throw new Error(`Error fetching user: ${error.message}`);
    }
};

// Create new user
export const createUser = async (userData: any) => {
    try {
        const newUser = new User(userData);
        await newUser.save();
        return newUser;
    } catch (error) {
        throw new Error(`Error creating user: ${error.message}`);
    }
};

// Update user by ID
export const updateUserById = async (userId: string, updateData: any) => {
    try {
        // Eğer şifre güncelleniyorsa, önce hash'le
        if (updateData.password) {
            const salt = await bcrypt.genSalt(10);
            updateData.password = await bcrypt.hash(updateData.password, salt);
        } else {
            delete updateData.password; // Şifre alanı boşsa güncellemeden çıkar
        }

        const updatedUser = await User.findByIdAndUpdate(userId, updateData, {
            new: true,
            runValidators: true,
        });

        if (!updatedUser) throw new Error("User not found");
        return updatedUser;
    } catch (error) {
        throw new Error(`Error updating user: ${error.message}`);
    }
};

// Delete user by ID
export const deleteUserById = async (userId: string) => {
    try {
        const deletedUser = await User.findByIdAndDelete(userId);
        if (!deletedUser) throw new Error("User not found");
        return deletedUser;
    } catch (error) {
        throw new Error(`Error deleting user: ${error.message}`);
    }
};