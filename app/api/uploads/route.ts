import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { MAX_UPLOAD_FILE_SIZE } from "@/config/upload";
import { requireRole } from "@/lib/auth";
import { sessionHeaders } from "@/lib/session";
import { uploadFile } from "@/lib/s3-upload";
import {
  uploadRequestSchema,
  UploadValidationError,
} from "@/lib/upload-validation";

export const runtime = "nodejs";

// One file per request. Bound actual bytes, including requests without Content-Length.
const MAX_REQUEST_SIZE = MAX_UPLOAD_FILE_SIZE + 64 * 1024;
const readFormData = async (request: Request) => {
  if (!request.headers.get("content-type")?.startsWith("multipart/form-data;"))
    throw new UploadValidationError("Ожидается файл в multipart/form-data");
  if (Number(request.headers.get("content-length")) > MAX_REQUEST_SIZE)
    throw new UploadValidationError("Размер файла не должен превышать 16 МБ");
  if (!request.body) throw new UploadValidationError("Добавьте файл");
  let bytes = 0;
  const body = request.body.pipeThrough(
    new TransformStream<Uint8Array, Uint8Array>({
      transform: (chunk, controller) => {
        bytes += chunk.byteLength;
        if (bytes > MAX_REQUEST_SIZE)
          throw new UploadValidationError(
            "Размер файла не должен превышать 16 МБ"
          );
        controller.enqueue(chunk);
      },
    })
  );
  try {
    return await new Response(body, { headers: request.headers }).formData();
  } catch (error) {
    if (error instanceof UploadValidationError) throw error;
    throw new UploadValidationError("Не удалось прочитать файл");
  }
};

export const POST = async (request: Request) => {
  const auth = await requireRole(request, "USER");
  if (auth instanceof NextResponse) return auth;
  try {
    const data = await readFormData(request);
    const {
      files: [file],
    } = uploadRequestSchema.parse({
      files: data.getAll("file"),
    });
    const url = await uploadFile(file, auth.user.id);
    return NextResponse.json(
      { url, name: file.name, size: file.size, type: file.type },
      { status: 201, headers: sessionHeaders }
    );
  } catch (error) {
    const invalid =
      error instanceof UploadValidationError || error instanceof ZodError;
    if (!invalid)
      // SDK errors may contain credentials or request data. Log only the outcome.
      console.error("[Capy Print][upload] Не удалось загрузить файл в S3");
    return NextResponse.json(
      {
        error:
          error instanceof ZodError
            ? error.issues[0].message
            : invalid
              ? error.message
              : "Не удалось загрузить файл. Попробуйте ещё раз.",
      },
      { status: invalid ? 400 : 502, headers: sessionHeaders }
    );
  }
};
