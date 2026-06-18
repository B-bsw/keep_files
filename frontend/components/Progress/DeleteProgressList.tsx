import { Loader2, Trash2, File as FileIcon } from "lucide-react";
import { DeleteTask } from "../../types";
import { ProgressBar } from "@heroui/react";

export function DeleteProgressList({ tasks }: { tasks: DeleteTask[] }) {
  if (tasks.length === 0) return null;

  return (
    <div className="mb-12 flex flex-col gap-3">
      <h3 className="text-lg font-semibold mb-4 text-white/80">
        Deleting Files (
        {tasks.filter((t) => t.status === "deleting").length} remaining)
      </h3>
      <div className="flex flex-wrap gap-4">
        {tasks.map((task) => (
          <div key={task.id} className="bg-[#111111] border border-[#222222] rounded-lg p-4 flex-1 min-w-[280px]">
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center gap-3 truncate pr-4">
                <div className="p-2 rounded-md bg-[#050505]">
                  {task.status === "deleting" ? (
                    <Loader2 className="w-4 h-4 text-white animate-spin shrink-0" />
                  ) : task.status === "success" ? (
                    <Trash2 className="w-4 h-4 text-white shrink-0" />
                  ) : (
                    <FileIcon className="w-4 h-4 text-white shrink-0" />
                  )}
                </div>
                <span className="text-sm font-medium truncate text-gray-200">
                  {task.fileName}
                </span>
              </div>
              <span className="text-xs font-semibold shrink-0 text-white">
                {task.status === "success"
                  ? "Done"
                  : task.status === "error"
                    ? "Failed"
                    : `${task.progress}%`}
              </span>
            </div>
            <ProgressBar 
              aria-label="Delete progress"
              value={task.progress}
              size="sm"
            >
              <ProgressBar.Track className="bg-[#222222]">
                <ProgressBar.Fill className="bg-red-500" />
              </ProgressBar.Track>
            </ProgressBar>
          </div>
        ))}
      </div>
    </div>
  );
}
