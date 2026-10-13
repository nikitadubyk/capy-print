import { Urgency } from "@/types";
import { MAX_UPLOAD_FILE_COUNT } from "@/config/upload";
import type { CreateOrderRequest } from "../api/orders/route";

import type { OrderFormData } from "./config";

export type StartUploadFn = (files: File[]) => Promise<
  | {
      url?: string;
      name: string;
      size: number;
      type: string;
    }[]
  | undefined
>;

export const prepareOrderWithUploads = async (
  data: OrderFormData,
  startUpload: StartUploadFn
): Promise<CreateOrderRequest> => {
  if (data.printJobs.some((job) => job.files.length > MAX_UPLOAD_FILE_COUNT))
    throw new Error("Можно загрузить до 20 файлов в наборе");
  const filesToUpload = data.printJobs.flatMap((job) =>
    job.files.filter((file) => file instanceof File)
  );

  const uploadedFiles = filesToUpload.length
    ? await startUpload(filesToUpload)
    : [];

  if (!uploadedFiles || uploadedFiles.length !== filesToUpload.length) {
    throw new Error("Не удалось загрузить все файлы");
  }

  let uploadedIndex = 0;

  const { deadlineAt, ...orderData } = data;
  const preparedData: CreateOrderRequest = {
    ...orderData,
    ...(data.urgency === Urgency.SCHEDULED ? { deadlineAt } : {}),
    printJobs: data.printJobs.map((job) => ({
      ...job,
      files: job.files.map((file) => {
        if (file instanceof File) {
          const uploaded = uploadedFiles[uploadedIndex++];
          const fileUrl = uploaded.url;
          if (!fileUrl) throw new Error("Не удалось получить ссылку на файл");
          return {
            fileUrl,
            fileName: uploaded.name,
            fileSize: uploaded.size,
            mimeType: uploaded.type,
          };
        }

        return file;
      }),
    })),
  };

  return preparedData;
};
