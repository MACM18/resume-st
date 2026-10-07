import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
export const s3 = new S3Client({
  region: process.env.S3_REGION || "us-east-1",
  endpoint: process.env.S3_ENDPOINT || undefined,
  forcePathStyle: !!process.env.S3_ENDPOINT,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY || "",
    secretAccessKey: process.env.S3_SECRET_KEY || "",
  },
});
const Bucket = process.env.S3_BUCKET || "portfolio";
export async function putFile(key: string, body: Buffer, type: string) {
  await s3.send(
    new PutObjectCommand({ Bucket, Key: key, Body: body, ContentType: type }),
  );
}
export async function getFile(key: string) {
  return s3.send(new GetObjectCommand({ Bucket, Key: key }));
}
export async function deleteFile(key: string) {
  await s3.send(new DeleteObjectCommand({ Bucket, Key: key }));
}
