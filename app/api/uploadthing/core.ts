import { UploadThingError } from "uploadthing/server";
import { createUploadthing, type FileRouter } from "uploadthing/next";

import { allowedMimeTypes } from "@/config";

const f = createUploadthing();

export const ourFileRouter = {
  fileUploader: f({
    pdf: { maxFileSize: "16MB", maxFileCount: 20 },
    text: { maxFileSize: "16MB", maxFileCount: 20 },
    blob: { maxFileSize: "16MB", maxFileCount: 20 },
    image: { maxFileSize: "16MB", maxFileCount: 20 },
  })
    .middleware(async ({ files }) => {
      for (const file of files) {
        if (!allowedMimeTypes.includes(file.type)) {
          throw new UploadThingError({
            code: "BAD_REQUEST",
            message: `Неподдерживаемый тип файла: ${file.type}`,
          });
        }
      }

      return { uploadedBy: "user" };
    })
    .onUploadComplete(async ({ metadata, file }) => ({
      uploadedBy: metadata.uploadedBy,
      fileUrl: file.ufsUrl,
    })),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
