import { Urgency } from "@/types";
import type { CreateOrderRequest } from "../api/orders/route";

import type { OrderFormData } from "./config";

type PrepareOrderResult =
  | { success: true; data: CreateOrderRequest }
  | { success: false; error: string };

type StartUploadFn = (files: File[]) => Promise<
  | {
      url: string;
      name: string;
      size: number;
      type: string;
    }[]
  | undefined
>;

export const prepareOrderWithUploads = async (
  data: OrderFormData,
  startUpload: StartUploadFn
): Promise<PrepareOrderResult> => {
  const filesToUpload: File[] = [];

  data.printJobs.forEach((job) => {
    job.files.forEach((file) => {
      if (file instanceof File) {
        filesToUpload.push(file);
      }
    });
  });

  try {
    const uploadedFiles = await startUpload(filesToUpload);

    if (!uploadedFiles) {
      return {
        success: false,
        error: "Не удалось загрузить файлы",
      };
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
            return {
              fileUrl: uploaded.url,
              fileName: uploaded.name,
              fileSize: uploaded.size,
              mimeType: uploaded.type,
            };
          }

          return file;
        }),
      })),
    };

    return { success: true, data: preparedData };
  } catch (error) {
    console.error("Upload error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Ошибка загрузки",
    };
  }
};
