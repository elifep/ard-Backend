import mongoose, { Schema, Document } from "mongoose";

export enum Category {
    MediaScan = "MediaScan", // Medya Taraması
    STK = "STK", // STK (Sivil Toplum Kuruluşları)
    BaroCommissions = "BaroCommissions", // Baro Komisyonları
    PublicInstitutions = "PublicInstitutions", // Kamu Kurumları
}

export interface IIncident extends Document {
    category: Category; // Enum ile sınırlı kategori
    scanPeriod: string; // Tarama Dönemi
    eventCategory: string; // Olay Kategorisi
    eventSummary: string; // Olay Özet
    source: string; // Kaynak (Web Sitesi, Gazete vb.)
    link: string; // Link
    imageLink: string; // Görsel Link
    notificationAgency: string; // Bildirim Kurumu
    uploadedFile: string[]; // Dosya Yükleme
    commission: string; // Vakanın Alındığı Komisyon
    publicInstitution: string; // Kamu Kurumu
    relatedRequest: mongoose.Types.ObjectId; // İlgili Başvuruyu referanslar
}

const IncidentSchema: Schema = new Schema(
    {
        category: {
            type: String,
            enum: Object.values(Category),
            required: [true, "Kategori gereklidir."],
            trim: true,
        },
        scanPeriod: {
            type: String,
            required: [true, "Tarama dönemi gereklidir."],
            trim: true,
        },
        eventCategory: {
            type: String,
            required: [true, "Olay kategorisi gereklidir."],
            trim: true,
        },
        eventSummary: {
            type: String,
            required: [true, "Olay özeti gereklidir."],
            trim: true,
        },
        source: {
            type: String,
            trim: true,
        },
        link: {
            type: String,
            required: [true, "Bağlantı gereklidir."],
            trim: true,
            validate: {
                validator: (v: string) =>
                    /^https?:\/\/[^\s$.?#].[^\s]*$/gm.test(v),
                message: "Bağlantı geçerli bir URL formatında olmalıdır.",
            },
        },
        imageLink: {
            type: String,
            trim: true,
            validate: {
                validator: (v: string) =>
                    !v || /^https?:\/\/[^\s$.?#].[^\s]*$/gm.test(v),
                message: "Görsel bağlantısı geçerli bir URL formatında olmalıdır.",
            },
        },
        notificationAgency: { type: String, trim: true },
        uploadedFile: { type: [String], required: false },
        commission: { type: String, trim: true },
        publicInstitution: { type: String, trim: true },
        relatedRequest: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Request",
            required: false,
        },
    },
    { timestamps: true }
);

// Middleware for `relatedRequest` integrity check
IncidentSchema.pre<IIncident>("save", async function (next) {
    if (this.relatedRequest) {
        const requestExists = await mongoose
            .model("Request")
            .exists({ _id: this.relatedRequest });
        if (!requestExists) {
            return next(new Error("RelatedRequest must reference a valid Request document."));
        }
    }
    next();
});

// Custom error messages for validation
IncidentSchema.post("validate", function (error: mongoose.Error, doc: IIncident, next: mongoose.CallbackWithoutResultAndOptionalError) {
    if (error.name === "ValidationError") {
        const messages = Object.values((error as mongoose.Error.ValidationError).errors)
            .map((err) => err.message)
            .join(", ");
        next(new Error(`Doğrulama Hatası: ${messages}`));
    } else {
        next(error);
    }
});

const Incident = mongoose.model<IIncident>("Incident", IncidentSchema);

export default Incident;