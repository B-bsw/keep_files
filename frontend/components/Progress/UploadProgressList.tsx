import { Loader2, CloudUpload, File as FileIcon } from "lucide-react";
import { UploadTask } from "../../types";
import { ProgressBar } from "@heroui/react";

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function formatSpeed(bytesPerSec: number): string {
  if (bytesPerSec < 1024) return `${bytesPerSec.toFixed(0)} B/s`;
  if (bytesPerSec < 1024 * 1024) return `${(bytesPerSec / 1024).toFixed(1)} KB/s`;
  return `${(bytesPerSec / (1024 * 1024)).toFixed(1)} MB/s`;
}

export function UploadProgressList({ tasks }: { tasks: UploadTask[] }) {
  if (tasks.length === 0) return null;

  return (
    <div className="mb-12 flex flex-col gap-3">
      <h3 className="text-lg font-semibold mb-4 text-gray-700 dark:text-white/80">
        Uploading Files ({tasks.filter((t) => t.status === "uploading").length} remaining)
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {tasks.map((task) => (
          <div key={task.id} className="bg-[#F5FEFD] dark:bg-[#111111] border border-gray-200 dark:border-[#222222] rounded-lg p-4">
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center gap-3 truncate pr-4">
                <div className="p-2 rounded-md bg-[#F5FEFD] dark:bg-[#050505]">
                  {task.status === "uploading" ? (
                    <Loader2 className="w-4 h-4 text-gray-900 dark:text-white animate-spin shrink-0" />
                  ) : task.status === "success" ? (
                    <CloudUpload className="w-4 h-4 text-blue-500 dark:text-white shrink-0" />
                  ) : (
                    <FileIcon className="w-4 h-4 text-gray-500 dark:text-white shrink-0" />
                  )}
                </div>
                <span className="text-sm font-medium truncate text-gray-900 dark:text-gray-200">
                  {task.fileName}
                </span>
              </div>
              <span className="text-xs font-semibold shrink-0 text-gray-700 dark:text-white">
                {task.status === "success" ? "Done" : task.status === "error" ? "Failed" : `${task.progress}%`}
              </span>
            </div>
            <ProgressBar aria-label="Upload progress" value={task.progress} size="sm">
              <ProgressBar.Track className="bg-gray-100 dark:bg-[#222222]">
                <ProgressBar.Fill className="bg-blue-600 dark:bg-white" />
              </ProgressBar.Track>
            </ProgressBar>
            <div className="flex justify-between items-center mt-2 text-[11px] text-gray-400 dark:text-gray-500">
              <span>
                {task.uploadedBytes != null
                  ? `${formatBytes(task.uploadedBytes)} / ${formatBytes(task.fileSize)}`
                  : formatBytes(task.fileSize)}
              </span>
              {task.status === "uploading" && task.speed != null && task.speed > 0 && (
                <span>{formatSpeed(task.speed)}</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
