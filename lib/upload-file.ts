import { put } from "@vercel/blob";

export const uploadFile = async (file: File): Promise<string> => {
  try {
    const blob = await put(file.name, file, {
      access: "public",
      addRandomSuffix: true,
    });
    return blob.url;
  } catch (error) {
    console.error("Ошибка при загрузке файла:", error);
    throw new Error("Не удалось загрузить файл");
  }
};
