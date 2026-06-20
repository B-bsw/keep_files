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
  return (
    <div className={className} onClick={(e) => e.stopPropagation()}>
      <Dropdown>
        <Dropdown.Trigger
          className="text-gray-400 hover:text-gray-900 dark:hover:text-white border-0 w-8 h-8 min-w-8 rounded-lg flex items-center justify-center hover:bg-gray-100 dark:hover:bg-[#1a1a1a] transition-colors cursor-pointer outline-none"
          aria-label="File actions"
        >
          <MoreVertical className="w-4 h-4" />
        </Dropdown.Trigger>
        <Dropdown.Popover placement="bottom end" className="bg-[#F5FEFD] dark:bg-[#111111] border border-gray-200 dark:border-[#222222] min-w-[150px] p-1 rounded-lg shadow-xl outline-none">
          <Dropdown.Menu aria-label="File Actions" className="outline-none flex flex-col gap-0.5">
            <Dropdown.Item
              onAction={() => onActionRequest("preview", file)}
              className="flex items-center gap-2 px-2 py-1.5 hover:bg-gray-100 dark:hover:bg-[#1a1a1a] rounded-md cursor-pointer text-sm text-gray-700 dark:text-gray-200 outline-none"
            >
              <Eye className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              <span>Preview</span>
            </Dropdown.Item>
            
            <Dropdown.Item
              onAction={() => onActionRequest("edit", file)}
              className="flex items-center gap-2 px-2 py-1.5 hover:bg-gray-100 dark:hover:bg-[#1a1a1a] rounded-md cursor-pointer text-sm text-gray-700 dark:text-gray-200 outline-none"
            >
              <Pencil className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              <span>Edit</span>
            </Dropdown.Item>
            
            <Dropdown.Item
              onAction={() => onActionRequest("download", file)}
              className="flex items-center gap-2 px-2 py-1.5 hover:bg-gray-100 dark:hover:bg-[#1a1a1a] rounded-md cursor-pointer text-sm text-gray-700 dark:text-gray-200 outline-none"
            >
              <Download className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              <span>Download</span>
            </Dropdown.Item>
            
            <Dropdown.Item
              onAction={() => onDelete(file.id)}
              className="flex items-center gap-2 px-2 py-1.5 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-md cursor-pointer text-sm text-red-600 dark:text-red-400 outline-none"
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
