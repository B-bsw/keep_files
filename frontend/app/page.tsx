"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, File as FileIcon, Trash2 } from "lucide-react";
import { FileData, UploadTask, SortOption } from "../types";
import { Header } from "../components/Header/Header";
import { UploadArea } from "../components/UploadArea";
import { UploadProgressList } from "../components/Progress/UploadProgressList";
import { FileToolbar } from "../components/Toolbar/FileToolbar";
import { FileCard } from "../components/Card/FileCard";
import { PreviewModal } from "../components/Modal/PreviewModal";
import { ConfirmModal } from "../components/Modal/ConfirmModal";
import { Button, toast } from "@heroui/react";

export default function Dashboard() {
  const [files, setFiles] = useState<FileData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploadTasks, setUploadTasks] = useState<UploadTask[]>([]);
  const [dragActive, setDragActive] = useState(false);

  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
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

  useEffect(() => {
    const hasUploading = uploadTasks.some((t) => t.status === "uploading");
    const hasSuccess = uploadTasks.some((t) => t.status === "success");

    if (!hasUploading && hasSuccess) {
      const timer = setTimeout(() => {
        setUploadTasks((prev) => prev.filter((t) => t.status !== "success"));
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [uploadTasks]);

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
    const newTasks: UploadTask[] = files.map((file) => ({
      id: Math.random().toString(36).substring(7),
      file,
      progress: 0,
      status: "uploading",
    }));

    setUploadTasks((prev) => [...prev, ...newTasks]);

    newTasks.forEach((task) => {
      uploadSingleFile(task);
    });
  };

  const uploadSingleFile = (task: UploadTask) => {
    const formData = new FormData();
    formData.append("file", task.file);
    formData.append("uploaderName", "Web User");

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
      toast(`อัปโหลดไฟล์ ${task.file.name} ไม่สำเร็จ กรุณาตรวจสอบการเชื่อมต่อ`, { variant: "danger" });
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
    setConfirmAction({
      title: "Delete File",
      description: "Are you sure you want to delete this file? This action cannot be undone.",
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/files/${id}`, { method: "DELETE" });
          if (res.ok) {
            setFiles((prev) => prev.filter((f) => f.id !== id));
            if (selectedFiles.has(id)) {
              const newSelected = new Set(selectedFiles);
              newSelected.delete(id);
              setSelectedFiles(newSelected);
            }
          }
        } catch (error) {
          console.error(error);
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
        try {
          await Promise.all(
            Array.from(selectedFiles).map((id) =>
              fetch(`/api/files/${id}`, { method: "DELETE" }),
            ),
          );

          setFiles((prev) => prev.filter((f) => !selectedFiles.has(f.id)));
          setSelectedFiles(new Set());
        } catch (error) {
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
    type: "download" | "preview",
    file: FileData,
  ) => {
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

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      <Header onLogout={handleLogout} />

      <main className="max-w-7xl mx-auto px-6 py-12">
        <UploadArea
          dragActive={dragActive}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onChange={handleChange}
        />

        <UploadProgressList tasks={uploadTasks} />

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
            <div className="text-center py-20 border border-white/5 rounded-3xl bg-white/[0.02]">
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
    </div>
  );
}
