import mongoose, { Schema, Document } from "mongoose";

export interface ICaseDetails extends Document {
    partyName: string; // Taraf Adı Soyadı
    lawyer: mongoose.Types.ObjectId; // Avukat
    caseSubject: string; // Dava Konusu
    caseLawyer: string; // Davayı Takip Eden Avukat
    fileNumber: number; // Dosya No
    court: string; // Mahkeme
    indictment: string; // İddianame
    courtFileNumber: string; // Mahkeme Dosya No
    resultDescription: string; // Sonucu Açıklama
    resultStage: string; // Sonuç Aşama
    documents: {
        hearingReports: string[]; // Duruşma İzleme Raporu
        petitions: string[]; // Dilekçeler
        hearingMinutes: string[]; // Duruşma Tutanakları
    };
    relatedRequest: mongoose.Types.ObjectId; // İlgili Başvuruyu referanslar
    archived: boolean;
}

const CaseDetailsSchema: Schema = new Schema(
    {
        partyName: {
            type: String,
            required: [true, "Taraf adı gereklidir."],
            trim: true,
        },
        lawyer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: [true, "Geçerli bir avukat referansı gereklidir."],
        },
        caseSubject: {
            type: String,
            required: [true, "Dava konusu gereklidir."],
            trim: true,
        },
        caseLawyer: {
            type: String,
            required: [true, "Davayı takip eden avukat adı gereklidir."],
            trim: true,
        },
        fileNumber: {
            type: Number,
            required: [true, "Dosya numarası gereklidir."],
            validate: {
                validator: (v: number) => v > 0,
                message: "Dosya numarası pozitif bir sayı olmalıdır.",
            },
        },
        court: {
            type: String,
            required: [true, "Mahkeme adı gereklidir."],
            trim: true,
        },
        indictment: {
            type: String,
            required: [true, "İddianame gereklidir."],
            trim: true,
        },
        courtFileNumber: {
            type: String,
            required: [true, "Mahkeme dosya numarası gereklidir."],
            trim: true,
        },
        resultDescription: {
            type: String,
            required: [true, "Sonuç açıklaması gereklidir."],
            trim: true,
        },
        resultStage: {
            type: String,
            required: [true, "Sonuç aşaması gereklidir."],
            trim: true,
        },
        documents: {
            hearingReports: [
                {
                    type: String,
                    trim: true,
                    validate: {
                        validator: (v: string) =>
                            /^https?:\/\/[^\s$.?#].[^\s]*$/gm.test(v),
                        message: "Duruşma raporu olmalıdır.",
                    },
                },
            ],
            petitions: [
                {
                    type: String,
                    trim: true,
                    validate: {
                        validator: (v: string) =>
                            /^https?:\/\/[^\s$.?#].[^\s]*$/gm.test(v),
                        message: "Dilekçe olmalıdır.",
                    },
                },
            ],
            hearingMinutes: [
                {
                    type: String,
                    trim: true,
                    validate: {
                        validator: (v: string) =>
                            /^https?:\/\/[^\s$.?#].[^\s]*$/gm.test(v),
                        message: "Duruşma tutanağı olmalıdır.",
                    },
                },
            ],
        },
        relatedRequest: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Request",
            required: [true, "İlgili başvuru referansı gereklidir."],
        },
        archived: {
            type: Boolean,
            default: false,
        },
    },
    { timestamps: true }
);

// Middleware for `relatedRequest` validation
CaseDetailsSchema.pre<ICaseDetails>("save", async function (next) {
    if (this.relatedRequest) {
        const requestExists = await mongoose
            .model("Request")
            .exists({ _id: this.relatedRequest });
        if (!requestExists) {
            return next(
                new Error("Related request must reference a valid Request document.")
            );
        }
    }
    next();
});

// Middleware for lawyer reference validation
CaseDetailsSchema.pre<ICaseDetails>("save", async function (next) {
    if (this.lawyer) {
        const userExists = await mongoose
            .model("User")
            .exists({ _id: this.lawyer, role: "lawyer" });
        if (!userExists) {
            return next(new Error("Lawyer must reference a valid lawyer user."));
        }
    }
    next();
});

// Custom error messages for validation
CaseDetailsSchema.post("validate", function (error: mongoose.Error, doc: ICaseDetails, next: mongoose.CallbackWithoutResultAndOptionalError) {
    if (error.name === "ValidationError") {
        const messages = Object.values((error as mongoose.Error.ValidationError).errors)
            .map((err) => err.message)
            .join(", ");
        next(new Error(`Doğrulama Hatası: ${messages}`));
    } else {
        next(error);
    }
});

// Trimming middleware for all string fields
CaseDetailsSchema.pre<ICaseDetails>("save", function (next) {
    Object.keys(this.toObject()).forEach((key) => {
        if (typeof this[key] === "string") {
            this[key] = this[key].trim();
        }
    });
    next();
});

const CaseDetails = mongoose.model<ICaseDetails>("CaseDetails", CaseDetailsSchema);

export default CaseDetails;