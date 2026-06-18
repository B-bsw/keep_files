import { Square, Eye, Download, Trash2, SquareCheck } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { FileData } from "../../types";
import { formatBytes, getFileIcon } from "../../utils";
import { Card, Button } from "@heroui/react";

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
  if (viewMode === "list") {
    return (
      <Card
        onClick={() => {
          if (file.mimeType.startsWith("image/")) {
            onActionRequest("preview", file);
          } else {
            onActionRequest("download", file);
          }
        }}
        className={`group bg-white/5 border cursor-pointer transition-colors ${isSelected ? "border-white bg-white/10" : "border-white/10 hover:border-white/20 hover:bg-white/[0.07]"} w-full`}
      >
        <Card.Content className="p-4 flex flex-row items-center gap-4 overflow-hidden">
          <div
            onClick={(e) => {
              e.stopPropagation();
              onToggleSelection(file.id);
            }}
            className="cursor-pointer text-gray-400 hover:text-white transition-colors"
          >
            {isSelected ? (
              <SquareCheck className="w-5 h-5 text-white" />
            ) : (
              <Square className="w-5 h-5" />
            )}
          </div>
          <div className="p-3 bg-black/30 rounded-xl shrink-0">
            {getFileIcon(file.mimeType)}
          </div>

          <div className="flex-1 min-w-0">
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

          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            {file.mimeType.startsWith("image/") && (
              <Button
                isIconOnly
                variant="ghost"
                onPress={() => onActionRequest("preview", file)}
                className="text-gray-400 hover:text-white border-0"
                aria-label="Preview Image"
              >
                <Eye className="w-4 h-4" />
              </Button>
            )}
            <Button
              isIconOnly
              variant="ghost"
              onPress={() => onActionRequest("download", file)}
              className="text-gray-400 hover:text-white border-0"
              aria-label="Download"
            >
              <Download className="w-4 h-4" />
            </Button>
            <Button
              isIconOnly
              variant="ghost"
              onPress={() => onDelete(file.id)}
              className="text-gray-400 hover:text-white border-0"
              aria-label="Delete"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </Card.Content>
      </Card>
    );
  }

  return (
    <Card
      onClick={() => {
        if (file.mimeType.startsWith("image/")) {
          onActionRequest("preview", file);
        } else {
          onActionRequest("download", file);
        }
      }}
      className={`group bg-white/5 border cursor-pointer transition-colors ${isSelected ? "border-white bg-white/10" : "border-white/10 hover:border-white/20 hover:bg-white/[0.07]"}`}
    >
      <Card.Content className="p-5 flex flex-col gap-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3 shrink-0">
            <div
              onClick={(e) => {
                e.stopPropagation();
                onToggleSelection(file.id);
              }}
              className="cursor-pointer text-gray-400 hover:text-white transition-colors"
            >
              {isSelected ? (
                <SquareCheck className="w-5 h-5 text-white" />
              ) : (
                <Square className="w-5 h-5" />
              )}
            </div>
            <div className="p-3 bg-black/30 rounded-xl">
              {getFileIcon(file.mimeType)}
            </div>
          </div>

          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            {file.mimeType.startsWith("image/") && (
              <Button
                isIconOnly
                variant="ghost"
                onPress={() => onActionRequest("preview", file)}
                className="text-gray-400 hover:text-white border-0"
                aria-label="Preview Image"
              >
                <Eye className="w-4 h-4" />
              </Button>
            )}
            <Button
              isIconOnly
              variant="ghost"
              onPress={() => onActionRequest("download", file)}
              className="text-gray-400 hover:text-white border-0"
              aria-label="Download"
            >
              <Download className="w-4 h-4" />
            </Button>
            <Button
              isIconOnly
              variant="ghost"
              onPress={() => onDelete(file.id)}
              className="text-gray-400 hover:text-white border-0"
              aria-label="Delete"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div>
          <h4
            className="font-medium text-gray-200 truncate mb-1"
            title={file.originalName}
          >
            {file.originalName}
          </h4>
        </div>
      </Card.Content>

      <Card.Footer className="pt-0 px-5 pb-5">
        <div className="flex justify-between items-center w-full pt-4 border-t border-white/5">
          <span className="text-xs text-gray-500">
            {formatBytes(file.size)}
          </span>
          <span className="text-xs text-gray-500">
            {formatDistanceToNow(new Date(file.uploadDate), {
              addSuffix: true,
            })}
          </span>
        </div>
      </Card.Footer>
    </Card>
  );
}
