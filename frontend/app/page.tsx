"use client";

import { useEffect, useRef, useState } from "react";
import {
  Loader2,
  File as FileIcon,
  Trash2,
  ArrowDown,
  ArrowUp,
} from "lucide-react";
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
  const xhrMap = useRef<Map<string, XMLHttpRequest>>(new Map());
  const [dragActive, setDragActive] = useState(false);

  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewFile, setPreviewFile] = useState<FileData | null>(null);
  const [appConfig, setAppConfig] = useState<{
    apiUrl: string;
    accessKey: string;
    auth?: string;
  } | null>(null);
  const appConfigRef = useRef<{
    apiUrl: string;
    accessKey: string;
    auth?: string;
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
  const [uploaderName, setUploaderName] = useState("");

  const getExt = (name: string) => name.split(".").pop()?.toLowerCase() ?? "";

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
      case "type-asc":
        return getExt(a.originalName).localeCompare(getExt(b.originalName));
      case "type-desc":
        return getExt(b.originalName).localeCompare(getExt(a.originalName));
      case "uploader-asc":
        return (a.uploaderName || "").localeCompare(b.uploaderName || "");
      case "uploader-desc":
        return (b.uploaderName || "").localeCompare(a.uploaderName || "");
      default:
        return 0;
    }
  });

  const fetchFiles = async (cfg?: {
    apiUrl: string;
    accessKey: string;
    auth?: string;
  }) => {
    try {
      setError(null);
      const config = cfg ?? appConfig;
      const url = config ? `${config.apiUrl}/files` : "/api/files";
      const headers: HeadersInit = {};
      if (config) {
        const token = config.auth || config.accessKey;
        if (token) headers["Authorization"] = `Bearer ${token}`;
      }
      const res = await fetch(url, { headers, credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setFiles(data);
      } else if (res.status === 401) {
        window.location.href = "/login";
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
    fetch("/api/config")
      .then((res) => res.json())
      .then((data) => {
        setAppConfig(data);
        appConfigRef.current = data;
        fetchFiles(data);
      })
      .catch(() => fetchFiles());
  }, []);

  useEffect(() => {
    if (!appConfig) return;

    let wsUrl = appConfig.apiUrl.replace(/^http/, "ws") + "/ws";
    const token = appConfig.auth || appConfig.accessKey;
    if (token) {
      wsUrl += `?key=${token}`;
    }

    const ws = new WebSocket(wsUrl);

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        if (message.type === "FILE_ADDED") {
          setFiles((prev) => {
            if (prev.some((f) => f.id === message.data.id)) return prev;
            return [message.data, ...prev];
          });
        } else if (message.type === "FILE_DELETED") {
          setFiles((prev) => prev.filter((f) => f.id !== message.data.id));
        } else if (message.type === "FILE_UPDATED") {
          setFiles((prev) =>
            prev.map((f) => (f.id === message.data.id ? message.data : f)),
          );
        }
      } catch (e) {
        console.error("Error parsing WebSocket message:", e);
      }
    };

    return () => {
      ws.close();
    };
  }, [appConfig]);

  // We will handle cleanup individually inside the functions so they don't block each other

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
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

  const MAX_FILE_SIZE = 5 * 1024 * 1024 * 1024; // 5 GB

  const handleMultipleUploads = (files: File[]) => {
    const oversized = files.filter((f) => f.size > MAX_FILE_SIZE);
    oversized.forEach((f) =>
      toast(`${f.name} เกินขนาดสูงสุด 5 GB`, { variant: "danger" }),
    );
    files = files.filter((f) => f.size <= MAX_FILE_SIZE);
    if (files.length === 0) return;

    const newTasks: UploadTask[] = files.map((file) => {
      let finalFile = file;
      if (file.name.toLowerCase().endsWith(".jpeg")) {
        const newName = file.name.replace(/\.jpeg$/i, ".jpg");
        finalFile = new File([file], newName, { type: file.type });
      }
      return {
        id: Math.random().toString(36).substring(7),
        file: finalFile,
        fileName: finalFile.name,
        fileSize: finalFile.size,
        mimeType: finalFile.type,
        progress: 0,
        status: "uploading" as const,
      };
    });

    setUploadTasks((prev) => [...prev, ...newTasks]);
    newTasks.forEach((task) => uploadSingleFile(task));
  };

  const CHUNK_SIZE = 90 * 1024 * 1024; // 90 MB — stays under Cloudflare 100MB limit

  const uploadSingleFile = async (task: UploadTask) => {
    if (!task.file) return;

    const cfg = appConfigRef.current;
    const apiUrl =
      cfg?.apiUrl || process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
    const token = cfg?.auth || cfg?.accessKey;
    const authHeader: Record<string, string> = token
      ? { Authorization: `Bearer ${token}` }
      : {};

    const SPEED_SAMPLES = 10;
    const smoothSpeed = (samples: number[], newSample: number): number[] => {
      const next = [...samples, newSample].slice(-SPEED_SAMPLES);
      return next;
    };
    const avgSpeed = (samples: number[]) =>
      samples.length ? samples.reduce((a, b) => a + b, 0) / samples.length : 0;

    // Small files — send directly via stream (no chunking needed)
    if (task.fileSize <= CHUNK_SIZE) {
      const xhr = new XMLHttpRequest();
      xhrMap.current.set(task.id, xhr);
      let lastLoaded = 0;
      let lastTime = Date.now();
      let samples: number[] = [];

      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable) {
          const now = Date.now();
          const dt = (now - lastTime) / 1000;
          const raw = dt > 0 ? (e.loaded - lastLoaded) / dt : 0;
          lastLoaded = e.loaded;
          lastTime = now;
          if (raw > 0) samples = smoothSpeed(samples, raw);
          const speed = avgSpeed(samples);
          setUploadTasks((prev) =>
            prev.map((t) =>
              t.id === task.id
                ? {
                    ...t,
                    progress: Math.round((e.loaded / e.total) * 100),
                    uploadedBytes: e.loaded,
                    speed,
                    speedSamples: samples,
                  }
                : t,
            ),
          );
        }
      });

      xhr.addEventListener("load", async () => {
        xhrMap.current.delete(task.id);
        if (xhr.status >= 200 && xhr.status < 300) {
          setUploadTasks((prev) =>
            prev.map((t) =>
              t.id === task.id ? { ...t, status: "success", progress: 100 } : t,
            ),
          );
          setTimeout(
            () =>
              setUploadTasks((prev) => prev.filter((t) => t.id !== task.id)),
            150,
          );
          await fetchFiles();
        } else {
          setUploadTasks((prev) =>
            prev.map((t) => (t.id === task.id ? { ...t, status: "error" } : t)),
          );
          toast(`อัปโหลดไฟล์ ${task.fileName} ไม่สำเร็จ`, {
            variant: "danger",
          });
        }
      });

      xhr.addEventListener("error", () => {
        xhrMap.current.delete(task.id);
        setUploadTasks((prev) =>
          prev.map((t) => (t.id === task.id ? { ...t, status: "error" } : t)),
        );
        toast(`อัปโหลดไฟล์ ${task.fileName} ไม่สำเร็จ`, { variant: "danger" });
      });

      xhr.addEventListener("abort", () => {
        xhrMap.current.delete(task.id);
        setUploadTasks((prev) => prev.filter((t) => t.id !== task.id));
      });

      xhr.open("POST", `${apiUrl}/files/upload/stream`);
      xhr.withCredentials = true;
      if (token) xhr.setRequestHeader("Authorization", `Bearer ${token}`);
      xhr.setRequestHeader("X-File-Name", encodeURIComponent(task.fileName));
      xhr.setRequestHeader("X-Uploader-Name", uploaderName.trim() || "anonymous");
      xhr.setRequestHeader(
        "Content-Type",
        task.mimeType || "application/octet-stream",
      );
      xhr.send(task.file);
      return;
    }

    // Large files — chunked upload via session API
    const abortRef = { aborted: false };
    xhrMap.current.set(task.id, {
      abort: () => {
        abortRef.aborted = true;
      },
    } as XMLHttpRequest);

    try {
      // Create session
      const sessionRes = await fetch(`${apiUrl}/files/upload/session`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeader },
        body: JSON.stringify({
          fileName: task.fileName,
          mimeType: task.mimeType || "application/octet-stream",
          totalSize: task.fileSize,
          uploaderName: uploaderName.trim() || "anonymous",
        }),
      });
      if (!sessionRes.ok) throw new Error("Failed to create session");
      const { sessionId } = await sessionRes.json();

      setUploadTasks((prev) =>
        prev.map((t) => (t.id === task.id ? { ...t, sessionId } : t)),
      );

      let lastTime = Date.now();
      let lastBytes = 0;
      let samples: number[] = [];

      for (let offset = 0; offset < task.fileSize; offset += CHUNK_SIZE) {
        if (abortRef.aborted) {
          xhrMap.current.delete(task.id);
          setUploadTasks((prev) => prev.filter((t) => t.id !== task.id));
          return;
        }

        const chunk = task.file.slice(
          offset,
          Math.min(offset + CHUNK_SIZE, task.fileSize),
        );
        const end = offset + chunk.size - 1;

        // Use XHR for this chunk to get upload progress
        await new Promise<void>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhrMap.current.set(task.id, xhr);

          xhr.upload.addEventListener("progress", (e) => {
            if (e.lengthComputable) {
              const now = Date.now();
              const dt = (now - lastTime) / 1000;
              const uploadedBytes = offset + e.loaded;
              const raw = dt > 0 ? (uploadedBytes - lastBytes) / dt : 0;
              lastTime = now;
              lastBytes = uploadedBytes;
              if (raw > 0) samples = smoothSpeed(samples, raw);
              const speed = avgSpeed(samples);
              setUploadTasks((prev) =>
                prev.map((t) =>
                  t.id === task.id
                    ? {
                        ...t,
                        progress: Math.round(
                          (uploadedBytes / task.fileSize) * 100,
                        ),
                        uploadedBytes,
                        speed,
                        speedSamples: samples,
                      }
                    : t,
                ),
              );
            }
          });

          xhr.addEventListener("load", () => {
            if (xhr.status >= 200 && xhr.status < 300) resolve();
            else reject(new Error(`Chunk failed: ${xhr.status}`));
          });
          xhr.addEventListener("error", () =>
            reject(new Error("Network error")),
          );
          xhr.addEventListener("abort", () => {
            abortRef.aborted = true;
            resolve();
          });

          xhr.open("PUT", `${apiUrl}/files/upload/session/${sessionId}`);
          xhr.withCredentials = true;
          if (token) xhr.setRequestHeader("Authorization", `Bearer ${token}`);
          xhr.setRequestHeader("Content-Type", "application/octet-stream");
          xhr.setRequestHeader(
            "Content-Range",
            `bytes ${offset}-${end}/${task.fileSize}`,
          );
          xhr.send(chunk);
        });

        if (abortRef.aborted) {
          xhrMap.current.delete(task.id);
          setUploadTasks((prev) => prev.filter((t) => t.id !== task.id));
          return;
        }
      }

      xhrMap.current.delete(task.id);
      setUploadTasks((prev) =>
        prev.map((t) =>
          t.id === task.id ? { ...t, status: "success", progress: 100 } : t,
        ),
      );
      setTimeout(
        () => setUploadTasks((prev) => prev.filter((t) => t.id !== task.id)),
        150,
      );
      await fetchFiles();
    } catch (err) {
      console.error(err);
      xhrMap.current.delete(task.id);
      setUploadTasks((prev) =>
        prev.map((t) => (t.id === task.id ? { ...t, status: "error" } : t)),
      );
      toast(`อัปโหลดไฟล์ ${task.fileName} ไม่สำเร็จ`, { variant: "danger" });
    }
  };

  const handleCancelUpload = (taskId: string) => {
    xhrMap.current.get(taskId)?.abort();
    // Clean up session on server if this was a chunked upload
    const task = uploadTasks.find((t) => t.id === taskId);
    if (task?.sessionId) {
      const cfg = appConfigRef.current;
      const apiUrl =
        cfg?.apiUrl ||
        process.env.NEXT_PUBLIC_API_URL ||
        "http://localhost:3001";
      const token = cfg?.auth || cfg?.accessKey;
      fetch(`${apiUrl}/files/upload/session/${task.sessionId}`, {
        method: "DELETE",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      }).catch(() => {});
    }
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

  const anchorId = useRef<string | null>(null);

  const handleFileClick = (id: string, multi: boolean, range: boolean) => {
    if (range && anchorId.current) {
      const ids = sortedFiles.map((f) => f.id);
      const anchorIdx = ids.indexOf(anchorId.current);
      const targetIdx = ids.indexOf(id);
      if (anchorIdx !== -1 && targetIdx !== -1) {
        const [from, to] = anchorIdx < targetIdx ? [anchorIdx, targetIdx] : [targetIdx, anchorIdx];
        const rangeIds = ids.slice(from, to + 1);
        setSelectedFiles((prev) => {
          const next = new Set(prev);
          rangeIds.forEach((rid) => next.add(rid));
          return next;
        });
        return;
      }
    }
    if (multi) {
      const newSelected = new Set(selectedFiles);
      if (newSelected.has(id)) {
        newSelected.delete(id);
      } else {
        newSelected.add(id);
      }
      anchorId.current = id;
      setSelectedFiles(newSelected);
    } else {
      anchorId.current = id;
      setSelectedFiles(selectedFiles.size === 1 && selectedFiles.has(id) ? new Set() : new Set([id]));
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
          setPreviewFile(file);
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
    <div className="min-h-screen bg-[#F5FEFD] dark:bg-[#050505] text-gray-900 dark:text-white transition-colors duration-300">
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

        <div className="flex items-center gap-3 -mt-8 mb-12">
          <label className="text-xs font-medium text-gray-500 dark:text-gray-500 shrink-0">
            Your name
          </label>
          <input
            type="text"
            value={uploaderName}
            onChange={(e) => setUploaderName(e.target.value)}
            placeholder="anonymous"
            maxLength={64}
            className="flex-1 max-w-xs h-8 px-3 text-sm rounded-lg border border-gray-200 dark:border-white/8 bg-white dark:bg-[#111111] text-gray-900 dark:text-gray-100 placeholder:text-gray-300 dark:placeholder:text-gray-600 focus:outline-none focus:border-gray-400 dark:focus:border-white/25 transition-colors"
          />
        </div>

        <UploadProgressList tasks={uploadTasks} onCancel={handleCancelUpload} />
        <DeleteProgressList tasks={deleteTasks} />

        <div>
          <FileToolbar
            filesCount={files.length}
            selectedCount={selectedFiles.size}
            isAllSelected={files.length > 0 && selectedFiles.size === files.length}
            onToggleSelectAll={() =>
              selectedFiles.size === files.length
                ? setSelectedFiles(new Set())
                : setSelectedFiles(new Set(files.map((f) => f.id)))
            }
            onBulkDelete={handleBulkDelete}
            onClearSelection={() => setSelectedFiles(new Set())}
            viewMode={viewMode}
            setViewMode={setViewMode}
            sortOption={sortOption}
            setSortOption={setSortOption}
          />

          {viewMode === "list" && files.length > 0 && !loading && !error && (
            <div className="hidden md:flex items-center gap-3 md:gap-4 px-3 md:px-4 py-2 mt-4 mb-2 text-[10px] font-semibold text-gray-500 uppercase tracking-widest border-b border-gray-200 dark:border-white/5 select-none">
              <div className="flex-1 min-w-0 flex items-center justify-between gap-1 md:gap-4">
                <div
                  className="flex-1 min-w-0 flex items-center gap-1 cursor-pointer hover:text-gray-900 dark:hover:text-white transition-colors"
                  onClick={() =>
                    setSortOption(
                      sortOption === "name-desc" ? "name-asc" : "name-desc",
                    )
                  }
                >
                  Name
                  {sortOption.startsWith("name") &&
                    (sortOption.endsWith("desc") ? (
                      <ArrowDown className="w-3 h-3" />
                    ) : (
                      <ArrowUp className="w-3 h-3" />
                    ))}
                </div>
                <div className="hidden md:flex shrink-0 w-100 items-center gap-4">
                  <div
                    className="w-16 flex items-center gap-1 cursor-pointer hover:text-gray-900 dark:hover:text-white transition-colors"
                    onClick={() =>
                      setSortOption(
                        sortOption === "type-desc" ? "type-asc" : "type-desc",
                      )
                    }
                  >
                    Type
                    {sortOption.startsWith("type") &&
                      (sortOption.endsWith("desc") ? (
                        <ArrowDown className="w-3 h-3" />
                      ) : (
                        <ArrowUp className="w-3 h-3" />
                      ))}
                  </div>
                  <div
                    className="flex-1 flex items-center gap-1 cursor-pointer hover:text-gray-900 dark:hover:text-white transition-colors"
                    onClick={() =>
                      setSortOption(
                        sortOption === "uploader-desc"
                          ? "uploader-asc"
                          : "uploader-desc",
                      )
                    }
                  >
                    Uploader
                    {sortOption.startsWith("uploader") &&
                      (sortOption.endsWith("desc") ? (
                        <ArrowDown className="w-3 h-3" />
                      ) : (
                        <ArrowUp className="w-3 h-3" />
                      ))}
                  </div>
                  <div
                    className="w-20 flex justify-end items-center gap-1 cursor-pointer hover:text-gray-900 dark:hover:text-white transition-colors"
                    onClick={() =>
                      setSortOption(
                        sortOption === "size-desc" ? "size-asc" : "size-desc",
                      )
                    }
                  >
                    Size
                    {sortOption.startsWith("size") &&
                      (sortOption.endsWith("desc") ? (
                        <ArrowDown className="w-3 h-3" />
                      ) : (
                        <ArrowUp className="w-3 h-3" />
                      ))}
                  </div>
                  <div
                    className="w-32 flex justify-end items-center gap-1 cursor-pointer hover:text-gray-900 dark:hover:text-white transition-colors"
                    onClick={() =>
                      setSortOption(
                        sortOption === "date-desc" ? "date-asc" : "date-desc",
                      )
                    }
                  >
                    Date
                    {sortOption.startsWith("date") &&
                      (sortOption.endsWith("desc") ? (
                        <ArrowDown className="w-3 h-3" />
                      ) : (
                        <ArrowUp className="w-3 h-3" />
                      ))}
                  </div>
                </div>
              </div>
              <div className="w-8 shrink-0 pl-1" />
            </div>
          )}

          {error ? (
            <div className="text-center py-20 border border-gray-200 dark:border-white/20 rounded-3xl bg-[#F5FEFD] dark:bg-white/5">
              <div className="w-16 h-16 rounded-full bg-red-50 dark:bg-white/10 flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-8 h-8 text-red-500 dark:text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Connection Error
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">
                {error}
              </p>
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
              <Loader2 className="w-8 h-8 animate-spin text-gray-400 dark:text-white" />
            </div>
          ) : files.length === 0 ? (
            <div className="text-center py-20 border border-dashed border-gray-200 dark:border-white/5 rounded-3xl bg-[#F5FEFD]/50 dark:bg-white/2">
              <FileIcon className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <p className="text-xl text-gray-500 dark:text-gray-400">
                No files uploaded yet.
              </p>
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
                  onFileClick={handleFileClick}
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
        file={previewFile}
        onClose={() => {
          setPreviewModalOpen(false);
          setPreviewFile(null);
        }}
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
