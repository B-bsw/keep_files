import {
  Square,
  Eye,
  Download,
  Trash2,
  SquareCheck,
  Pencil,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { FileData } from "../../types";
import { formatBytes, getFileIcon } from "../../utils";
import { Button } from "@heroui/react";

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

  const ActionButtons = ({ className = "" }: { className?: string }) => (
    <div
      className={`flex items-center gap-0.5 md:gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity ${className}`}
    >
      {file.mimeType.startsWith("image/") && (
        <Button
          isIconOnly
          variant="ghost"
          onPress={() => onActionRequest("preview", file)}
          className="text-gray-400 hover:text-white border-0 w-7 h-7 min-w-7 md:w-8 md:h-8 md:min-w-8"
          aria-label="Preview Image"
        >
          <Eye className="w-3.5 h-3.5 md:w-4 md:h-4" />
        </Button>
      )}
      <Button
        isIconOnly
        variant="ghost"
        onPress={() => onActionRequest("edit", file)}
        className="text-gray-400 hover:text-white border-0 w-7 h-7 min-w-7 md:w-8 md:h-8 md:min-w-8"
        aria-label="Edit"
      >
        <Pencil className="w-3.5 h-3.5 md:w-4 md:h-4" />
      </Button>
      <Button
        isIconOnly
        variant="ghost"
        onPress={() => onActionRequest("download", file)}
        className="text-gray-400 hover:text-white border-0 w-7 h-7 min-w-7 md:w-8 md:h-8 md:min-w-8"
        aria-label="Download"
      >
        <Download className="w-3.5 h-3.5 md:w-4 md:h-4" />
      </Button>
      <Button
        isIconOnly
        variant="ghost"
        onPress={() => onDelete(file.id)}
        className="text-gray-400 hover:text-red-400 border-0 w-7 h-7 min-w-7 md:w-8 md:h-8 md:min-w-8"
        aria-label="Delete"
      >
        <Trash2 className="w-3.5 h-3.5 md:w-4 md:h-4" />
      </Button>
    </div>
  );

  if (viewMode === "list") {
    return (
      <div
        onClick={handlePreviewOrDownload}
        className={`group flex items-center gap-3 md:gap-4 px-3 py-2.5 md:px-4 md:py-3 rounded-lg border cursor-pointer transition-colors w-full select-none overflow-hidden ${
          isSelected
            ? "border-white bg-[#1a1a1a]"
            : "border-[#222222] bg-[#111111] hover:bg-[#151515] hover:border-[#333333]"
        }`}
      >
        <div
          onClick={(e) => {
            e.stopPropagation();
            onToggleSelection(file.id);
          }}
          className="cursor-pointer text-gray-500 hover:text-white transition-colors shrink-0"
        >
          {isSelected ? (
            <SquareCheck className="w-4 h-4 md:w-5 md:h-5 text-white" />
          ) : (
            <Square className="w-4 h-4 md:w-5 md:h-5" />
          )}
        </div>

        <div className="text-gray-500 shrink-0 flex items-center justify-center w-6 h-6 md:w-8 md:h-8">
          {getFileIcon(file.mimeType)}
        </div>

        <div className="flex-1 min-w-0 flex flex-col md:flex-row md:items-center justify-between gap-1 md:gap-4">
          <div className="flex-1 min-w-0 flex flex-col">
            <h4
              className="font-medium text-sm text-gray-200 truncate"
              title={file.originalName}
            >
              {file.originalName}
            </h4>
            <p className="text-[11px] text-gray-500 truncate md:hidden mt-0.5">
              {formatBytes(file.size)} • {file.uploaderName || "anonymous"}
            </p>
          </div>

          <div className="hidden md:flex shrink-0 w-100 items-center gap-4 text-xs text-gray-500">
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

        <div className="flex justify-end shrink-0 pl-1">
          <ActionButtons />
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={handlePreviewOrDownload}
      className={`group flex flex-col rounded-lg border cursor-pointer transition-colors relative overflow-hidden select-none ${
        isSelected
          ? "border-white bg-[#1a1a1a]"
          : "border-[#222222] bg-[#111111] hover:bg-[#151515] hover:border-[#333333]"
      }`}
    >
      <div className="absolute top-3 left-3 z-10">
        <div
          onClick={(e) => {
            e.stopPropagation();
            onToggleSelection(file.id);
          }}
          className="cursor-pointer text-gray-400 hover:text-white transition-colors bg-[#111111]/50 rounded-md"
        >
          {isSelected ? (
            <SquareCheck className="w-5 h-5 text-white" />
          ) : (
            <Square className="w-5 h-5" />
          )}
        </div>
      </div>

      <div className="absolute top-2 right-2 z-10">
        <ActionButtons className="bg-[#111111]/80 backdrop-blur-sm rounded-md border border-[#222222]" />
      </div>

      <div className="h-36 bg-[#0a0a0a] border-b border-[#222222] flex items-center justify-center relative">
        <div className="text-gray-700 scale-150 transform">
          {getFileIcon(file.mimeType)}
        </div>
      </div>

      <div className="p-4 flex flex-col">
        <h4
          className="font-medium text-sm text-gray-200 truncate mb-1"
          title={file.originalName}
        >
          {file.originalName}
        </h4>
        <p className="text-xs text-gray-500 truncate mb-4">
          by {file.uploaderName || "anonymous"}
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
