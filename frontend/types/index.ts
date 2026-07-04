export type FileData = {
  id: string;
  originalName: string;
  size: number;
  mimeType: string;
  uploadDate: string;
  uploaderName: string | null;
  folderId: string | null;
};

export type FolderData = {
  id: string;
  name: string;
  parentId: string | null;
  createdAt: string;
};

export type ShareLink = {
  id: string;
  token: string;
  fileId: string | null;
  folderId: string | null;
  permission: "VIEW" | "DOWNLOAD";
  expiresAt: string | null;
  createdAt: string;
};

export type UploadTask = {
  id: string;
  file: File;
  fileName: string;
  fileSize: number;
  mimeType: string;
  progress: number;
  status: "uploading" | "success" | "error";
  sessionId?: string;
  uploadedBytes?: number;
  speed?: number; // bytes per second (smoothed)
  speedSamples?: number[];
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
  | "name-desc"
  | "type-asc"
  | "type-desc"
  | "uploader-asc"
  | "uploader-desc";
