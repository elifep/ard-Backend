import {
    PutObjectCommand,
    GetObjectCommand,
    DeleteObjectCommand,
    ListObjectsV2Command,
    GetObjectCommandInput,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { BUCKET_NAME, AWS_REGION } from "../config/environment";
import s3 from "../config/aws";

// Generate a pre-signed URL for a file in S3
export const generatePresignedUrl = async (key: string, expiresIn = 3600): Promise<string> => {
    if (!key) throw new Error("S3 key is required for generating a signed URL");

    const params: GetObjectCommandInput = {
        Bucket: BUCKET_NAME,
        Key: key,
    };

    try {
        const command = new GetObjectCommand(params);
        return await getSignedUrl(s3, command, { expiresIn });
    } catch (error) {
        console.error("Error generating signed URL:", error);
        throw new Error("Could not generate signed URL");
    }
};

// Upload file to S3
export const uploadFile = async (key: string, buffer: Buffer, mimetype: string) => {
    const params = {
        Bucket: BUCKET_NAME,
        Key: key,
        Body: buffer,
        ContentType: mimetype,
    };

    const command = new PutObjectCommand(params);
    await s3.send(command);
    return `https://${BUCKET_NAME}.s3.${AWS_REGION}.amazonaws.com/${key}`;
};

// Delete file from S3
export const deleteFile = async (key: string) => {
    const params = {
        Bucket: BUCKET_NAME,
        Key: key,
    };

    const command = new DeleteObjectCommand(params);
    await s3.send(command);
    return { message: "File deleted successfully", key };
};

// Get pre-signed URL for a file in S3
export const getFile = async (key: string) => {
    if (!key) throw new Error("File key is required");

    const presignedUrl = await generatePresignedUrl(key);
    return {
        presignedUrl,
    };
};

// List all files in S3 bucket
export const listFiles = async () => {
    const params = {
        Bucket: BUCKET_NAME,
    };

    const command = new ListObjectsV2Command(params);
    const response = await s3.send(command);
    return response.Contents?.map((item) => ({
        key: item.Key,
        lastModified: item.LastModified,
        size: item.Size,
    })) || [];
};