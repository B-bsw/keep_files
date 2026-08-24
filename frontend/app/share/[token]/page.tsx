"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Download, File as FileIcon, Loader2, AlertCircle } from "lucide-react";
import { formatBytes, triggerDownload } from "../../../utils";

type ShareInfo = {
  type: "file";
  permission: "VIEW" | "DOWNLOAD";
  file: {
    id: string;
    originalName: string;
    size: number;
    mimeType: string;
    uploadDate: string;
    uploaderName: string | null;
  };
};

export default function SharePage() {
  const { token } = useParams<{ token: string }>();
  const [info, setInfo] = useState<ShareInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    fetch(`/api/share/${token}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) setError(data.error);
        else setInfo(data);
      })
      .catch(() => setError("Failed to load share link"))
      .finally(() => setLoading(false));
  }, [token]);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const res = await fetch(`/api/share/${token}`, { method: "POST" });
      if (!res.ok) throw new Error();
      const { url } = await res.json();
      triggerDownload(url, info?.file.originalName);
    } catch {
      setError("Failed to get download link");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5FEFD] dark:bg-[#050505] flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {loading ? (
          <div className="flex justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
          </div>
        ) : error ? (
          <div className="text-center space-y-3">
            <AlertCircle className="w-12 h-12 text-red-400 mx-auto" />
            <p className="text-gray-600 dark:text-gray-400">{error}</p>
          </div>
        ) : info ? (
          <div className="border border-gray-200 dark:border-[#222] rounded-2xl bg-white dark:bg-[#111] p-6 space-y-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-[#1a1a1a] flex items-center justify-center shrink-0">
                <FileIcon className="w-6 h-6 text-gray-500 dark:text-gray-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 dark:text-white truncate" title={info.file.originalName}>
                  {info.file.originalName}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                  {formatBytes(info.file.size)}
                  {info.file.uploaderName && ` • ${info.file.uploaderName}`}
                </p>
              </div>
            </div>

            <div className="border-t border-gray-100 dark:border-[#222] pt-4">
              <p className="text-xs text-gray-400 dark:text-gray-500 mb-3">
                {info.permission === "VIEW"
                  ? "This link allows viewing only."
                  : "This link allows downloading."}
              </p>
              {info.permission === "DOWNLOAD" && (
                <button
                  onClick={handleDownload}
                  disabled={downloading}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-gray-900 dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-white/90 transition-colors disabled:opacity-60 text-sm font-medium"
                >
                  {downloading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      Download
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
