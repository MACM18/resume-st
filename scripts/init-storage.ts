import "dotenv/config";
import { CreateBucketCommand, HeadBucketCommand } from "@aws-sdk/client-s3";
import { s3 } from "../src/lib/storage";
const Bucket = process.env.S3_BUCKET!;
for (let attempt = 0; attempt < 30; attempt++) {
  try {
    try {
      await s3.send(new HeadBucketCommand({ Bucket }));
    } catch {
      await s3.send(new CreateBucketCommand({ Bucket }));
    }
    console.log("Private development bucket ready.");
    process.exit(0);
  } catch {
    await new Promise((r) => setTimeout(r, 2000));
  }
}
throw new Error("Could not initialize the development storage bucket.");
