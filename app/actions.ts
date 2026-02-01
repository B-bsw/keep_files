"use server";

import { uploadFile, deleteFile, listFiles } from "@/lib/google";
import { revalidatePath } from "next/cache";

export async function handleUpload(formData: FormData) {
  const file = formData.get("file") as File;
  const customFileName = formData.get("customFileName") as string;

  if (!file) {
    throw new Error("No file uploaded");
  }
  console.log('ead')

  try {
    await uploadFile(file, customFileName);
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Upload failed:", error);
    return { success: false, error: error || "Upload failed" };
  }
}

export async function handleDelete(fileId: string) {
  try {
    await deleteFile(fileId);
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Delete failed:", error);
    return { success: false, error: "Delete failed" };
  }
}

export async function getFiles() {
  try {
    const files = await listFiles();
    // Map Google Drive fields to the UI's expected format

    return (
      files
        ?.filter((e) => !e.mimeType?.split(".").includes("folder"))
        ?.map((f) => ({
          id: f.id!,
          file_name: f.name!,
          file_path: f.webViewLink || "#", // Using webViewLink as path/url
          webContentLink: f.webContentLink, // Actual download link usually
        })) || []
    );
  } catch (error) {
    console.error("Fetch failed:", error);
    return [];
  }
}
