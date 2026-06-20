export type FileData = {
  id: string;
  originalName: string;
  size: number;
  mimeType: string;
  uploadDate: string;
  uploaderName: string | null;
};

export type UploadTask = {
  id: string;
  file: File;
  fileName: string;
  fileSize: number;
  mimeType: string;
  progress: number;
  status: "uploading" | "success" | "error";
  uploadedBytes?: number;
  speed?: number; // bytes per second
};

export type DeleteTask = {
  id: string;
  fileName: string;
  progress: number;
  status: "deleting" | "success" | "error";
};

export type SortOption =
  | "date-desc"
  | "date-asc"
  | "size-desc"
  | "size-asc"
  | "name-asc"
  | "name-desc";
