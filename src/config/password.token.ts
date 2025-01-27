import crypto from "crypto";
import bcrypt from "bcryptjs";
import User from "../models/user.model";

export const requestPasswordReset = async (email: string) => {
    try {
        const user = await User.findOne({ email });
        if (!user) {
            throw new Error("User with this email does not exist.");
        }

        // Sıfırlama token'ı oluştur
        const resetToken = crypto.randomBytes(32).toString("hex");
        const resetTokenHash = await bcrypt.hash(resetToken, 10);

        user.passwordResetToken = resetTokenHash;
        user.passwordResetExpires = new Date(Date.now() + 3600000); // 1 saat geçerli
        await user.save();

        // E-posta gönderme işlemini burada gerçekleştirin
        return { resetToken, message: "Password reset link sent to your email." };
    } catch (error) {
        throw new Error(`Error requesting password reset: ${error.message}`);
    }
};