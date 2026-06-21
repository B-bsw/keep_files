"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import {
  Download,
  Pencil,
  Trash2,
  AlertCircle,
  File as FileIcon,
  Maximize2,
} from "lucide-react";
import { FileData } from "../../types";
import { formatBytes } from "../../utils";
import { format } from "timeago.js";

// ── Shimmer / skeleton ──────────────────────────────────────────────────────
function Shimmer({
  className = "",
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={`animate-pulse bg-gray-200 dark:bg-white/8 rounded ${className}`}
      style={style}
    />
  );
}

// ── Detect preview kind ─────────────────────────────────────────────────────
type PreviewKind =
  | "image"
  | "pdf"
  | "xlsx"
  | "docx"
  | "video"
  | "audio"
  | "text"
  | "unsupported";

function detectKind(file: FileData): PreviewKind {
  const mime = file.mimeType.toLowerCase();
  const ext = file.originalName.split(".").pop()?.toLowerCase() ?? "";

  if (
    mime.startsWith("image/") ||
    ["png", "jpg", "jpeg", "gif", "webp", "svg", "bmp", "heic", "heif"].includes(ext)
  )
    return "image";
  if (mime === "application/pdf" || ext === "pdf") return "pdf";
  if (
    ["xlsx", "xls", "csv"].includes(ext) ||
    mime.includes("spreadsheet") ||
    mime.includes("excel")
  )
    return "xlsx";
  if (
    ["docx", "doc"].includes(ext) ||
    mime.includes("wordprocessingml") ||
    mime.includes("msword")
  )
    return "docx";
  if (
    mime.startsWith("video/") ||
    ["mp4", "mov", "webm", "mkv", "avi"].includes(ext)
  )
    return "video";
  if (
    mime.startsWith("audio/") ||
    ["mp3", "wav", "ogg", "flac", "m4a"].includes(ext)
  )
    return "audio";
  if (
    mime.startsWith("text/") ||
    [
      "txt", "md", "json", "xml", "yaml", "yml", "log", "sh",
      "ts", "tsx", "js", "jsx", "css", "html",
    ].includes(ext)
  )
    return "text";
  return "unsupported";
}

// ── Dynamic viewers (no SSR) ────────────────────────────────────────────────
const PdfViewer = dynamic(() => import("../Modal/PdfViewerInner"), {
  ssr: false,
  loading: () => <PreviewSkeleton />,
});

const XlsxViewer = dynamic(() => import("../Modal/XlsxViewerInner"), {
  ssr: false,
  loading: () => <PreviewSkeleton />,
});

const DocxViewer = dynamic(() => import("../Modal/DocxViewerInner"), {
  ssr: false,
  loading: () => <PreviewSkeleton />,
});

function PreviewSkeleton() {
  return (
    <div className="flex flex-col gap-3 p-6 h-full">
      <Shimmer className="w-full h-6 rounded" />
      <Shimmer className="w-5/6 h-4 rounded" />
      <Shimmer className="w-full h-4 rounded" />
      <Shimmer className="w-4/6 h-4 rounded" />
      <Shimmer className="w-full h-4 mt-2 rounded" />
      <Shimmer className="w-3/4 h-4 rounded" />
      <Shimmer className="w-full h-32 mt-4 rounded" />
    </div>
  );
}

// ── Image viewer with HEIC ──────────────────────────────────────────────────
function InlineImageViewer({
  url,
  fileName,
}: {
  url: string;
  fileName: string;
}) {
  const [src, setSrc] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const ext = fileName.split(".").pop()?.toLowerCase() ?? "";
    let objectUrl: string | null = null;

    async function load() {
      setLoading(true);
      setError(false);
      try {
        if (ext === "heic" || ext === "heif") {
          const heic2any = (await import("heic2any")).default;
          const res = await fetch(url);
          const blob = await res.blob();
          const converted = await heic2any({
            blob,
            toType: "image/png",
            quality: 0.92,
          });
          objectUrl = URL.createObjectURL(converted as Blob);
          setSrc(objectUrl);
        } else {
          setSrc(url);
        }
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    }

    load();
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [url, fileName]);

  if (loading) {
    return (
      <div className="flex items-center justify-center w-full h-full">
        <Shimmer className="w-3/4 h-3/4 rounded-lg" />
      </div>
    );
  }
  if (error || !src) return <UnsupportedView />;

  return (
    <div className="flex items-center justify-center w-full h-full p-4">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={fileName}
        className="max-w-full max-h-full object-contain rounded-lg"
      />
    </div>
  );
}

// ── Video viewer ────────────────────────────────────────────────────────────
function InlineVideoViewer({ url }: { url: string }) {
  return (
    <div className="flex items-center justify-center w-full h-full bg-black p-2">
      <video
        src={url}
        controls
        autoPlay={false}
        className="max-w-full max-h-full outline-none rounded"
      />
    </div>
  );
}

// ── Audio viewer ────────────────────────────────────────────────────────────
function InlineAudioViewer({
  url,
  fileName,
}: {
  url: string;
  fileName: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-5 w-full h-full px-8">
      <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-white/6 flex items-center justify-center">
        <svg
          viewBox="0 0 24 24"
          className="w-8 h-8 text-gray-400 dark:text-gray-500"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 9l10.5-3m0 6.553v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 11-.99-3.467l2.31-.66a2.25 2.25 0 001.632-2.16zm0 0V2.25L9 5.25v10.303m0 0v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 01-.99-3.467l2.31-.66A2.25 2.25 0 009 15.553z"
          />
        </svg>
      </div>
      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 text-center truncate max-w-xs">
        {fileName}
      </p>
      <audio src={url} controls className="w-full max-w-sm" />
    </div>
  );
}

// ── Text viewer ─────────────────────────────────────────────────────────────
function InlineTextViewer({ url }: { url: string }) {
  const [content, setContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(url)
      .then((r) => r.text())
      .then((t) => setContent(t))
      .catch(() => setContent(null))
      .finally(() => setLoading(false));
  }, [url]);

  if (loading) return <PreviewSkeleton />;
  if (content === null) return <UnsupportedView />;

  return (
    <div className="w-full h-full overflow-auto p-5">
      <pre className="text-xs text-gray-800 dark:text-gray-200 font-mono whitespace-pre-wrap break-words leading-relaxed">
        {content}
      </pre>
    </div>
  );
}

// ── Unsupported ─────────────────────────────────────────────────────────────
function UnsupportedView() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 w-full h-full text-center px-8">
      <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center">
        <AlertCircle className="w-5 h-5 text-amber-500" />
      </div>
      <p className="text-sm font-semibold text-gray-800 dark:text-white">
        Preview not available
      </p>
      <p className="text-xs text-gray-500 dark:text-gray-400">
        This file type cannot be previewed.
        <br />
        Download to open locally.
      </p>
    </div>
  );
}

// ── Main PreviewPane ────────────────────────────────────────────────────────
type PreviewPaneProps = {
  file: FileData | null;
  previewUrl: string | null;
  loading: boolean;
  onDownload: () => void;
  onEdit: () => void;
  onDelete: () => void;
};

export function PreviewPane({
  file,
  previewUrl,
  loading,
  onDownload,
  onEdit,
  onDelete,
}: PreviewPaneProps) {
  // Empty state
  if (!file) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center px-8 gap-3">
        <div className="w-16 h-16 rounded-2xl bg-gray-50 dark:bg-white/4 flex items-center justify-center">
          <FileIcon className="w-8 h-8 text-gray-300 dark:text-gray-600" />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-400 dark:text-gray-500">
            Select a file to preview
          </p>
          <p className="text-xs text-gray-300 dark:text-gray-600 mt-1">
            Click on a file in the sidebar
          </p>
        </div>
      </div>
    );
  }

  const kind = detectKind(file);
  const ext = file.originalName.split(".").pop()?.toUpperCase() ?? "";

  return (
    <div className="flex flex-col h-full">
      {/* Header bar */}
      <div className="shrink-0 flex items-center justify-between px-4 py-2.5 border-b border-gray-100 dark:border-[#1a1a1a] bg-[#FAFFFE] dark:bg-[#0d0d0d]">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-[9px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-[#1a1a1a] px-1.5 py-0.5 rounded shrink-0">
            {ext}
          </span>
          <span className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
            {file.originalName}
          </span>
          <span className="text-[10px] font-mono text-gray-400 dark:text-gray-600 shrink-0">
            {formatBytes(file.size)}
          </span>
        </div>

        <div className="flex items-center gap-1 shrink-0 ml-3">
          <button
            onClick={onEdit}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/8 transition-colors"
            aria-label="Edit"
            title="Edit"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onDownload}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/8 transition-colors"
            aria-label="Download"
            title="Download"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onDelete}
            className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
            aria-label="Delete"
            title="Delete"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* File meta */}
      <div className="shrink-0 flex items-center gap-4 px-4 py-2 text-[10px] text-gray-400 dark:text-gray-500 border-b border-gray-50 dark:border-[#151515]">
        <span>Uploaded by <strong className="text-gray-600 dark:text-gray-400">{file.uploaderName || "anonymous"}</strong></span>
        <span>{format(file.uploadDate)}</span>
      </div>

      {/* Preview content */}
      <div className="flex-1 overflow-hidden bg-gray-50 dark:bg-[#0a0a0a]">
        {loading ? (
          <PreviewSkeleton />
        ) : previewUrl ? (
          <>
            {kind === "image" && (
              <InlineImageViewer url={previewUrl} fileName={file.originalName} />
            )}
            {kind === "pdf" && <PdfViewer url={previewUrl} />}
            {kind === "xlsx" && <XlsxViewer url={previewUrl} />}
            {kind === "docx" && <DocxViewer url={previewUrl} />}
            {kind === "video" && <InlineVideoViewer url={previewUrl} />}
            {kind === "audio" && (
              <InlineAudioViewer
                url={previewUrl}
                fileName={file.originalName}
              />
            )}
            {kind === "text" && <InlineTextViewer url={previewUrl} />}
            {kind === "unsupported" && <UnsupportedView />}
          </>
        ) : (
          <UnsupportedView />
        )}
      </div>
    </div>
  );
}
