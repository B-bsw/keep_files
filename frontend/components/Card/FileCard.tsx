import { Square, SquareCheck } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { FileData } from "../../types";
import { formatBytes } from "../../utils";
import { FileActionMenu } from "./FileActionMenu";

const getFileNameWithoutExtension = (fileName: string) => {
  const lastDotIndex = fileName.lastIndexOf(".");
  if (lastDotIndex === -1) return fileName;
  return fileName.substring(0, lastDotIndex);
};

const getFileExtensionText = (fileName: string) => {
  const lastDotIndex = fileName.lastIndexOf(".");
  if (lastDotIndex === -1) return "FILE";
  return fileName.substring(lastDotIndex + 1).toUpperCase();
};

type FileCardProps = {
  file: FileData;
  viewMode: "grid" | "list";
  isSelected: boolean;
  onToggleSelection: (id: string) => void;
  onActionRequest: (
    type: "download" | "preview" | "edit",
    file: FileData,
  ) => void;
  onDelete: (id: string) => void;
};

export function FileCard({
  file,
  viewMode,
  isSelected,
  onToggleSelection,
  onActionRequest,
  onDelete,
}: FileCardProps) {
  const handlePreviewOrDownload = () => {
    if (file.mimeType.startsWith("image/")) {
      onActionRequest("preview", file);
    } else {
      onActionRequest("download", file);
    }
  };

  if (viewMode === "list") {
    return (
      <div
        onClick={(e) => {
          e.stopPropagation();
          onToggleSelection(file.id);
        }}
        className={`group flex items-center gap-3 md:gap-4 px-3 py-2.5 md:px-4 md:py-3 rounded-lg border cursor-pointer transition-colors w-full select-none overflow-hidden ${
          isSelected
            ? "border-blue-500 bg-blue-50 dark:border-white dark:bg-[#1a1a1a]"
            : "border-gray-200 bg-[#F5FEFD] hover:bg-[#F5FEFD] hover:border-gray-300 dark:border-[#222222] dark:bg-[#111111] dark:hover:bg-[#151515] dark:hover:border-[#333333]"
        }`}
      >
        <div
          onClick={(e) => {
            e.stopPropagation();
            onToggleSelection(file.id);
          }}
          className="cursor-pointer text-gray-400 hover:text-gray-900 dark:text-gray-500 dark:hover:text-white transition-colors shrink-0"
        >
          {isSelected ? (
            <SquareCheck className="w-4 h-4 md:w-5 md:h-5 text-blue-600 dark:text-white" />
          ) : (
            <Square className="w-4 h-4 md:w-5 md:h-5" />
          )}
        </div>

        <div className="flex-1 min-w-0 flex flex-col md:flex-row md:items-center justify-between gap-1 md:gap-4">
          <div className="flex-1 min-w-0 flex flex-col">
            <h4
              className="font-medium text-sm text-gray-900 dark:text-gray-200 truncate"
              title={file.originalName}
            >
              {getFileNameWithoutExtension(file.originalName)}
            </h4>
            <p className="text-[11px] text-gray-500 dark:text-gray-500 truncate md:hidden mt-0.5">
              <span className="uppercase font-medium text-gray-700 dark:text-gray-400">
                {getFileExtensionText(file.originalName)}
              </span>{" "}
              • {formatBytes(file.size)} • {file.uploaderName || "anonymous"}
            </p>
          </div>

          <div className="hidden md:flex shrink-0 w-[400px] items-center gap-4 text-xs text-gray-500">
            <span className="w-16 uppercase font-medium text-gray-700 dark:text-gray-400">
              {getFileExtensionText(file.originalName)}
            </span>
            <span className="flex-1 truncate">
              {file.uploaderName || "anonymous"}
            </span>
            <span className="w-20 font-mono text-right">
              {formatBytes(file.size)}
            </span>
            <span className="w-32 font-mono text-right text-nowrap">
              {formatDistanceToNow(new Date(file.uploadDate), {
                addSuffix: true,
              })}
            </span>
          </div>
        </div>

        <div className="flex justify-end shrink-0 pl-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
          <FileActionMenu
            file={file}
            onActionRequest={onActionRequest}
            onDelete={onDelete}
          />
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        onToggleSelection(file.id);
      }}
      className={`group flex flex-col rounded-lg border cursor-pointer transition-colors relative overflow-hidden select-none ${
        isSelected
          ? "border-blue-500 bg-blue-50 dark:border-white dark:bg-[#1a1a1a]"
          : "border-gray-200 bg-[#F5FEFD] hover:bg-[#F5FEFD] hover:border-gray-300 dark:border-[#222222] dark:bg-[#111111] dark:hover:bg-[#151515] dark:hover:border-[#333333]"
      }`}
    >
      <div className="absolute top-3 left-3 z-10">
        <div
          onClick={(e) => {
            e.stopPropagation();
            onToggleSelection(file.id);
          }}
          className="cursor-pointer text-gray-400 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors bg-[#F5FEFD]/80 dark:bg-[#111111]/50 rounded-md"
        >
          {isSelected ? (
            <SquareCheck className="w-5 h-5 text-blue-600 dark:text-white" />
          ) : (
            <Square className="w-5 h-5" />
          )}
        </div>
      </div>

      <div className="absolute top-2 right-2 z-10 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
        <FileActionMenu
          file={file}
          onActionRequest={onActionRequest}
          onDelete={onDelete}
          className="bg-[#F5FEFD]/90 dark:bg-[#111111]/80 backdrop-blur-sm rounded-md border border-gray-200 dark:border-[#222222]"
        />
      </div>

      <div className="p-4 pt-10 flex flex-col flex-1">
        <h4
          className="font-medium text-sm text-gray-900 dark:text-gray-200 truncate mb-1"
          title={file.originalName}
        >
          {getFileNameWithoutExtension(file.originalName)}
        </h4>
        <p className="text-xs text-gray-500 truncate mb-4">
          <span className="uppercase font-medium text-gray-700 dark:text-gray-400">
            {getFileExtensionText(file.originalName)}
          </span>{" "}
          • {file.uploaderName || "anonymous"}
        </p>

        <div className="flex justify-between items-center w-full font-mono text-[10px] text-gray-600">
          <span>{formatBytes(file.size)}</span>
          <span>
            {formatDistanceToNow(new Date(file.uploadDate), {
              addSuffix: true,
            })}
          </span>
        </div>
      </div>
    </div>
  );
}
