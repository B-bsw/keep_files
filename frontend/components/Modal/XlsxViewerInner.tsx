"use client";

import { XlsxViewer } from "@extend-ai/react-xlsx";
import { useTheme } from "next-themes";

export default function XlsxViewerInner({ url }: { url: string }) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  return (
    <div className="w-full h-full overflow-hidden">
      <XlsxViewer
        src={url}
        isDark={isDark}
        className="w-full h-full"
      />
    </div>
  );
}
