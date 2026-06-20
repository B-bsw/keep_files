"use client";

import { useState, useCallback } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Loader2 } from "lucide-react";

import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url,
).toString();

function UnsupportedPlaceholder() {
  return (
    <div className="flex items-center justify-center h-40 text-sm text-gray-400">
      Failed to load PDF
    </div>
  );
}

export default function PdfViewerInner({ url }: { url: string }) {
  const [numPages, setNumPages] = useState<number>(0);
  const [page, setPage] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [containerWidth, setContainerWidth] = useState(700);

  const containerRef = useCallback((node: HTMLDivElement | null) => {
    if (node) setContainerWidth(node.clientWidth - 32);
  }, []);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100 dark:border-white/6 shrink-0 gap-3 flex-wrap">
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="p-1 rounded hover:bg-gray-100 dark:hover:bg-white/8 disabled:opacity-30 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="tabular-nums">
            {page} / {numPages || "–"}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(numPages, p + 1))}
            disabled={page >= numPages}
            className="p-1 rounded hover:bg-gray-100 dark:hover:bg-white/8 disabled:opacity-30 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setScale((s) => Math.max(0.4, +(s - 0.2).toFixed(1)))}
            className="p-1 rounded hover:bg-gray-100 dark:hover:bg-white/8 transition-colors"
          >
            <ZoomOut className="w-4 h-4 text-gray-500 dark:text-gray-400" />
          </button>
          <span className="text-xs text-gray-500 dark:text-gray-400 tabular-nums w-10 text-center">
            {Math.round(scale * 100)}%
          </span>
          <button
            onClick={() => setScale((s) => Math.min(3, +(s + 0.2).toFixed(1)))}
            className="p-1 rounded hover:bg-gray-100 dark:hover:bg-white/8 transition-colors"
          >
            <ZoomIn className="w-4 h-4 text-gray-500 dark:text-gray-400" />
          </button>
        </div>
      </div>

      <div
        ref={containerRef}
        className="flex-1 overflow-auto flex justify-center bg-gray-100 dark:bg-[#0a0a0a] p-4"
      >
        <Document
          file={url}
          onLoadSuccess={({ numPages }) => { setNumPages(numPages); setPage(1); }}
          loading={
            <div className="flex items-center justify-center h-40">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          }
          error={<UnsupportedPlaceholder />}
        >
          <Page
            pageNumber={page}
            scale={scale}
            width={containerWidth}
            renderAnnotationLayer
            renderTextLayer
          />
        </Document>
      </div>
    </div>
  );
}
