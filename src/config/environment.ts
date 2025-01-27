import 'dotenv/config';

export const PORT = process.env.PORT;
if (!PORT) {
    throw new Error("PORT must be defined");
}

export const MONGO_URL = process.env.MONGO_URL;
if (!MONGO_URL) {
    throw new Error("MONGO_URL must be defined");
}

export const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    throw new Error("JWT_SECRET must be defined for token signing");
}

export const USERJWT_SECRET = process.env.USERJWT_SECRET;
if (!USERJWT_SECRET) {
    throw new Error("USERJWT_SECRET must be defined for token signing");
}

export const REFRESHJWT_SECRET = process.env.REFRESHJWT_SECRET;
if (!REFRESHJWT_SECRET) {
    throw new Error("REFRESHJWT_SECRET must be defined for token signing");
}

export const FRONTEND_URL = process.env.FRONTEND_URL;
if (!FRONTEND_URL) {
    throw new Error("FRONTEND_URL must be defined");
}

export const USER_URL = process.env.USER_URL;
if (!USER_URL) {
    throw new Error("USER_URL must be defined");
}

export const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
if (!ADMIN_EMAIL) {
    throw new Error("ADMIN_EMAIL must be defined");
}

export const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
if (!ADMIN_PASSWORD) {
    throw new Error("ADMIN_PASSWORD must be defined");
}

export const BUCKET_NAME = process.env.AWS_S3_BUCKET;
if (!BUCKET_NAME) {
    throw new Error("AWS_S3_BUCKET must be defined for file storage");
}

export const AWS_REGION = process.env.AWS_REGION;
if (!AWS_REGION) {
    throw new Error("AWS_REGION must be defined for file storage");
}

export const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID;
if (!AWS_ACCESS_KEY_ID) {
    throw new Error("AWS_ACCESS_KEY_ID must be defined for file storage");
}

export const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY;
if (!AWS_SECRET_ACCESS_KEY) {
    throw new Error("AWS_SECRET_ACCESS_KEY must be defined for file storage");
}

export const LOG_PATH = process.env.LOG_PATH;
if (!LOG_PATH) {
    throw new Error("LOG_PATH must be defined for log storage");
}

export const LOG_ARCHIVE_PATH = process.env.LOG_ARCHIVE_PATH;
if (!LOG_ARCHIVE_PATH) {
    throw new Error("LOG_ARCHIVE_PATH must be defined for log storage");
}