import { apiInstance } from "./instance";
import { URL } from "@/config/url";
import { validateUploadFiles } from "@/lib/upload-validation";

export interface UploadedFile {
  url: string;
  name: string;
  size: number;
  type: string;
}

export const uploadFiles = async (
  files: File[],
  onProgress: (progress: number) => void
): Promise<UploadedFile[]> => {
  // Files from multiple print jobs may exceed 20 overall.
  files.forEach((file) => validateUploadFiles([file]));
  const total = files.reduce((sum, file) => sum + file.size, 0);
  let completed = 0;
  const uploaded: UploadedFile[] = [];
  for (const file of files) {
    const body = new FormData();
    body.append("file", file);
    const { data } = await apiInstance.post<UploadedFile>(
      URL.UPLOAD_FILE,
      body,
      {
        timeout: 120_000,
        onUploadProgress: (event) => {
          // Reserve the last percent until S3 confirms every upload.
          const fraction = event.total
            ? Math.min(event.loaded / event.total, 1)
            : 0;
          onProgress(
            Math.min(
              99,
              Math.round(((completed + file.size * fraction) / total) * 100)
            )
          );
        },
      }
    );
    if (
      !data.url ||
      data.name !== file.name ||
      data.size !== file.size ||
      data.type !== file.type
    )
      throw new Error("Не удалось получить подтверждение загрузки файла");
    uploaded.push(data);
    completed += file.size;
  }
  onProgress(100);
  return uploaded;
};
