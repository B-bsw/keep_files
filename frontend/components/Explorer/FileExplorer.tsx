"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { FileData, SortOption } from "../../types";
import { FileSidebar } from "./FileSidebar";
import { PreviewPane } from "./PreviewPane";
import { ChevronLeft } from "lucide-react";

type FileExplorerProps = {
  files: FileData[];
  sortedFiles: FileData[];
  selectedFiles: Set<string>;
  onFileClick: (id: string, multi: boolean, range: boolean) => void;
  onActionRequest: (
    type: "download" | "preview" | "edit",
    file: FileData
  ) => void;
  onDelete: (id: string) => void;
  sortOption: SortOption;
  setSortOption: (opt: SortOption) => void;
};

export function FileExplorer({
  files,
  sortedFiles,
  selectedFiles,
  onFileClick,
  onActionRequest,
  onDelete,
  sortOption,
  setSortOption,
}: FileExplorerProps) {
  const [activeFileId, setActiveFileId] = useState<string | null>(null);
  // Mobile: controls which panel is visible (sidebar vs preview)
  const [mobileShowPreview, setMobileShowPreview] = useState(false);

  // Desktop resize state
  const [sidebarWidth, setSidebarWidth] = useState(320);
  const [isResizing, setIsResizing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef(0);
  const startWidthRef = useRef(320);

  const activeFile = activeFileId
    ? files.find((f) => f.id === activeFileId) ?? null
    : null;

  // Preview state
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const handleFileSelect = useCallback(
    (id: string, multi: boolean, range: boolean) => {
      onFileClick(id, multi, range);
      if (!multi && !range) {
        setActiveFileId(id);
        // On mobile, slide to preview
        setMobileShowPreview(true);
      }
    },
    [onFileClick]
  );

  const handleMobileBack = useCallback(() => {
    setMobileShowPreview(false);
  }, []);

  // Fetch preview URL when active file changes
  useEffect(() => {
    if (!activeFile) {
      setPreviewUrl(null);
      return;
    }

    let cancelled = false;
    setPreviewLoading(true);

    fetch(`/api/files/${activeFile.id}/request-access`, { method: "POST" })
      .then((res) => {
        if (res.ok) return res.json();
        throw new Error("Failed");
      })
      .then((data) => {
        if (!cancelled) {
          setPreviewUrl(data.url);
          setPreviewLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setPreviewUrl(null);
          setPreviewLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [activeFile?.id]);

  // Desktop resize handlers
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      setIsResizing(true);
      startXRef.current = e.clientX;
      startWidthRef.current = sidebarWidth;
    },
    [sidebarWidth]
  );

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      const diff = e.clientX - startXRef.current;
      const newWidth = Math.max(240, Math.min(600, startWidthRef.current + diff));
      setSidebarWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizing]);

  return (
    <div
      ref={containerRef}
      className="relative h-[calc(100vh-280px)] min-h-[400px] md:min-h-[500px] rounded-xl border border-gray-200 dark:border-[#222222] overflow-hidden bg-white dark:bg-[#0a0a0a]"
    >
      {/* ── Mobile layout: slide between sidebar and preview ── */}
      <div className="md:hidden flex h-full w-full">
        {/* Sidebar panel (mobile) */}
        <div
          className={`absolute inset-0 z-10 bg-[#FAFFFE] dark:bg-[#0d0d0d] transition-transform duration-300 ease-in-out ${
            mobileShowPreview ? "-translate-x-full" : "translate-x-0"
          }`}
        >
          <FileSidebar
            files={sortedFiles}
            selectedFiles={selectedFiles}
            activeFileId={activeFileId}
            onFileSelect={handleFileSelect}
            onActionRequest={onActionRequest}
            onDelete={onDelete}
            sortOption={sortOption}
            setSortOption={setSortOption}
          />
        </div>

        {/* Preview panel (mobile) */}
        <div
          className={`absolute inset-0 z-10 bg-white dark:bg-[#111111] transition-transform duration-300 ease-in-out ${
            mobileShowPreview ? "translate-x-0" : "translate-x-full"
          }`}
        >
          {/* Mobile back button */}
          <div className="shrink-0 flex items-center gap-2 px-3 py-2 border-b border-gray-100 dark:border-[#1a1a1a] bg-[#FAFFFE] dark:bg-[#0d0d0d]">
            <button
              onClick={handleMobileBack}
              className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors -ml-1 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-white/8"
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="text-xs font-medium">Files</span>
            </button>
          </div>
          <div className="h-[calc(100%-41px)]">
            <PreviewPane
              file={activeFile}
              previewUrl={previewUrl}
              loading={previewLoading}
              onDownload={() => {
                if (activeFile) onActionRequest("download", activeFile);
              }}
              onEdit={() => {
                if (activeFile) onActionRequest("edit", activeFile);
              }}
              onDelete={() => {
                if (activeFile) {
                  onDelete(activeFile.id);
                  setActiveFileId(null);
                  setMobileShowPreview(false);
                }
              }}
            />
          </div>
        </div>
      </div>

      {/* ── Desktop layout: side-by-side with resizable divider ── */}
      <div className="hidden md:flex h-full">
        {/* Left sidebar */}
        <div
          className="shrink-0 flex flex-col border-r border-gray-200 dark:border-[#222222] overflow-hidden bg-[#FAFFFE] dark:bg-[#0d0d0d]"
          style={{ width: sidebarWidth }}
        >
          <FileSidebar
            files={sortedFiles}
            selectedFiles={selectedFiles}
            activeFileId={activeFileId}
            onFileSelect={handleFileSelect}
            onActionRequest={onActionRequest}
            onDelete={onDelete}
            sortOption={sortOption}
            setSortOption={setSortOption}
          />
        </div>

        {/* Resize handle */}
        <div
          onMouseDown={handleMouseDown}
          className={`w-1 shrink-0 cursor-col-resize transition-colors hover:bg-blue-500/40 dark:hover:bg-white/20 ${
            isResizing
              ? "bg-blue-500/50 dark:bg-white/30"
              : "bg-transparent"
          }`}
        />

        {/* Right preview pane */}
        <div className="flex-1 min-w-0 overflow-hidden bg-white dark:bg-[#111111]">
          <PreviewPane
            file={activeFile}
            previewUrl={previewUrl}
            loading={previewLoading}
            onDownload={() => {
              if (activeFile) onActionRequest("download", activeFile);
            }}
            onEdit={() => {
              if (activeFile) onActionRequest("edit", activeFile);
            }}
            onDelete={() => {
              if (activeFile) {
                onDelete(activeFile.id);
                setActiveFileId(null);
              }
            }}
          />
        </div>
      </div>
    </div>
  );
}
