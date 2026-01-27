import z from "zod";
import dayjs from "dayjs";
import { MIME_TYPES } from "@mantine/dropzone";

import { Urgency, PaperSize, WorkSchedule } from "@/types";

const uploadedFileSchema = z.object({
  fileUrl: z.url("Некорректный URL"),
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
  paperSize: z.enum(
    Object.values(PaperSize) as [string, ...string[]],
    "Выберите формат бумаги",
  ),
});

export const isWorkingTime = (date: dayjs.Dayjs): boolean => {
  const hour = date.hour();
  const dayOfWeek = date.day();
  const minute = date.minute();
  const timeInHours = hour + minute / 60;

  if (dayOfWeek === 1) {
    return false;
  }

  if (dayOfWeek === 0 || dayOfWeek === 6) {
    return (
      timeInHours >= WorkSchedule.Weekend.start &&
      timeInHours <= WorkSchedule.Weekend.end
    );
  }

  return (
    timeInHours >= WorkSchedule.Weekday.start &&
    timeInHours <= WorkSchedule.Weekday.end
  );
};

export const getWorkingHoursDescription = (date: dayjs.Dayjs): string => {
  const dayOfWeek = date.day();

  if (dayOfWeek === 1) {
    return "Понедельник - выходной";
  }

  if (dayOfWeek === 0 || dayOfWeek === 6) {
    return "Выходные: с 8:00 до 11:30";
  }

  return "Будние дни: с 8:00 до 13:00";
};

export const orderSchema = z
  .object({
    comment: z.string().optional(),
    deadlineAt: z.string().optional(),
    urgency: z.enum(Object.values(Urgency), "Выберите срочность"),
    telegramId: z.number().positive("ID должен быть положительным"),
    printJobs: z.array(printJobSchema).min(1, "Добавьте хотя бы одну работу"),
  })
  .superRefine((data, ctx) => {
    if (data.urgency === Urgency.SCHEDULED) {
      if (!data.deadlineAt) {
        ctx.addIssue({
          code: "custom",
          path: ["deadlineAt"],
          message: "Выберите дату и время выполнения заказа",
        });
        return;
      }

      const deadline = dayjs(data.deadlineAt);
      const now = dayjs();
      const maxDate = now.add(3, "day");

      if (!deadline.isValid()) {
        ctx.addIssue({
          code: "custom",
          path: ["deadlineAt"],
          message: "Некорректная дата",
        });
        return;
      }

      if (deadline.isBefore(now)) {
        ctx.addIssue({
          code: "custom",
          path: ["deadlineAt"],
          message: "Дата не может быть в прошлом",
        });
        return;
      }

      if (deadline.isAfter(maxDate)) {
        ctx.addIssue({
          code: "custom",
          path: ["deadlineAt"],
          message: "Заказ можно оформить максимум на 3 дня вперед",
        });
        return;
      }

      if (!isWorkingTime(deadline)) {
        const dayOfWeek = deadline.day();

        if (dayOfWeek === 1) {
          ctx.addIssue({
            code: "custom",
            path: ["deadlineAt"],
            message: "Понедельник - выходной день. Выберите другую дату",
          });
          return;
        }

        const schedule = getWorkingHoursDescription(deadline);
        ctx.addIssue({
          code: "custom",
          path: ["deadlineAt"],
          message: `Выбранное время вне графика работы. ${schedule}`,
        });
        return;
      }
    }

    data.printJobs.forEach((job, index) => {
      const isPhotoPaper = job.paperSize.includes("Photo");

      if (isPhotoPaper) {
        if (job.duplex) {
          ctx.addIssue({
            code: "custom",
            path: ["printJobs", index, "duplex"],
            message: "Фотопечать доступна только односторонняя",
          });
        }
      } else {
        if (job.paperSize !== PaperSize.A4Basic) {
          ctx.addIssue({
            code: "custom",
            path: ["printJobs", index, "paperSize"],
            message:
              "Для ч/б и цветной печати доступна только А4 простая бумага",
          });
        }
      }
    });
  });

export type OrderFormData = z.infer<typeof orderSchema>;

export const acceptFiles = [
  MIME_TYPES.pdf,
  MIME_TYPES.doc,
  MIME_TYPES.png,
  MIME_TYPES.xls,
  MIME_TYPES.svg,
  MIME_TYPES.docx,
  MIME_TYPES.jpeg,
  MIME_TYPES.xlsx,
];

export const defaultPrintJob = {
  copies: 1,
  files: [],
  duplex: false,
  isColor: false,
  paperSize: PaperSize.A4Basic,
};
