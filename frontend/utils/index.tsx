import {
  File as FileIcon,
  Image as ImageIcon,
  Video,
  Music,
  Archive,
  FileText,
} from "lucide-react";

export const formatBytes = (bytes: number, decimals = 2) => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
};

export const getFileIcon = (mimeType: string) => {
  if (mimeType.startsWith("image/"))
    return <ImageIcon className="w-8 h-8 text-blue-400" />;
  if (mimeType.startsWith("video/"))
    return <Video className="w-8 h-8 text-purple-400" />;
  if (mimeType.startsWith("audio/"))
    return <Music className="w-8 h-8 text-pink-400" />;
  if (
    mimeType.includes("zip") ||
    mimeType.includes("tar") ||
    mimeType.includes("rar")
  )
    return <Archive className="w-8 h-8 text-orange-400" />;
  if (mimeType.includes("pdf") || mimeType.includes("text/"))
    return <FileText className="w-8 h-8 text-green-400" />;
  return <FileIcon className="w-8 h-8 text-gray-400" />;
};
