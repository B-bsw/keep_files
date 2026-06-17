import { motion } from "framer-motion";
import { Loader2, CloudUpload, File as FileIcon } from "lucide-react";
import { UploadTask } from "../../types";
import { Card, ProgressBar } from "@heroui/react";

export function UploadProgressList({ tasks }: { tasks: UploadTask[] }) {
  if (tasks.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-12 flex flex-col gap-3"
    >
      <h3 className="text-lg font-semibold mb-4 text-white/80">
        Uploading Files (
        {tasks.filter((t) => t.status === "uploading").length} remaining)
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {tasks.map((task) => (
          <Card key={task.id} className="bg-white/5 border border-white/10 shadow-xl">
            <Card.Content className="p-4">
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-3 truncate pr-4">
                  <div
                    className={`p-2 rounded-lg ${task.status === "error" ? "bg-red-500/10" : task.status === "success" ? "bg-success/10" : "bg-primary/10"}`}
                  >
                    {task.status === "uploading" ? (
                      <Loader2 className="w-4 h-4 text-primary animate-spin shrink-0" />
                    ) : task.status === "success" ? (
                      <CloudUpload className="w-4 h-4 text-success shrink-0" />
                    ) : (
                      <FileIcon className="w-4 h-4 text-danger shrink-0" />
                    )}
                  </div>
                  <span className="text-sm font-medium truncate text-gray-200">
                    {task.file.name}
                  </span>
                </div>
                <span
                  className={`text-xs font-semibold shrink-0 ${task.status === "success" ? "text-success" : task.status === "error" ? "text-danger" : "text-primary"}`}
                >
                  {task.status === "success"
                    ? "Done"
                    : task.status === "error"
                      ? "Failed"
                      : `${task.progress}%`}
                </span>
              </div>
              <ProgressBar 
                aria-label="Upload progress"
                value={task.progress}
                color={task.status === "error" ? "danger" : task.status === "success" ? "success" : "accent"}
                size="sm"
              >
                <ProgressBar.Track className="bg-black/50">
                  <ProgressBar.Fill />
                </ProgressBar.Track>
              </ProgressBar>
            </Card.Content>
          </Card>
        ))}
      </div>
    </motion.div>
  );
}
