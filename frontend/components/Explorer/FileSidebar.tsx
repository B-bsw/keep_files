"use client";

import { useMemo, useState } from "react";
import {
  ChevronRight,
  ChevronDown,
  Folder,
  FolderOpen,
  File as FileIcon,
  Image as ImageIcon,
  Video,
  Music,
  FileText,
  Archive,
  FileSpreadsheet,
  FileCode,
  ArrowUpDown,
  ArrowDown,
  ArrowUp,
  Search,
} from "lucide-react";
import { FileData, SortOption } from "../../types";
import { formatBytes } from "../../utils";
import { format } from "timeago.js";

// ── File type icon mapping ──────────────────────────────────────────────────
function getFileTypeIcon(file: FileData) {
  const mime = file.mimeType.toLowerCase();
  const ext = file.originalName.split(".").pop()?.toLowerCase() ?? "";

  if (mime.startsWith("image/") || ["png", "jpg", "jpeg", "gif", "webp", "svg", "bmp", "heic", "heif"].includes(ext))
    return <ImageIcon className="w-4 h-4 text-sky-400" />;
  if (mime.startsWith("video/") || ["mp4", "mov", "webm", "mkv", "avi"].includes(ext))
    return <Video className="w-4 h-4 text-violet-400" />;
  if (mime.startsWith("audio/") || ["mp3", "wav", "ogg", "flac", "m4a"].includes(ext))
    return <Music className="w-4 h-4 text-pink-400" />;
  if (mime === "application/pdf" || ext === "pdf")
    return <FileText className="w-4 h-4 text-red-400" />;
  if (["xlsx", "xls", "csv"].includes(ext) || mime.includes("spreadsheet") || mime.includes("excel"))
    return <FileSpreadsheet className="w-4 h-4 text-emerald-400" />;
  if (["docx", "doc"].includes(ext) || mime.includes("wordprocessingml") || mime.includes("msword"))
    return <FileText className="w-4 h-4 text-blue-400" />;
  if (["zip", "tar", "gz", "rar", "7z"].includes(ext) || mime.includes("zip") || mime.includes("tar") || mime.includes("rar"))
    return <Archive className="w-4 h-4 text-amber-400" />;
  if (["ts", "tsx", "js", "jsx", "py", "go", "rs", "java", "cpp", "c", "h", "html", "css", "json", "xml", "yaml", "yml", "sh"].includes(ext))
    return <FileCode className="w-4 h-4 text-teal-400" />;
  if (mime.startsWith("text/") || ["txt", "md", "log"].includes(ext))
    return <FileText className="w-4 h-4 text-gray-400" />;

  return <FileIcon className="w-4 h-4 text-gray-400" />;
}

// ── Group files by extension category ───────────────────────────────────────
type FileGroup = {
  label: string;
  icon: "image" | "video" | "audio" | "document" | "archive" | "code" | "other";
  files: FileData[];
};

function categorizeFile(file: FileData): string {
  const mime = file.mimeType.toLowerCase();
  const ext = file.originalName.split(".").pop()?.toLowerCase() ?? "";

  if (mime.startsWith("image/") || ["png", "jpg", "jpeg", "gif", "webp", "svg", "bmp", "heic", "heif"].includes(ext))
    return "Images";
  if (mime.startsWith("video/") || ["mp4", "mov", "webm", "mkv", "avi"].includes(ext))
    return "Videos";
  if (mime.startsWith("audio/") || ["mp3", "wav", "ogg", "flac", "m4a"].includes(ext))
    return "Audio";
  if (mime === "application/pdf" || ext === "pdf" || ["docx", "doc", "xlsx", "xls", "csv", "pptx", "ppt"].includes(ext) || mime.includes("spreadsheet") || mime.includes("excel") || mime.includes("wordprocessingml") || mime.includes("msword"))
    return "Documents";
  if (["zip", "tar", "gz", "rar", "7z"].includes(ext) || mime.includes("zip") || mime.includes("tar") || mime.includes("rar"))
    return "Archives";
  if (["ts", "tsx", "js", "jsx", "py", "go", "rs", "java", "cpp", "c", "h", "html", "css", "json", "xml", "yaml", "yml", "sh"].includes(ext))
    return "Code";
  return "Other";
}

const CATEGORY_ORDER = ["Images", "Videos", "Audio", "Documents", "Archives", "Code", "Other"];

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  Images: <ImageIcon className="w-3.5 h-3.5 text-sky-400/70" />,
  Videos: <Video className="w-3.5 h-3.5 text-violet-400/70" />,
  Audio: <Music className="w-3.5 h-3.5 text-pink-400/70" />,
  Documents: <FileText className="w-3.5 h-3.5 text-blue-400/70" />,
  Archives: <Archive className="w-3.5 h-3.5 text-amber-400/70" />,
  Code: <FileCode className="w-3.5 h-3.5 text-teal-400/70" />,
  Other: <FileIcon className="w-3.5 h-3.5 text-gray-400/70" />,
};

// ── Sort label ──────────────────────────────────────────────────────────────
const SORT_LABELS: Record<string, string> = {
  date: "Date",
  size: "Size",
  name: "Name",
  type: "Type",
  uploader: "Uploader",
};

type FileSidebarProps = {
  files: FileData[];
  selectedFiles: Set<string>;
  activeFileId: string | null;
  onFileSelect: (id: string, multi: boolean, range: boolean) => void;
  onActionRequest: (
    type: "download" | "preview" | "edit",
    file: FileData
  ) => void;
  onDelete: (id: string) => void;
  sortOption: SortOption;
  setSortOption: (opt: SortOption) => void;
};

export function FileSidebar({
  files,
  selectedFiles,
  activeFileId,
  onFileSelect,
  onActionRequest,
  onDelete,
  sortOption,
  setSortOption,
}: FileSidebarProps) {
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(
    new Set()
  );
  const [searchQuery, setSearchQuery] = useState("");

  // Group files by category
  const groups = useMemo(() => {
    const filtered = searchQuery
      ? files.filter((f) =>
          f.originalName.toLowerCase().includes(searchQuery.toLowerCase())
        )
      : files;

    const map = new Map<string, FileData[]>();
    filtered.forEach((file) => {
      const cat = categorizeFile(file);
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push(file);
    });

    return CATEGORY_ORDER.filter((cat) => map.has(cat)).map((cat) => ({
      label: cat,
      files: map.get(cat)!,
    }));
  }, [files, searchQuery]);

  const toggleGroup = (label: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      return next;
    });
  };

  // Parse sort info
  const sortBase = sortOption.replace(/-(?:asc|desc)$/, "");
  const sortDir = sortOption.endsWith("asc") ? "asc" : "desc";

  const cycleSortOnField = (field: string) => {
    if (sortBase === field) {
      setSortOption(
        `${field}-${sortDir === "desc" ? "asc" : "desc"}` as SortOption
      );
    } else {
      setSortOption(`${field}-desc` as SortOption);
    }
  };

  return (
    <div className="flex flex-col h-full select-none">
      {/* Search bar */}
      <div className="shrink-0 px-3 pt-3 pb-2">
        <div className="relative">
          <Search className="absolute left-3 md:left-2.5 top-1/2 -translate-y-1/2 w-4 md:w-3.5 h-4 md:h-3.5 text-gray-400 dark:text-gray-500 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search files…"
            className="w-full h-10 md:h-8 pl-9 md:pl-8 pr-3 text-sm md:text-xs rounded-lg border border-gray-200 dark:border-[#222222] bg-white dark:bg-[#111111] text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-600 focus:outline-none focus:border-gray-300 dark:focus:border-[#333333] transition-colors"
          />
        </div>
      </div>

      {/* Sort bar */}
      <div className="shrink-0 flex items-center gap-1 md:gap-1.5 px-3 pb-2 border-b border-gray-100 dark:border-[#1a1a1a] overflow-x-auto">
        <ArrowUpDown className="w-3 h-3 text-gray-400 dark:text-gray-500 shrink-0" />
        {["name", "type", "size", "date"].map((field) => (
          <button
            key={field}
            onClick={() => cycleSortOnField(field)}
            className={`text-[11px] md:text-[10px] uppercase tracking-wider font-semibold px-2 md:px-1.5 py-1 md:py-0.5 rounded transition-colors flex items-center gap-0.5 shrink-0 ${
              sortBase === field
                ? "text-gray-900 dark:text-white bg-gray-100 dark:bg-[#1a1a1a]"
                : "text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
            }`}
          >
            {SORT_LABELS[field]}
            {sortBase === field &&
              (sortDir === "desc" ? (
                <ArrowDown className="w-2.5 h-2.5" />
              ) : (
                <ArrowUp className="w-2.5 h-2.5" />
              ))}
          </button>
        ))}
      </div>

      {/* File tree */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden py-1 scrollbar-thin">
        {files.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-6">
            <FileIcon className="w-10 h-10 text-gray-300 dark:text-gray-600 mb-3" />
            <p className="text-sm text-gray-400 dark:text-gray-500">
              No files uploaded yet
            </p>
          </div>
        ) : groups.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-center px-6">
            <p className="text-xs text-gray-400 dark:text-gray-500">
              No files match &ldquo;{searchQuery}&rdquo;
            </p>
          </div>
        ) : (
          groups.map((group) => {
            const isCollapsed = collapsedGroups.has(group.label);
            return (
              <div key={group.label} className="mb-0.5">
                {/* Group header */}
                <button
                  onClick={() => toggleGroup(group.label)}
                  className="w-full flex items-center gap-2 md:gap-1.5 px-3 py-2.5 md:py-1.5 text-[11px] md:text-[10px] font-bold uppercase tracking-[0.08em] text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 active:bg-gray-100 dark:active:bg-[#151515] hover:bg-gray-50 dark:hover:bg-[#111111] transition-colors"
                >
                  {isCollapsed ? (
                    <ChevronRight className="w-3.5 md:w-3 h-3.5 md:h-3 shrink-0" />
                  ) : (
                    <ChevronDown className="w-3.5 md:w-3 h-3.5 md:h-3 shrink-0" />
                  )}
                  {isCollapsed ? (
                    <Folder className="w-4 md:w-3.5 h-4 md:h-3.5 shrink-0 text-gray-400 dark:text-gray-500" />
                  ) : (
                    <FolderOpen className="w-4 md:w-3.5 h-4 md:h-3.5 shrink-0 text-gray-400 dark:text-gray-500" />
                  )}
                  <span className="flex-1 text-left">{group.label}</span>
                  <span className="text-[10px] md:text-[9px] font-mono text-gray-300 dark:text-gray-600 tabular-nums">
                    {group.files.length}
                  </span>
                </button>

                {/* File items */}
                {!isCollapsed && (
                  <div className="ml-1 md:ml-2">
                    {group.files.map((file) => {
                      const isActive = activeFileId === file.id;
                      const isSelected = selectedFiles.has(file.id);
                      return (
                        <button
                          key={file.id}
                          onClick={(e) => {
                            onFileSelect(
                              file.id,
                              e.ctrlKey || e.metaKey,
                              e.shiftKey
                            );
                          }}
                          onDoubleClick={() =>
                            onActionRequest("preview", file)
                          }
                          className={`group w-full flex items-center gap-2.5 md:gap-2 pl-5 md:pl-4 pr-3 py-2.5 md:py-1.5 text-left transition-all duration-100 rounded-lg md:rounded-md mx-1 active:scale-[0.98] ${
                            isActive
                              ? "bg-blue-50 dark:bg-white/8 text-gray-900 dark:text-white"
                              : isSelected
                                ? "bg-blue-50/50 dark:bg-white/4 text-gray-800 dark:text-gray-200"
                                : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#111111] active:bg-gray-100 dark:active:bg-[#151515] hover:text-gray-900 dark:hover:text-gray-200"
                          }`}
                          title={`${file.originalName}\n${formatBytes(file.size)} • ${format(file.uploadDate)}`}
                        >
                          {/* File type indicator */}
                          <div className="shrink-0">{getFileTypeIcon(file)}</div>

                          {/* File name */}
                          <span className="flex-1 min-w-0 truncate text-sm md:text-[13px]">
                            {file.originalName}
                          </span>

                          {/* File size - always visible on mobile, hover on desktop */}
                          <span
                            className={`shrink-0 text-[10px] font-mono tabular-nums transition-opacity ${
                              isActive
                                ? "text-gray-500 dark:text-gray-400 opacity-100"
                                : "text-gray-300 dark:text-gray-600 opacity-100 md:opacity-0 md:group-hover:opacity-100"
                            }`}
                          >
                            {formatBytes(file.size)}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Footer status */}
      <div className="shrink-0 px-3 py-2 border-t border-gray-100 dark:border-[#1a1a1a] text-[10px] font-mono text-gray-400 dark:text-gray-600 flex items-center justify-between">
        <span>
          {files.length} file{files.length !== 1 ? "s" : ""}
          {selectedFiles.size > 0 && ` • ${selectedFiles.size} selected`}
        </span>
        <span>
          {formatBytes(files.reduce((sum, f) => sum + f.size, 0))}
        </span>
      </div>
    </div>
  );
}
