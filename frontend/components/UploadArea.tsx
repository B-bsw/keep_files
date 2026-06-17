import { useRef } from "react";
import { motion } from "framer-motion";
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
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-12"
    >
      <div
        className={`relative group rounded-3xl border-2 border-dashed transition-all duration-300 ${
          dragActive
            ? "border-indigo-500 bg-indigo-500/10"
            : "border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20"
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
        <div className="py-20 px-10 text-center flex flex-col items-center justify-center">
          <div
            className={`w-20 h-20 rounded-full mb-6 flex items-center justify-center transition-transform duration-300 ${dragActive ? "scale-110 bg-indigo-500/20" : "bg-white/5 group-hover:scale-110"}`}
          >
            <CloudUpload
              className={`w-10 h-10 ${dragActive ? "text-indigo-400" : "text-gray-400"}`}
            />
          </div>
          <h3 className="text-2xl font-semibold mb-2">
            Drag & Drop your files here
          </h3>
          <p className="text-gray-500">
            or click to browse from your computer
          </p>
        </div>
      </div>
    </motion.div>
  );
}
