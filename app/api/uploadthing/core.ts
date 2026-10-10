import { UploadThingError } from "uploadthing/server";
import { createUploadthing, type FileRouter } from "uploadthing/next";

import { allowedMimeTypes } from "@/config";
import { requireRole } from "@/lib/auth";
import { NextResponse } from "next/server";
import { getErrorDiagnostics } from "@/lib/error-diagnostics";

const f = createUploadthing();

export const ourFileRouter = {
  fileUploader: f({
    pdf: { maxFileSize: "16MB", maxFileCount: 20 },
    text: { maxFileSize: "16MB", maxFileCount: 20 },
    blob: { maxFileSize: "16MB", maxFileCount: 20 },
    image: { maxFileSize: "16MB", maxFileCount: 20 },
  })
    .middleware(async ({ files, req }) => {
      const auth = await requireRole(req, "USER");
      if (auth instanceof NextResponse)
        throw new UploadThingError({
          code: "FORBIDDEN",
          message: "Сессия недействительна. Откройте приложение заново.",
        });
      for (const file of files) {
        if (!allowedMimeTypes.includes(file.type)) {
          throw new UploadThingError({
            code: "BAD_REQUEST",
            message: `Неподдерживаемый тип файла: ${file.type}`,
          });
        }
      }

      console.info("[Capy Print][upload] Загрузка разрешена", {
        fileCount: files.length,
      });
      return { uploadedBy: auth.user.id };
    })
    .onUploadError(({ error }) => {
      console.error(
        "[Capy Print][upload] Ошибка UploadThing",
        getErrorDiagnostics(error)
      );
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.info("[Capy Print][upload] Загрузка подтверждена");
      return {
        uploadedBy: metadata.uploadedBy,
        fileUrl: file.ufsUrl,
      };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
