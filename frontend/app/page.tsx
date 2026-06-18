"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, File as FileIcon, Trash2, ArrowDown, ArrowUp } from "lucide-react";
import { FileData, UploadTask, DeleteTask, SortOption } from "../types";
import { Header } from "../components/Header/Header";
import { UploadArea } from "../components/UploadArea";
import { UploadProgressList } from "../components/Progress/UploadProgressList";
import { DeleteProgressList } from "../components/Progress/DeleteProgressList";
import { FileToolbar } from "../components/Toolbar/FileToolbar";
import { FileCard } from "../components/Card/FileCard";
import { PreviewModal } from "../components/Modal/PreviewModal";
import { ConfirmModal } from "../components/Modal/ConfirmModal";
import { EditModal } from "../components/Modal/EditModal";
import { Button, toast } from "@heroui/react";

export default function Dashboard() {
  const [files, setFiles] = useState<FileData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploadTasks, setUploadTasks] = useState<UploadTask[]>([]);
  const [deleteTasks, setDeleteTasks] = useState<DeleteTask[]>([]);
  const [dragActive, setDragActive] = useState(false);

  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [appConfig, setAppConfig] = useState<{
    apiUrl: string;
    accessKey: string;
  } | null>(null);

  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{
    title: string;
    description: string;
    onConfirm: () => void;
  } | null>(null);

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [fileToEdit, setFileToEdit] = useState<FileData | null>(null);

  const [sortOption, setSortOption] = useState<SortOption>("date-desc");

  const sortedFiles = [...files].sort((a, b) => {
    switch (sortOption) {
      case "date-desc":
        return (
          new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime()
        );
      case "date-asc":
        return (
          new Date(a.uploadDate).getTime() - new Date(b.uploadDate).getTime()
        );
      case "size-desc":
        return b.size - a.size;
      case "size-asc":
        return a.size - b.size;
      case "name-asc":
        return a.originalName.localeCompare(b.originalName);
      case "name-desc":
        return b.originalName.localeCompare(a.originalName);
      default:
        return 0;
    }
  });

  const router = useRouter();

  const fetchFiles = async () => {
    try {
      setError(null);
      const res = await fetch("/api/files");
      if (res.ok) {
        const data = await res.json();
        setFiles(data);
      } else if (res.status === 401) {
        router.push("/login");
      } else if (res.status === 503) {
        const errData = await res.json().catch(() => ({}));
        setError(
          errData.message ||
            "Unable to connect to the database. Please ensure the database service is running.",
        );
      } else {
        setError("Unable to connect to the server. Please try again later.");
      }
    } catch (err) {
      console.error(err);
      setError("Unable to connect to the server. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
    fetch("/api/config")
      .then((res) => res.json())
      .then((data) => setAppConfig(data))
      .catch(console.error);
  }, []);

  // We will handle cleanup individually inside the functions so they don't block each other

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleMultipleUploads(Array.from(e.dataTransfer.files));
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files.length > 0) {
      handleMultipleUploads(Array.from(e.target.files));
    }
  };

  const handleMultipleUploads = (files: File[]) => {
    const newTasks: UploadTask[] = files.map((file) => {
      let finalFile = file;
      if (file.name.toLowerCase().endsWith(".jpeg")) {
        const newName = file.name.replace(/\.jpeg$/i, ".jpg");
        finalFile = new File([file], newName, { type: file.type });
      }
      return {
        id: Math.random().toString(36).substring(7),
        file: finalFile,
        progress: 0,
        status: "uploading",
      };
    });

    setUploadTasks((prev) => [...prev, ...newTasks]);

    newTasks.forEach((task) => {
      uploadSingleFile(task);
    });
  };

  const uploadSingleFile = (task: UploadTask) => {
    const formData = new FormData();
    formData.append("file", task.file);
    formData.append("uploaderName", "anonymous");

    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener("progress", (e) => {
      if (e.lengthComputable) {
        const percent = Math.round((e.loaded / e.total) * 100);
        setUploadTasks((prev) =>
          prev.map((t) => (t.id === task.id ? { ...t, progress: percent } : t)),
        );
      }
    });

    xhr.addEventListener("load", async () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        setUploadTasks((prev) =>
          prev.map((t) =>
            t.id === task.id ? { ...t, status: "success", progress: 100 } : t,
          ),
        );
        setTimeout(() => {
          setUploadTasks((prev) => prev.filter((t) => t.id !== task.id));
        }, 150);
        await fetchFiles();
      } else {
        setUploadTasks((prev) =>
          prev.map((t) => (t.id === task.id ? { ...t, status: "error" } : t)),
        );
        toast(`อัปโหลดไฟล์ ${task.file.name} ไม่สำเร็จ`, { variant: "danger" });
      }
    });

    xhr.addEventListener("error", () => {
      setUploadTasks((prev) =>
        prev.map((t) => (t.id === task.id ? { ...t, status: "error" } : t)),
      );
      toast(
        `อัปโหลดไฟล์ ${task.file.name} ไม่สำเร็จ กรุณาตรวจสอบการเชื่อมต่อ`,
        { variant: "danger" },
      );
    });

    const uploadUrl = appConfig
      ? `${appConfig.apiUrl}/files/upload`
      : "/api/files/upload";
    xhr.open("POST", uploadUrl);

    if (appConfig?.accessKey) {
      xhr.setRequestHeader("x-access-key", appConfig.accessKey);
    }

    xhr.send(formData);
  };

  const handleDelete = (id: string) => {
    const fileToDelete = files.find((f) => f.id === id);
    if (!fileToDelete) return;

    setConfirmAction({
      title: "Delete File",
      description:
        "Are you sure you want to delete this file? This action cannot be undone.",
      onConfirm: async () => {
        const taskId = id;
        setDeleteTasks((prev) => [
          ...prev,
          {
            id: taskId,
            fileName: fileToDelete.originalName,
            progress: 0,
            status: "deleting",
          },
        ]);

        const progressInterval = setInterval(() => {
          setDeleteTasks((prev) =>
            prev.map((t) => {
              if (t.id === taskId && t.status === "deleting") {
                return { ...t, progress: Math.min(t.progress + 15, 90) };
              }
              return t;
            }),
          );
        }, 100);

        try {
          const res = await fetch(`/api/files/${id}`, { method: "DELETE" });
          clearInterval(progressInterval);
          if (res.ok) {
            setDeleteTasks((prev) =>
              prev.map((t) =>
                t.id === taskId
                  ? { ...t, status: "success", progress: 100 }
                  : t,
              ),
            );
            setTimeout(() => {
              setDeleteTasks((prev) => prev.filter((t) => t.id !== taskId));
            }, 150);
            setFiles((prev) => prev.filter((f) => f.id !== id));
            if (selectedFiles.has(id)) {
              const newSelected = new Set(selectedFiles);
              newSelected.delete(id);
              setSelectedFiles(newSelected);
            }
          } else {
            setDeleteTasks((prev) =>
              prev.map((t) =>
                t.id === taskId ? { ...t, status: "error" } : t,
              ),
            );
            toast("Error deleting file", { variant: "danger" });
          }
        } catch (error) {
          clearInterval(progressInterval);
          console.error(error);
          setDeleteTasks((prev) =>
            prev.map((t) => (t.id === taskId ? { ...t, status: "error" } : t)),
          );
          toast("Error deleting file", { variant: "danger" });
        }
      },
    });
    setConfirmModalOpen(true);
  };

  const handleBulkDelete = () => {
    if (selectedFiles.size === 0) return;

    setConfirmAction({
      title: "Delete Files",
      description: `Are you sure you want to delete ${selectedFiles.size} items? This action cannot be undone.`,
      onConfirm: async () => {
        const filesToDelete = Array.from(selectedFiles)
          .map((id) => files.find((f) => f.id === id))
          .filter(Boolean) as FileData[];

        const newTasks: DeleteTask[] = filesToDelete.map((f) => ({
          id: f.id,
          fileName: f.originalName,
          progress: 0,
          status: "deleting",
        }));

        setDeleteTasks((prev) => [...prev, ...newTasks]);

        const progressInterval = setInterval(() => {
          setDeleteTasks((prev) =>
            prev.map((t) => {
              if (
                newTasks.some((nt) => nt.id === t.id) &&
                t.status === "deleting"
              ) {
                return { ...t, progress: Math.min(t.progress + 15, 90) };
              }
              return t;
            }),
          );
        }, 100);

        try {
          await Promise.all(
            filesToDelete.map(async (f) => {
              try {
                const res = await fetch(`/api/files/${f.id}`, {
                  method: "DELETE",
                });
                if (res.ok) {
                  setDeleteTasks((prev) =>
                    prev.map((t) =>
                      t.id === f.id
                        ? { ...t, status: "success", progress: 100 }
                        : t,
                    ),
                  );
                  setTimeout(() => {
                    setDeleteTasks((prev) => prev.filter((t) => t.id !== f.id));
                  }, 150);
                } else {
                  setDeleteTasks((prev) =>
                    prev.map((t) =>
                      t.id === f.id ? { ...t, status: "error" } : t,
                    ),
                  );
                }
              } catch (error) {
                setDeleteTasks((prev) =>
                  prev.map((t) =>
                    t.id === f.id ? { ...t, status: "error" } : t,
                  ),
                );
              }
            }),
          );

          clearInterval(progressInterval);

          setFiles((prev) => prev.filter((f) => !selectedFiles.has(f.id)));
          setSelectedFiles(new Set());
        } catch (error) {
          clearInterval(progressInterval);
          console.error(error);
          toast("Error deleting some files", { variant: "danger" });
        }
      },
    });
    setConfirmModalOpen(true);
  };

  const toggleSelection = (id: string) => {
    const newSelected = new Set(selectedFiles);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedFiles(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedFiles.size === files.length) {
      setSelectedFiles(new Set());
    } else {
      setSelectedFiles(new Set(files.map((f) => f.id)));
    }
  };

  const handleActionRequest = async (
    type: "download" | "preview" | "edit",
    file: FileData,
  ) => {
    if (type === "edit") {
      setFileToEdit(file);
      setEditModalOpen(true);
      return;
    }

    try {
      const res = await fetch(`/api/files/${file.id}/request-access`, {
        method: "POST",
      });

      if (res.ok) {
        const data = await res.json();

        if (type === "download") {
          window.open(data.url, "_blank");
        } else if (type === "preview") {
          setPreviewUrl(data.url);
          setPreviewModalOpen(true);
        }
      } else {
        toast("Failed to get file access token", { variant: "danger" });
      }
    } catch (error) {
      console.error(error);
      toast("Error requesting file access", { variant: "danger" });
    }
  };

  const handleEditFile = async (
    id: string,
    newName: string,
    newUploader: string,
  ) => {
    try {
      const res = await fetch(`/api/files/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          originalName: newName,
          uploaderName: newUploader,
        }),
      });
      if (res.ok) {
        await fetchFiles();
        toast("File updated successfully");
      } else {
        toast("Failed to update file", { variant: "danger" });
      }
    } catch (err) {
      toast("Error updating file", { variant: "danger" });
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      <Header onLogout={handleLogout} />

      <main className="max-w-4xl mx-auto px-6 py-6">
        <UploadArea
          dragActive={dragActive}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onChange={handleChange}
        />

        <UploadProgressList tasks={uploadTasks} />
        <DeleteProgressList tasks={deleteTasks} />

        <div>
          <FileToolbar
            filesCount={files.length}
            selectedCount={selectedFiles.size}
            isAllSelected={
              files.length > 0 && selectedFiles.size === files.length
            }
            onToggleSelectAll={toggleSelectAll}
            onBulkDelete={handleBulkDelete}
            viewMode={viewMode}
            setViewMode={setViewMode}
            sortOption={sortOption}
            setSortOption={setSortOption}
          />

          {viewMode === "list" && files.length > 0 && !loading && !error && (
            <div className="hidden md:flex items-center gap-3 md:gap-4 px-3 md:px-4 py-2 mt-4 mb-2 text-[10px] font-semibold text-gray-500 uppercase tracking-widest border-b border-white/5 select-none">
              <div className="w-4 h-4 md:w-5 md:h-5 shrink-0" />
              <div className="flex-1 min-w-0 flex items-center justify-between gap-1 md:gap-4">
                <div 
                  className="flex-1 min-w-0 flex items-center gap-1 cursor-pointer hover:text-white transition-colors"
                  onClick={() => setSortOption(sortOption === "name-desc" ? "name-asc" : "name-desc")}
                >
                  Name
                  {sortOption.startsWith("name") && (
                    sortOption.endsWith("desc") ? <ArrowDown className="w-3 h-3" /> : <ArrowUp className="w-3 h-3" />
                  )}
                </div>
                <div className="hidden md:flex shrink-0 w-100 items-center gap-4">
                  <div className="w-16">Type</div>
                  <div className="flex-1">Uploader</div>
                  <div 
                    className="w-20 flex justify-end items-center gap-1 cursor-pointer hover:text-white transition-colors"
                    onClick={() => setSortOption(sortOption === "size-desc" ? "size-asc" : "size-desc")}
                  >
                    Size
                    {sortOption.startsWith("size") && (
                      sortOption.endsWith("desc") ? <ArrowDown className="w-3 h-3" /> : <ArrowUp className="w-3 h-3" />
                    )}
                  </div>
                  <div 
                    className="w-32 flex justify-end items-center gap-1 cursor-pointer hover:text-white transition-colors"
                    onClick={() => setSortOption(sortOption === "date-desc" ? "date-asc" : "date-desc")}
                  >
                    Date
                    {sortOption.startsWith("date") && (
                      sortOption.endsWith("desc") ? <ArrowDown className="w-3 h-3" /> : <ArrowUp className="w-3 h-3" />
                    )}
                  </div>
                </div>
              </div>
              <div className="w-8 shrink-0 pl-1" />
            </div>
          )}

          {error ? (
            <div className="text-center py-20 border border-white/20 rounded-3xl bg-white/5">
              <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">
                Connection Error
              </h3>
              <p className="text-gray-400 mb-6 max-w-md mx-auto">{error}</p>
              <Button
                onPress={() => {
                  setLoading(true);
                  fetchFiles();
                }}
                variant="tertiary"
                className="font-medium"
              >
                Try Again
              </Button>
            </div>
          ) : loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-white" />
            </div>
          ) : files.length === 0 ? (
            <div className="text-center py-20 border border-white/5 rounded-3xl bg-white/2">
              <FileIcon className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-xl text-gray-400">No files uploaded yet.</p>
            </div>
          ) : (
            <div
              className={
                viewMode === "grid"
                  ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                  : "flex flex-col gap-4"
              }
            >
              {sortedFiles.map((file) => (
                <FileCard
                  key={file.id}
                  file={file}
                  viewMode={viewMode}
                  isSelected={selectedFiles.has(file.id)}
                  onToggleSelection={toggleSelection}
                  onActionRequest={handleActionRequest}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      <PreviewModal
        isOpen={previewModalOpen}
        previewUrl={previewUrl}
        onClose={() => setPreviewModalOpen(false)}
      />

      <ConfirmModal
        isOpen={confirmModalOpen}
        onOpenChange={setConfirmModalOpen}
        title={confirmAction?.title || ""}
        description={confirmAction?.description || ""}
        onConfirm={() => {
          if (confirmAction?.onConfirm) confirmAction.onConfirm();
        }}
        confirmText="Delete"
      />

      <EditModal
        isOpen={editModalOpen}
        onOpenChange={setEditModalOpen}
        file={fileToEdit}
        onSave={handleEditFile}
      />
    </div>
  );
}
