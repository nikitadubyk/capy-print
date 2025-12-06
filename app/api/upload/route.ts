import { NextRequest, NextResponse } from "next/server";

import { uploadFile } from "@/lib";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const files = formData.getAll("files") as File[];

    if (!files || files.length === 0) {
      return NextResponse.json({ error: "Файлы не найдены" }, { status: 400 });
    }

    const allowedTypes = [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "image/jpg",
      "application/msword",
    ];

    const maxSize = 10 * 1024 * 1024;

    const uploadedFiles = [];
    const errors = [];

    for (const file of files) {
      if (!allowedTypes.includes(file.type)) {
        errors.push({
          fileName: file.name,
          error: "Неподдерживаемый тип файла",
        });
        continue;
      }

      if (file.size > maxSize) {
        errors.push({
          fileName: file.name,
          error: "Файл слишком большой (максимум 10MB)",
        });
        continue;
      }

      try {
        const fileUrl = await uploadFile(file);
        uploadedFiles.push({
          fileUrl,
          fileName: file.name,
          fileSize: file.size,
          mimeType: file.type,
        });
      } catch (error) {
        console.error("Ошибка при загрузке файла:", error);
        errors.push({
          fileName: file.name,
          error: "Не удалось загрузить файл",
        });
      }
    }

    return NextResponse.json({
      uploaded: uploadedFiles,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error("Ошибка при загрузке файлов:", error);
    return NextResponse.json(
      { error: "Не удалось загрузить файлы" },
      { status: 500 }
    );
  }
}
