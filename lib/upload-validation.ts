import { z } from "zod";
import {
  allowedMimeTypes,
  MAX_UPLOAD_FILE_COUNT,
  MAX_UPLOAD_FILE_SIZE,
} from "@/config/upload";

export class UploadValidationError extends Error {}

const uploadFileMetadataSchema = z.object({
  name: z
    .string()
    .max(1024, "Некорректное имя файла")
    .refine((name) => !!name.trim(), "Некорректное имя файла"),
  size: z
    .number()
    .int("Некорректный размер файла")
    .positive("Файл не должен быть пустым")
    .max(MAX_UPLOAD_FILE_SIZE, "Размер файла не должен превышать 16 МБ"),
  type: z
    .string()
    .refine(
      (type) => allowedMimeTypes.includes(type),
      "Неподдерживаемый тип файла"
    ),
});

const uploadFilesSchema = z
  .array(uploadFileMetadataSchema)
  .min(1, "Можно загрузить от 1 до 20 файлов в наборе")
  .max(MAX_UPLOAD_FILE_COUNT, "Можно загрузить от 1 до 20 файлов в наборе");

export const uploadRequestSchema = z.object({
  files: z
    .array(z.instanceof(File, { error: "Загрузите один файл за запрос" }))
    .length(1, "Загрузите один файл за запрос"),
});

export const validateUploadFiles = (
  files: Pick<File, "name" | "size" | "type">[]
) => {
  const result = uploadFilesSchema.safeParse(files);
  if (!result.success)
    throw new UploadValidationError(result.error.issues[0].message);
};
