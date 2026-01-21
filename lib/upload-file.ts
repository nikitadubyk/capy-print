import { UTApi } from "uploadthing/server";

import { Config } from "@/config";

const utapi = new UTApi({
  token: Config.uploadthingToken,
});

export const uploadFile = async (file: File): Promise<string> => {
  try {
    const response = await utapi.uploadFiles(file);

    if (response.error) {
      throw new Error(response.error.message);
    }

    return response.data.url;
  } catch (error) {
    console.error("Ошибка при загрузке файла:", error);
    throw new Error("Не удалось загрузить файл");
  }
};

export const uploadMultipleFiles = async (files: File[]): Promise<string[]> => {
  try {
    const responses = await utapi.uploadFiles(files);

    return responses.map((response) => {
      if (response.error) {
        throw new Error(response.error.message);
      }
      return response.data.url;
    });
  } catch (error) {
    console.error("Ошибка при загрузке файлов:", error);
    throw new Error("Не удалось загрузить файлы");
  }
};
