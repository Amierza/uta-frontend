import type { SuccessResponse } from "../types/api";
import api from "./api";

export interface UploadResponse extends SuccessResponse<string[]> {}

// =============================
//  Fungsi Upload (Multiple or Single)
// =============================
export const uploadFiles = async (files: File[]): Promise<string[]> => {
  if (!files || files.length === 0) {
    throw new Error("No files selected for upload");
  }

  try {
    const formData = new FormData();
    files.forEach((file) => formData.append("files", file));
    const token = localStorage.getItem("access_token");
    const response = await api.post<UploadResponse>("/uploads", formData, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "multipart/form-data",
      },
    });

    if (!response.data.status) {
      throw new Error(response.data.message || "Upload failed");
    }

    return response.data.data; // selalu array string[]
  } catch (error: any) {
    console.error("Error uploading files:", error);

    const errMessage =
      error.response?.data?.message ||
      error.message ||
      "Unexpected upload error";

    throw new Error(errMessage);
  }
};

// =============================
//  Fungsi Upload Single File
// =============================
export const uploadFile = async (file: File): Promise<string[]> => {
  // Tetap return array agar konsisten (bisa [url])
  return await uploadFiles([file]);
};
