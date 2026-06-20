"use client";

import { useEffect, useState } from "react";
import { ReactDocxViewer } from "@extend-ai/react-docx";
import { Loader2 } from "lucide-react";

export default function DocxViewerInner({ url }: { url: string }) {
  const [buffer, setBuffer] = useState<ArrayBuffer | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch(url)
      .then((r) => r.arrayBuffer())
      .then(setBuffer)
      .catch(() => setError(true));
  }, [url]);

  if (error)
    return (
      <div className="flex items-center justify-center h-full text-sm text-gray-400">
        Failed to load document.
      </div>
    );

  if (!buffer)
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );

  return (
    <div className="absolute inset-0 overflow-y-auto bg-gray-100 dark:bg-[#0a0a0a]">
      <div className="flex justify-center py-6 px-4">
        <div className="w-full max-w-3xl bg-white dark:bg-[#1a1a1a] shadow-sm rounded-lg overflow-hidden">
          <ReactDocxViewer file={buffer} className="w-full" />
        </div>
      </div>
    </div>
  );
}
