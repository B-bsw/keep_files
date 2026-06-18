import { useRef } from "react";
import { CloudUpload } from "lucide-react";

type UploadAreaProps = {
  dragActive: boolean;
  onDragEnter: (e: React.DragEvent) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
};

export function UploadArea({
  dragActive,
  onDragEnter,
  onDragLeave,
  onDragOver,
  onDrop,
  onChange,
}: UploadAreaProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="mb-12">
      <div
        className={`relative rounded-lg border transition-colors ${
          dragActive
            ? "border-white bg-[#1a1a1a]"
            : "border-[#222222] bg-[#111111] hover:bg-[#151515] hover:border-[#333333]"
        }`}
        onDragEnter={onDragEnter}
        onDragLeave={onDragLeave}
        onDragOver={onDragOver}
        onDrop={onDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
          onChange={handleChange}
        />
        <div className="py-12 sm:py-20 px-6 sm:px-10 text-center flex flex-col items-center justify-center">
          <div className="mb-4">
            <CloudUpload
              className={`w-8 h-8 ${dragActive ? "text-white" : "text-gray-400"}`}
            />
          </div>
          <h3 className="text-lg font-medium text-white mb-1">
            Upload files
          </h3>
          <p className="text-sm text-gray-500">
            Drag and drop or click to browse
          </p>
        </div>
      </div>
    </div>
  );
}
