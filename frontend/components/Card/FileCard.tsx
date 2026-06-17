
import {
  CheckSquare,
  Square,
  Eye,
  Download,
  Trash2,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { FileData } from "../../types";
import { formatBytes, getFileIcon } from "../../utils";

type FileCardProps = {
  file: FileData;
  viewMode: "grid" | "list";
  isSelected: boolean;
  onToggleSelection: (id: string) => void;
  onActionRequest: (type: "download" | "preview", file: FileData) => void;
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
  return (
    <div
      className={
        viewMode === "grid"
          ? `relative group bg-white/5 border ${isSelected ? "border-indigo-500 bg-indigo-500/5" : "border-white/10 hover:border-white/20 hover:bg-white/[0.07]"} rounded-2xl p-5 flex flex-col transition-all duration-300`
          : `group bg-white/5 border ${isSelected ? "border-indigo-500 bg-indigo-500/5" : "border-white/10 hover:border-white/20 hover:bg-white/[0.07]"} rounded-2xl p-4 flex items-center gap-4 transition-all duration-300`
      }
    >
      <div
        className={
          viewMode === "grid"
            ? "flex items-start justify-between mb-4"
            : "flex items-center gap-4 flex-1"
        }
      >
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => onToggleSelection(file.id)}
            className="text-gray-400 hover:text-white transition-colors"
          >
            {isSelected ? (
              <CheckSquare className="w-5 h-5 text-indigo-400" />
            ) : (
              <Square className="w-5 h-5 opacity-50 group-hover:opacity-100" />
            )}
          </button>
          <div className="p-3 bg-black/30 rounded-xl">
            {getFileIcon(file.mimeType)}
          </div>
        </div>

        <div className={viewMode === "grid" ? "hidden" : "flex-1 min-w-0"}>
          <h4
            className="font-medium text-gray-200 truncate mb-1"
            title={file.originalName}
          >
            {file.originalName}
          </h4>
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <span>{formatBytes(file.size)}</span>
            <span>
              {formatDistanceToNow(new Date(file.uploadDate), {
                addSuffix: true,
              })}
            </span>
          </div>
        </div>

        <div
          className={`flex gap-2 ${viewMode === "grid" ? "opacity-0 group-hover:opacity-100" : "opacity-0 group-hover:opacity-100"} transition-opacity`}
        >
          {file.mimeType.startsWith("image/") && (
            <button
              onClick={() => onActionRequest("preview", file)}
              className="p-2 hover:bg-indigo-500/20 rounded-lg text-gray-400 hover:text-indigo-400 transition-colors"
              title="Preview Image"
            >
              <Eye className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={() => onActionRequest("download", file)}
            className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors"
            title="Download"
          >
            <Download className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(file.id)}
            className="p-2 hover:bg-red-500/20 rounded-lg text-gray-400 hover:text-red-400 transition-colors"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {viewMode === "grid" && (
        <>
          <h4
            className="font-medium text-gray-200 truncate mb-1"
            title={file.originalName}
          >
            {file.originalName}
          </h4>

          <div className="flex justify-between items-center mt-auto pt-4 border-t border-white/5">
            <span className="text-xs text-gray-500">
              {formatBytes(file.size)}
            </span>
            <span className="text-xs text-gray-500">
              {formatDistanceToNow(new Date(file.uploadDate), {
                addSuffix: true,
              })}
            </span>
          </div>
        </>
      )}
    </div>
  );
}
