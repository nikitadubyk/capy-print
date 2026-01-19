import z from "zod";
import { MIME_TYPES } from "@mantine/dropzone";

import { Urgency, PaperSize } from "@/types";

const uploadedFileSchema = z.object({
  fileUrl: z.string().url("Некорректный URL"),
  mimeType: z.string().min(1, "MIME тип обязателен"),
  fileName: z.string().min(1, "Имя файла обязательно"),
  fileSize: z.number().positive("Размер должен быть положительным"),
});

const fileInputSchema = z.union([z.instanceof(File), uploadedFileSchema]);

const printJobSchema = z.object({
  duplex: z.boolean(),
  isColor: z.boolean(),
  files: z.array(fileInputSchema).min(1, "Добавьте хотя бы один файл"),
  copies: z.number().min(1, "Минимум 1 копия").max(1000, "Максимум 1000 копий"),
  paperSize: z.enum(Object.values(PaperSize), "Выберите формат бумаги"),
});

export const orderSchema = z.object({
  comment: z.string().optional(),
  deadlineAt: z.string().optional(),
  telegramId: z.number().positive("ID должен быть положительным"),
  urgency: z.enum(Object.values(Urgency), "Выберите формат бумаги"),
  printJobs: z.array(printJobSchema).min(1, "Добавьте хотя бы одну работу"),
});

export type OrderFormData = z.infer<typeof orderSchema>;

export const acceptFiles = [
  MIME_TYPES.pdf,
  MIME_TYPES.doc,
  MIME_TYPES.docx,
  MIME_TYPES.jpeg,
  MIME_TYPES.png,
];

export const defaultPrintJob = {
  copies: 1,
  files: [],
  duplex: false,
  isColor: false,
  paperSize: PaperSize.A4Basic,
};
