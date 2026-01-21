import { NextRequest, NextResponse } from "next/server";

import { uploadMultipleFiles } from "@/lib";
import { allowedMimeTypes, allowedExtensions } from "@/config";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const files = formData.getAll("files") as File[];

    if (!files || files.length === 0) {
      return NextResponse.json({ error: "Файлы не найдены" }, { status: 400 });
    }

    const maxSize = 10 * 1024 * 1024;

    const validationResults = files.map((file) => {
      const fileExtension = "." + file.name.split(".").pop()?.toLowerCase();
      const isValidType =
        allowedMimeTypes.includes(file.type) ||
        allowedExtensions.includes(fileExtension);

      if (!isValidType) {
        return {
          valid: false,
          file,
          error: `Неподдерживаемый тип файла`,
        };
      }

      if (file.size > maxSize) {
        return {
          valid: false,
          file,
          error: "Файл слишком большой (максимум 10MB)",
        };
      }

      return { valid: true, file };
    });

    const validFiles = validationResults
      .filter((result) => result.valid)
      .map((result) => result.file);

    const validationErrors = validationResults
      .filter((result) => !result.valid)
      .map((result) => ({
        fileName: result.file.name,
        error: result.error!,
      }));

    if (validFiles.length === 0) {
      return NextResponse.json({
        uploaded: [],
        errors: validationErrors,
      });
    }

    try {
      const fileUrls = await uploadMultipleFiles(validFiles);

      const uploadedFiles = validFiles.map((file, index) => ({
        fileUrl: fileUrls[index],
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
      }));

      return NextResponse.json({
        uploaded: uploadedFiles,
        errors: validationErrors.length > 0 ? validationErrors : undefined,
      });
    } catch (uploadError) {
      console.error("Ошибка загрузки в UploadThing:", uploadError);

      const uploadErrors = validFiles.map((file) => ({
        fileName: file.name,
        error: "Не удалось загрузить файл",
      }));

      return NextResponse.json({
        uploaded: [],
        errors: [...validationErrors, ...uploadErrors],
      });
    }
  } catch (error) {
    console.error("Ошибка при загрузке файлов:", error);
    return NextResponse.json(
      { error: "Не удалось загрузить файлы" },
      { status: 500 },
    );
  }
}
