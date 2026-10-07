import "dotenv/config";
import { randomUUID } from "node:crypto";
import { deleteFile, getFile, putFile } from "../src/lib/storage";

const key = `health/${randomUUID()}.txt`;
const expected = Buffer.from("portfolio storage check");
let uploaded = false;
try {
  await putFile(key, expected, "text/plain");
  uploaded = true;
  const object = await getFile(key);
  const actual =
    object.Body && Buffer.from(await object.Body.transformToByteArray());
  if (!actual?.equals(expected)) throw new Error("Readback mismatch");
  console.log("Storage upload and readback succeeded.");
} catch (error) {
  console.error(
    `Storage check failed (${error instanceof Error ? error.name : "unknown error"}). Verify the bucket, endpoint, region, and credentials.`,
  );
  process.exitCode = 1;
} finally {
  if (uploaded) {
    try {
      await deleteFile(key);
    } catch {
      console.error(
        "Storage check object could not be removed; check DeleteObject permission.",
      );
      process.exitCode = 1;
    }
  }
}
