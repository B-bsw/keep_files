import { Dropdown } from "@heroui/react";
import { MoreVertical, Eye, Pencil, Download, Trash2 } from "lucide-react";
import { FileData } from "../../types";

type FileActionMenuProps = {
  file: FileData;
  onActionRequest: (type: "download" | "preview" | "edit", file: FileData) => void;
  onDelete: (id: string) => void;
  className?: string;
};

export function FileActionMenu({ file, onActionRequest, onDelete, className = "" }: FileActionMenuProps) {
  const isImage = file.mimeType.startsWith("image/");

  return (
    <div className={className} onClick={(e) => e.stopPropagation()}>
      <Dropdown>
        <Dropdown.Trigger
          className="text-gray-400 hover:text-white border-0 w-8 h-8 min-w-8 rounded-lg flex items-center justify-center hover:bg-[#1a1a1a] transition-colors cursor-pointer outline-none"
          aria-label="File actions"
        >
          <MoreVertical className="w-4 h-4" />
        </Dropdown.Trigger>
        <Dropdown.Popover placement="bottom end" className="bg-[#111111] border border-[#222222] min-w-[150px] p-1 rounded-lg shadow-xl outline-none">
          <Dropdown.Menu aria-label="File Actions" className="outline-none flex flex-col gap-0.5">
            {isImage ? (
              <Dropdown.Item
                onAction={() => onActionRequest("preview", file)}
                className="flex items-center gap-2 px-2 py-1.5 hover:bg-[#1a1a1a] rounded-md cursor-pointer text-sm text-gray-200 outline-none"
              >
                <Eye className="w-4 h-4 text-gray-400" />
                <span>Preview</span>
              </Dropdown.Item>
            ) : [] as any}
            
            <Dropdown.Item
              onAction={() => onActionRequest("edit", file)}
              className="flex items-center gap-2 px-2 py-1.5 hover:bg-[#1a1a1a] rounded-md cursor-pointer text-sm text-gray-200 outline-none"
            >
              <Pencil className="w-4 h-4 text-gray-400" />
              <span>Edit</span>
            </Dropdown.Item>
            
            <Dropdown.Item
              onAction={() => onActionRequest("download", file)}
              className="flex items-center gap-2 px-2 py-1.5 hover:bg-[#1a1a1a] rounded-md cursor-pointer text-sm text-gray-200 outline-none"
            >
              <Download className="w-4 h-4 text-gray-400" />
              <span>Download</span>
            </Dropdown.Item>
            
            <Dropdown.Item
              onAction={() => onDelete(file.id)}
              className="flex items-center gap-2 px-2 py-1.5 hover:bg-red-500/10 rounded-md cursor-pointer text-sm text-red-400 outline-none"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete</span>
            </Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown.Popover>
      </Dropdown>
    </div>
  );
}
