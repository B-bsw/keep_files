import { X } from "lucide-react";
import Image from "next/image";

type PreviewModalProps = {
  isOpen: boolean;
  previewUrl: string | null;
  onClose: () => void;
};

export function PreviewModal({
  isOpen,
  previewUrl,
  onClose,
}: PreviewModalProps) {
  if (!isOpen || !previewUrl) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/95"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-6 right-6 p-3 bg-[#111111] border border-[#222222] hover:bg-[#151515] hover:border-[#333333] rounded-lg text-white transition-colors z-50"
      >
        <X className="w-6 h-6" />
      </button>
      <div
        className="relative max-w-5xl max-h-[90vh] w-full h-full flex items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        <Image
          src={previewUrl}
          alt="Preview"
          fill
          className="max-w-full max-h-full object-contain rounded-lg"
        />
      </div>
    </div>
  );
}
