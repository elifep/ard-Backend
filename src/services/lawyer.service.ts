import RequestModel from "../models/request.model";
import CaseModel from "../models/case.model";
import { generatePresignedUrl } from "../services/aws.service";

// Fetch cases assigned to a specific lawyer
export const getCasesByLawyer = async (lawyerId: string) => {
    console.log("Fetching cases for lawyer:", lawyerId);
    
    const query = lawyerId === "env-admin"
        ? {} // Admin tüm davaları görebilir
        : { lawyer: lawyerId }; // Avukat sadece kendine atanmış davaları görebilir

    const cases = await CaseModel.find(query)
        .populate("relatedRequest", "requestNumber name surname")
        .populate("lawyer", "fullName email");

    // Signed URL'ler oluştur
    const casesWithSignedUrls = await Promise.all(
        cases.map(async (caseData) => {
            if (caseData.documents) {
                for (const [key, value] of Object.entries(caseData.documents)) {
                    if (Array.isArray(value)) {
                        caseData.documents[key] = await Promise.all(
                            value.map(async (fileUrl) => {
                                const key = fileUrl.split("amazonaws.com/")[1];
                                return generatePresignedUrl(key);
                            })
                        );
                    }
                }
            }
            return caseData;
        })
    );

    return casesWithSignedUrls;
};

// Fetch a single case by ID and lawyer
export const getCaseByIdAndLawyer = async (caseId: string, lawyerId: string) => {
    const caseData = await CaseModel.findOne({ _id: caseId, lawyer: lawyerId })
        .populate("relatedRequest", "requestNumber name surname")
        .populate({
            path: "lawyer",
            select: "fullName email",
        });

    if (!caseData) throw new Error("Case not found");

    // Signed URL'ler oluştur
    if (caseData.documents) {
        for (const [key, value] of Object.entries(caseData.documents)) {
            if (Array.isArray(value)) {
                caseData.documents[key] = await Promise.all(
                    value.map(async (fileUrl) => {
                        const key = fileUrl.split("amazonaws.com/")[1];
                        return generatePresignedUrl(key);
                    })
                );
            }
        }
    }

    return caseData;
};

// Fetch requests assigned to a specific lawyer
export const getRequestsByLawyer = async (lawyerId: string) => {
    console.log("Fetching approved requests for lawyer:", lawyerId);

    // Eğer lawyerId "env-admin" ise tüm başvuruları getir
    const query = lawyerId === "env-admin"
        ? { status: "approved" } // Admin için filtre sadece "approved" başvurular
        : { assignedLawyer: lawyerId, status: "approved" }; // Avukat için filtre

    // Yalnızca onaylanmış başvuruları getir
    const requests = await RequestModel.find(query)
        .populate({
            path: "caseDetails",
            select: "caseSubject fileNumber",
        })
        .populate({
            path: "assignedLawyer",
            select: "fullName email",
        });

    return requests;
};