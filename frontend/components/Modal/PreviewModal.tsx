"use client";

import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { Modal } from "@heroui/react";
import { FileData } from "../../types";
import { Download, AlertCircle } from "lucide-react";

// ── Skeletons ───────────────────────────────────────────────────────────────
function Shimmer({ className = "", style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <div
      className={`animate-pulse bg-gray-200 dark:bg-white/8 rounded ${className}`}
      style={style}
    />
  );
}

function ImageSkeleton() {
  return (
    <div className="flex items-center justify-center w-full h-full bg-gray-50 dark:bg-[#0a0a0a] p-8">
      <Shimmer className="w-full h-full max-w-2xl rounded-lg" />
    </div>
  );
}

function PdfSkeleton() {
  return (
    <div className="flex flex-col h-full">
      {/* toolbar skeleton */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100 dark:border-white/6 shrink-0">
        <div className="flex items-center gap-2">
          <Shimmer className="w-5 h-5 rounded" />
          <Shimmer className="w-16 h-4 rounded" />
          <Shimmer className="w-5 h-5 rounded" />
        </div>
        <div className="flex items-center gap-2">
          <Shimmer className="w-5 h-5 rounded" />
          <Shimmer className="w-10 h-4 rounded" />
          <Shimmer className="w-5 h-5 rounded" />
        </div>
      </div>
      {/* page skeleton */}
      <div className="flex-1 flex justify-center items-start bg-gray-100 dark:bg-[#0a0a0a] p-6 overflow-hidden">
        <div className="w-full max-w-xl flex flex-col gap-3">
          <Shimmer className="w-full h-8 rounded" />
          <Shimmer className="w-5/6 h-4 rounded" />
          <Shimmer className="w-full h-4 rounded" />
          <Shimmer className="w-4/6 h-4 rounded" />
          <Shimmer className="w-full h-4 mt-2 rounded" />
          <Shimmer className="w-3/4 h-4 rounded" />
          <Shimmer className="w-full h-4 rounded" />
          <Shimmer className="w-5/6 h-4 rounded" />
          <Shimmer className="w-2/3 h-4 rounded" />
          <Shimmer className="w-full h-4 mt-2 rounded" />
          <Shimmer className="w-full h-4 rounded" />
          <Shimmer className="w-4/5 h-4 rounded" />
          <Shimmer className="w-full h-32 mt-4 rounded" />
          <Shimmer className="w-5/6 h-4 rounded" />
          <Shimmer className="w-full h-4 rounded" />
          <Shimmer className="w-3/5 h-4 rounded" />
        </div>
      </div>
    </div>
  );
}

function TextSkeleton() {
  return (
    <div className="w-full h-full bg-white dark:bg-[#0d0d0d] p-6 flex flex-col gap-2">
      {[100, 80, 95, 60, 100, 75, 90, 50, 100, 70, 85, 65, 100, 55].map(
        (w, i) => (
          <Shimmer key={i} className={`h-3 rounded`} style={{ width: `${w}%` } as React.CSSProperties} />
        ),
      )}
    </div>
  );
}

function AudioSkeleton() {
  return (
    <div className="flex flex-col items-center justify-center gap-6 w-full h-full px-8">
      <Shimmer className="w-20 h-20 rounded-2xl" />
      <Shimmer className="w-48 h-4 rounded" />
      <Shimmer className="w-full max-w-sm h-10 rounded-full" />
    </div>
  );
}

function SpreadsheetSkeleton() {
  return (
    <div className="flex flex-col h-full">
      {/* toolbar */}
      <div className="flex items-center gap-2 px-4 py-2 border-b border-gray-100 dark:border-white/6 shrink-0">
        {[40, 60, 40, 50, 40].map((w, i) => (
          <Shimmer key={i} className="h-6 rounded" style={{ width: `${w}px` }} />
        ))}
      </div>
      {/* column headers */}
      <div className="flex gap-px px-4 py-1.5 border-b border-gray-100 dark:border-white/6 bg-gray-50 dark:bg-white/3">
        {[30, 80, 100, 90, 120, 80, 100].map((w, i) => (
          <Shimmer key={i} className="h-4 rounded" style={{ width: `${w}px` }} />
        ))}
      </div>
      {/* rows */}
      <div className="flex-1 flex flex-col divide-y divide-gray-100 dark:divide-white/4 overflow-hidden">
        {Array.from({ length: 10 }).map((_, r) => (
          <div key={r} className="flex gap-px px-4 py-2 items-center">
            {[30, 80, 100, 90, 120, 80, 100].map((w, i) => (
              <Shimmer key={i} className="h-3 rounded" style={{ width: `${w * (r % 3 === 0 ? 1 : r % 3 === 1 ? 0.7 : 0.9)}px` }} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function DocxSkeleton() {
  return (
    <div className="w-full h-full overflow-hidden bg-gray-100 dark:bg-[#0a0a0a] flex justify-center py-6 px-4">
      <div className="w-full max-w-3xl bg-white dark:bg-[#1a1a1a] rounded-lg p-10 flex flex-col gap-3 shadow-sm">
        <Shimmer className="w-2/3 h-6 rounded mb-4" />
        {[100, 90, 100, 75, 100, 85, 60, 100, 95, 80, 100, 70, 100, 88].map((w, i) => (
          <Shimmer key={i} className="h-3 rounded" style={{ width: `${w}%` }} />
        ))}
        <div className="my-2" />
        {[100, 92, 78, 100, 85, 100, 65].map((w, i) => (
          <Shimmer key={i} className="h-3 rounded" style={{ width: `${w}%` }} />
        ))}
      </div>
    </div>
  );
}

// ── Dynamic viewers (no SSR) ────────────────────────────────────────────────
const PdfViewer = dynamic(() => import("./PdfViewerInner"), {
  ssr: false,
  loading: () => <PdfSkeleton />,
});

const XlsxViewer = dynamic(() => import("./XlsxViewerInner"), {
  ssr: false,
  loading: () => <SpreadsheetSkeleton />,
});

const DocxViewer = dynamic(() => import("./DocxViewerInner"), {
  ssr: false,
  loading: () => <DocxSkeleton />,
});

// ── Types ───────────────────────────────────────────────────────────────────
type PreviewModalProps = {
  isOpen: boolean;
  previewUrl: string | null;
  file: FileData | null;
  onClose: () => void;
};

type PreviewKind = "image" | "pdf" | "xlsx" | "docx" | "video" | "audio" | "text" | "unsupported";

function detectKind(file: FileData): PreviewKind {
  const mime = file.mimeType.toLowerCase();
  const ext = file.originalName.split(".").pop()?.toLowerCase() ?? "";

  if (
    mime.startsWith("image/") ||
    ["png", "jpg", "jpeg", "gif", "webp", "svg", "bmp", "heic", "heif"].includes(ext)
  )
    return "image";
  if (mime === "application/pdf" || ext === "pdf") return "pdf";
  if (["xlsx", "xls", "csv"].includes(ext) || mime.includes("spreadsheet") || mime.includes("excel"))
    return "xlsx";
  if (["docx", "doc"].includes(ext) || mime.includes("wordprocessingml") || mime.includes("msword"))
    return "docx";
  if (mime.startsWith("video/") || ["mp4", "mov", "webm", "mkv", "avi"].includes(ext))
    return "video";
  if (mime.startsWith("audio/") || ["mp3", "wav", "ogg", "flac", "m4a"].includes(ext))
    return "audio";
  if (
    mime.startsWith("text/") ||
    ["txt", "md", "json", "xml", "yaml", "yml", "log", "sh", "ts", "tsx", "js", "jsx", "css", "html"].includes(ext)
  )
    return "text";
  return "unsupported";
}

// ── Image viewer with HEIC conversion ──────────────────────────────────────
function ImageViewer({ url, fileName }: { url: string; fileName: string }) {
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
          const converted = await heic2any({ blob, toType: "image/png", quality: 0.92 });
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

  if (loading) return <ImageSkeleton />;
  if (error || !src) return <UnsupportedViewer />;

  return (
    <div className="flex items-center justify-center w-full h-full bg-gray-50 dark:bg-[#0a0a0a]">
      {/* eslint-disable-next-line @next/next-eslint/no-img-element */}
      <img src={src} alt={fileName} className="max-w-full max-h-full object-contain" />
    </div>
  );
}

// ── Video viewer ────────────────────────────────────────────────────────────
function VideoViewer({ url }: { url: string }) {
  const [loading, setLoading] = useState(true);

  return (
    <div className="flex items-center justify-center w-full h-full bg-black relative">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black z-10">
          <div className="flex flex-col items-center gap-3">
            <Shimmer className="w-16 h-16 rounded-full" />
            <Shimmer className="w-48 h-3 rounded" />
            <Shimmer className="w-full max-w-xs h-2 rounded-full mt-2" />
          </div>
        </div>
      )}
      <video
        src={url}
        controls
        autoPlay={false}
        className="max-w-full max-h-full outline-none"
        onLoadedMetadata={() => setLoading(false)}
        onError={() => setLoading(false)}
      />
    </div>
  );
}

// ── Audio viewer ────────────────────────────────────────────────────────────
function AudioViewer({ url, fileName }: { url: string; fileName: string }) {
  const [loading, setLoading] = useState(true);

  return (
    <div className="flex flex-col items-center justify-center gap-6 w-full h-full px-8">
      {loading ? (
        <AudioSkeleton />
      ) : (
        <>
          <div className="w-20 h-20 rounded-2xl bg-gray-100 dark:bg-white/6 flex items-center justify-center">
            <svg viewBox="0 0 24 24" className="w-10 h-10 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 9l10.5-3m0 6.553v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 11-.99-3.467l2.31-.66a2.25 2.25 0 001.632-2.16zm0 0V2.25L9 5.25v10.303m0 0v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 01-.99-3.467l2.31-.66A2.25 2.25 0 009 15.553z" />
            </svg>
          </div>
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 text-center truncate max-w-xs">
            {fileName}
          </p>
        </>
      )}
      <audio
        src={url}
        controls
        className={`w-full max-w-sm ${loading ? "invisible absolute" : ""}`}
        onLoadedMetadata={() => setLoading(false)}
        onError={() => setLoading(false)}
      />
    </div>
  );
}

// ── Plain-text viewer ───────────────────────────────────────────────────────
function TextViewer({ url }: { url: string }) {
  const [content, setContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(url)
      .then((r) => r.text())
      .then((t) => setContent(t))
      .catch(() => setContent(null))
      .finally(() => setLoading(false));
  }, [url]);

  if (loading) return <TextSkeleton />;
  if (content === null) return <UnsupportedViewer />;

  return (
    <div className="w-full h-full overflow-auto bg-white dark:bg-[#0d0d0d] p-6">
      <pre className="text-xs text-gray-800 dark:text-gray-200 font-mono whitespace-pre-wrap break-words">
        {content}
      </pre>
    </div>
  );
}

// ── Unsupported fallback ────────────────────────────────────────────────────
function UnsupportedViewer() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 w-full h-full text-center px-8">
      <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center">
        <AlertCircle className="w-6 h-6 text-amber-500" />
      </div>
      <div>
        <p className="text-sm font-semibold text-gray-800 dark:text-white mb-1">
          Preview not available
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          This file type cannot be previewed in the browser.
          <br />
          Download the file to open it locally.
        </p>
      </div>
    </div>
  );
}

// ── Header skeleton (while waiting for URL) ─────────────────────────────────
function HeaderSkeleton() {
  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-white/6 shrink-0">
      <div className="flex items-center gap-2 min-w-0">
        <Shimmer className="w-8 h-3.5 rounded shrink-0" />
        <Shimmer className="w-48 h-4 rounded" />
      </div>
      <div className="flex items-center gap-2 shrink-0 ml-3">
        <Shimmer className="w-7 h-7 rounded-lg" />
        <Shimmer className="w-7 h-7 rounded-lg" />
      </div>
    </div>
  );
}

// ── Modal body skeleton (generic, shown before file info is available) ───────
function BodySkeleton() {
  return (
    <div className="flex-1 flex flex-col gap-4 p-6 bg-gray-50 dark:bg-[#0a0a0a]">
      <Shimmer className="w-full h-full rounded-lg" />
    </div>
  );
}

// ── Modal shell ─────────────────────────────────────────────────────────────
export function PreviewModal({ isOpen, previewUrl, file, onClose }: PreviewModalProps) {
  const kind = file ? detectKind(file) : null;
  const ready = !!(previewUrl && file);

  return (
    <Modal>
      <Modal.Backdrop
        variant="blur"
        isOpen={isOpen}
        onOpenChange={(open) => !open && onClose()}
      >
        <Modal.Container placement="center">
          <Modal.Dialog className="bg-white dark:bg-[#111111] border border-gray-200 dark:border-white/8 overflow-hidden w-[92vw] md:w-[78vw] xl:w-[66vw] h-[82vh] max-w-none rounded-xl shadow-2xl flex flex-col p-0">

            {/* Header — skeleton until file info arrives */}
            {ready ? (
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-white/6 shrink-0">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 shrink-0">
                    {file.originalName.split(".").pop()?.toUpperCase()}
                  </span>
                  <span className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                    {file.originalName}
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-3">
                  <a
                    href={previewUrl}
                    download={file.originalName}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/8 transition-colors"
                    aria-label="Download"
                  >
                    <Download className="w-4 h-4" />
                  </a>
                  <Modal.CloseTrigger className="relative top-auto right-auto text-gray-400 hover:text-gray-700 dark:hover:text-white bg-transparent border-0 p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/8" />
                </div>
              </div>
            ) : (
              <HeaderSkeleton />
            )}

            {/* Viewer body */}
            <Modal.Body className="flex-1 overflow-hidden p-0 relative">
              {!ready && <BodySkeleton />}
              {ready && kind === "image" && <ImageViewer url={previewUrl} fileName={file.originalName} />}
              {ready && kind === "pdf" && <PdfViewer url={previewUrl} />}
              {ready && kind === "xlsx" && <XlsxViewer url={previewUrl} />}
              {ready && kind === "docx" && <DocxViewer url={previewUrl} />}
              {ready && kind === "video" && <VideoViewer url={previewUrl} />}
              {ready && kind === "audio" && <AudioViewer url={previewUrl} fileName={file.originalName} />}
              {ready && kind === "text" && <TextViewer url={previewUrl} />}
              {ready && kind === "unsupported" && <UnsupportedViewer />}
            </Modal.Body>

          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
