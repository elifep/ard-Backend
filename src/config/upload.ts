import multer from "multer";

const allowedMimeTypes = ["image/jpeg", "image/png", "application/pdf"];

const fileFilter = (req: any, file: Express.Multer.File, cb: any) => {
    if (allowedMimeTypes.includes(file.mimetype)) {
        cb(null, true); // Kabul edilen dosya
    } else {
        cb(new Error("Unsupported file type"), false); // Kabul edilmeyen dosya
    }
};

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
    fileFilter,
});

// Farklı alanları kabul eden multer middleware
export const uploadFields = upload.fields([
    { name: "submissions", maxCount: 10 }, // submissions dosyaları
    { name: "incidentFiles", maxCount: 10 }, // incidentFiles dosyaları
    { name: "hearingReports", maxCount: 10 }, // hearingReports dosyaları
    { name: "petitions", maxCount: 10 }, // petitions dosyaları
    { name: "hearingMinutes", maxCount: 10 }, // hearingMinutes dosyaları
]);

export default upload;