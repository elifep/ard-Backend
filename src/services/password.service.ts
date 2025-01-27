import bcrypt from "bcryptjs";
import User from "../models/user.model";

// login sayfasında sifre sıfırlama
export const resetPassword = async (token: string, newPassword: string) => {
    try {
        const user = await User.findOne({
            passwordResetExpires: { $gt: Date.now() },
        });

        if (!user) {
            throw new Error("Password reset token is invalid or has expired.");
        }

        const isMatch = await bcrypt.compare(token, user.passwordResetToken);
        if (!isMatch) {
            throw new Error("Invalid reset token.");
        }

        user.password = newPassword;
        user.passwordResetToken = undefined; // Token'ı sıfırla
        user.passwordResetExpires = undefined;
        await user.save();

        return { message: "Password has been reset successfully." };
    } catch (error) {
        throw new Error(`Error resetting password: ${error.message}`);
    }
};
