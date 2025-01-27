import mongoose, { Schema, Document } from "mongoose";
import bcrypt from "bcryptjs";

export interface IUser extends Document {
    fullName: string; // Ad Soyad
    telephone: string; // Telefon
    email: string; // E-posta
    password: string; // Şifre
    role: "admin" | "lawyer"; // Kullanıcı Rolü
    status: "active" | "inactive"; // Durum (aktif/pasif)
    baroRegistrationNumber?: number; // Baro Sicil No
    caseDetails: mongoose.Types.ObjectId[] | null; // Durumu
    requests: mongoose.Types.ObjectId[] | null;
    passwordResetToken?: string; // Şifre sıfırlama token'ı
    passwordResetExpires?: Date; // Token gelecek tarih
    refreshToken: string;
    comparePassword(candidatePassword: string): Promise<boolean>;
}

const UserSchema: Schema = new Schema(
    {
        fullName: { type: String, required: true },
        telephone: { type: String, required: true },
        email: { type: String, required: true, unique: true },
        password: { type: String, required: true },
        role: { type: String, enum: ["admin", "lawyer"], required: true },
        status: { type: String, enum: ["active", "inactive"], default: "active" },
        baroRegistrationNumber: { type: Number }, // Baro sicil numarası artık zorunlu değil
        caseDetails: [{ type: mongoose.Schema.Types.ObjectId, ref: "CaseDetails" }],
        requests: [{ type: mongoose.Schema.Types.ObjectId, ref: "Request" }],
        passwordResetToken: { type: String }, // Şifre sıfırlama token'ı
        passwordResetExpires: { type: Date }, // Token geçerlilik süresi
        refreshToken: { type: String },
    },
    { timestamps: true }
);

// Middleware ile baroRegistrationNumber zorunluluğunu kontrol etme
UserSchema.pre<IUser>("save", async function (next) {
    if (this.role === "lawyer" && !this.baroRegistrationNumber) {
        return next(new Error("Lawyer rolü için Baro Sicil Numarası zorunludur."));
    }
    // Şifreyi yalnızca değiştirildiğinde hashle
    if (this.isModified("password")) {
        try {
            const salt = await bcrypt.genSalt(10);
            this.password = await bcrypt.hash(this.password, salt);
        } catch (err) {
            return next(err);
        }
    }
    next();
});

// Şifre doğrulama methodu
UserSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
    return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model<IUser>("User", UserSchema);

export default User;