import { apiInstance } from "@/api/instance";
import { URL } from "@/config";

export interface UploadedFile {
  fileUrl: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
}

export interface UploadError {
  fileName: string;
  error: string;
}

export interface UploadResponse {
  uploaded: UploadedFile[];
  errors?: UploadError[];
}

export const uploadFiles = async (files: File[]): Promise<UploadResponse> => {
  const formData = new FormData();

  files.forEach((file) => {
    formData.append("files", file);
  });

  const { data } = await apiInstance.post<UploadResponse>(
    URL.UPLOAD_FILE,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    },
  );

  return data;
};
