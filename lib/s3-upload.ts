import { randomUUID } from "node:crypto";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getS3Config } from "@/config/s3";
import { validateUploadFiles } from "@/lib/upload-validation";

// Imported only by server code. Keys never reach the browser.
export const uploadFile = async (
  file: File,
  uploadedBy: number
): Promise<string> => {
  validateUploadFiles([file]);
  const { bucket, publicBaseUrl, ...config } = getS3Config();
  const client = new S3Client({
    ...config,
    forcePathStyle: true,
    requestChecksumCalculation: "WHEN_REQUIRED",
    responseChecksumValidation: "WHEN_REQUIRED",
  });
  const extension =
    file.name.match(/\.[a-z0-9]{1,10}$/i)?.[0].toLowerCase() || "";
  const key = `uploads/${uploadedBy}/${randomUUID()}${extension}`;
  try {
    await client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: new Uint8Array(await file.arrayBuffer()),
        ContentType: file.type,
        ContentLength: file.size,
        // Preserve Cyrillic names and download HTML/SVG instead of executing them.
        ContentDisposition: `attachment; filename="download${extension}"; filename*=UTF-8''${encodeURIComponent(file.name).replace(/[!'()*]/g, (char) => `%${char.charCodeAt(0).toString(16).toUpperCase()}`)}`,
        Metadata: { uploadedBy: String(uploadedBy) },
      }),
      { abortSignal: AbortSignal.timeout(60_000) }
    );
    return `${publicBaseUrl}${key.split("/").map(encodeURIComponent).join("/")}`;
  } finally {
    client.destroy();
  }
};
