import { UploadError, uploadFiles } from "@/utils";

import { CreateOrderRequest } from "../api/orders/route";

import { OrderFormData } from "./config";

type PrepareOrderResult =
  | { success: true; data: CreateOrderRequest }
  | { success: false; errors: UploadError[] };

export const prepareOrderWithUploads = async (
  data: OrderFormData,
): Promise<PrepareOrderResult> => {
  const filesToUpload: File[] = [];

  data.printJobs.forEach((job) => {
    job.files.forEach((file) => {
      if (file instanceof File) {
        filesToUpload.push(file);
      }
    });
  });

  const uploadResult = await uploadFiles(filesToUpload);

  if (uploadResult.errors?.length) {
    return { success: false, errors: uploadResult.errors };
  }

  let uploadedIndex = 0;

  const preparedData: CreateOrderRequest = {
    ...data,
    printJobs: data.printJobs.map((job) => ({
      ...job,
      files: job.files.map((file) => {
        if (file instanceof File) {
          return uploadResult.uploaded[uploadedIndex++];
        }

        return file;
      }),
    })),
  };

  return { success: true, data: preparedData };
};
