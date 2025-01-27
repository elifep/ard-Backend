import mongoose, { Schema, Document } from "mongoose";

enum RequestStatus {
    Pending = "pending",
    Approved = "approved",
    Rejected = "rejected",
}

interface IRequest extends Document {
    requestNumber: number;
    email: string;
    telephone: string;
    tckn: string;
    name: string;
    surname: string;
    applicantType: string;
    receivedBy: mongoose.Types.ObjectId | null;
    assignedLawyer: mongoose.Types.ObjectId | null;
    complaintReason: string;
    submissions: { documentDescription: string; document: string }[];
    caseDetails: mongoose.Types.ObjectId[] | null;
    Incidents: mongoose.Types.ObjectId | null;
    status: RequestStatus;
    archived: boolean;
}

const RequestSchema: Schema = new Schema(
    {
        requestNumber: { type: Number, required: false, unique: true, sparse: true },
        email: {
            type: String,
            required: [true, "Email adresi gereklidir."],
            trim: true,
            validate: {
                validator: (v: string) =>
                    /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/.test(v),
                message: "Geçersiz email formatı.",
            },
        },
        telephone: {
            type: String,
            required: [true, "Telefon numarası gereklidir."],
            trim: true,
            validate: {
                validator: (v: string) => /^[0-9]{10,15}$/.test(v),
                message: "Telefon numarası 10-15 rakam arasında olmalıdır.",
            },
        },
        tckn: {
            type: String,
            required: [true, "TC Kimlik Numarası gereklidir."],
            trim: true,
            validate: {
                validator: (v: string) => /^[0-9]{11}$/.test(v),
                message: "TC Kimlik Numarası 11 rakam arasında olmalıdır.",
            },
        },
        name: {
            type: String,
            required: [true, "Ad gereklidir."],
            trim: true,
        },
        surname: {
            type: String,
            required: [true, "Soyad gereklidir."],
            trim: true,
        },
        applicantType: {
            type: String,
            required: [true, "Başvuru tipi gereklidir."],
            trim: true,
        },
        receivedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: false,
        },
        assignedLawyer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: false,
        },
        complaintReason: {
            type: String,
            required: [true, "Şikayet sebebi gereklidir."],
            trim: true,
        },
        submissions: [
            {
                documentDescription: {
                    type: String,
                    trim: true,
                    required: false,
                },
                document: {
                    type: String,
                    trim: true,
                    required: false,
                },
            },
        ],
        caseDetails: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: "CaseDetails",
            required: false,
        }],
        Incidents: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Incident",
            required: false,
        },
        status: {
            type: String,
            enum: Object.values(RequestStatus),
            default: RequestStatus.Pending,
        },
        archived: {
            type: Boolean,
            default: false,
        },
    },
    { timestamps: true }
);

// Middleware for trimming all string fields
RequestSchema.pre<IRequest>("save", function (next) {
    for (const key in this) {
        if (typeof this[key] === "string") {
            this[key] = this[key].trim();
        }
    }
    next();
});

// Middleware for `receivedBy` validation
RequestSchema.pre<IRequest>("save", async function (next) {
    if (this.receivedBy) {
        if (!mongoose.Types.ObjectId.isValid(this.receivedBy)) {
            return next(new Error("Invalid ObjectId format for receivedBy."));
        }
        const user = await mongoose.model("User").findById(this.receivedBy);
        if (!user || user.role !== "admin") {
            return next(new Error("receivedBy must reference an admin user."));
        }
    }
    next();
});

// Middleware for `assignedLawyer` validation
RequestSchema.pre<IRequest>("save", async function (next) {
    if (this.assignedLawyer) {
        if (!mongoose.Types.ObjectId.isValid(this.assignedLawyer)) {
            return next(new Error("Invalid ObjectId format for assignedLawyer."));
        }
        const user = await mongoose.model("User").findById(this.assignedLawyer);
        if (!user || user.role !== "lawyer") {
            return next(
                new Error("assignedLawyer must reference a lawyer user.")
            );
        }
    }
    next();
});

// Middleware for `Incidents` validation
RequestSchema.pre<IRequest>("save", async function (next) {
    if (this.Incidents) {
        if (!mongoose.Types.ObjectId.isValid(this.Incidents)) {
            return next(new Error("Invalid ObjectId format for Incidents."));
        }
        const incident = await mongoose.model("Incident").findById(this.Incidents);
        if (!incident) {
            return next(new Error("Incidents must reference a valid incident."));
        }
    }
    next();
});

// Middleware for ensuring submissions are valid
RequestSchema.pre<IRequest>("validate", function (next) {
    if (this.submissions && !Array.isArray(this.submissions)) {
        return next(new Error("Submissions must be an array."));
    }
    for (const submission of this.submissions) {
        if (!submission.documentDescription || !submission.document) {
            return next(new Error("Each submission must have a description and document."));
        }
    }
    next();
});

const Request = mongoose.model<IRequest>("Request", RequestSchema);

export default Request;