import { Folder, MoreVertical, Pencil, Trash2 } from "lucide-react";
import { Dropdown } from "@heroui/react";
import { FolderData } from "../../types";

type FolderCardProps = {
  folder: FolderData;
  viewMode: "grid" | "list";
  onOpen: (id: string) => void;
  onRename: (folder: FolderData) => void;
  onDelete: (id: string) => void;
};

export function FolderCard({ folder, viewMode, onOpen, onRename, onDelete }: FolderCardProps) {
  if (viewMode === "list") {
    return (
      <div
        onDoubleClick={() => onOpen(folder.id)}
        className="group flex items-center gap-3 md:gap-4 px-3 py-2.5 md:px-4 md:py-3 rounded-lg border cursor-pointer transition-colors w-full select-none border-gray-200 bg-[#F5FEFD] hover:bg-[#eefaf9] hover:border-gray-300 dark:border-[#222222] dark:bg-[#111111] dark:hover:bg-[#151515] dark:hover:border-[#333333]"
      >
        <Folder className="w-5 h-5 text-yellow-500 dark:text-yellow-400 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm text-gray-900 dark:text-gray-200 truncate">{folder.name}</p>
        </div>
        <div onClick={(e) => e.stopPropagation()} className="opacity-0 group-hover:opacity-100 transition-opacity">
          <Dropdown>
            <Dropdown.Trigger
              className="text-gray-400 hover:text-gray-900 dark:hover:text-white border-0 w-8 h-8 min-w-8 rounded-lg flex items-center justify-center hover:bg-gray-100 dark:hover:bg-[#1a1a1a] transition-colors cursor-pointer outline-none"
              aria-label="Folder actions"
            >
              <MoreVertical className="w-4 h-4" />
            </Dropdown.Trigger>
            <Dropdown.Popover placement="bottom end" className="bg-[#F5FEFD] dark:bg-[#111111] border border-gray-200 dark:border-[#222222] min-w-[140px] p-1 rounded-lg shadow-xl outline-none">
              <Dropdown.Menu aria-label="Folder Actions" className="outline-none flex flex-col gap-0.5">
                <Dropdown.Item
                  onAction={() => onRename(folder)}
                  className="flex items-center gap-2 px-2 py-1.5 hover:bg-gray-100 dark:hover:bg-[#1a1a1a] rounded-md cursor-pointer text-sm text-gray-700 dark:text-gray-200 outline-none"
                >
                  <Pencil className="w-4 h-4 text-gray-500" />
                  <span>Rename</span>
                </Dropdown.Item>
                <Dropdown.Item
                  onAction={() => onDelete(folder.id)}
                  className="flex items-center gap-2 px-2 py-1.5 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-md cursor-pointer text-sm text-red-600 dark:text-red-400 outline-none"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete</span>
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown.Popover>
          </Dropdown>
        </div>
      </div>
    );
  }

  return (
    <div
      onDoubleClick={() => onOpen(folder.id)}
      className="group flex flex-col rounded-lg border cursor-pointer transition-colors relative overflow-hidden select-none border-gray-200 bg-[#F5FEFD] hover:bg-[#eefaf9] hover:border-gray-300 dark:border-[#222222] dark:bg-[#111111] dark:hover:bg-[#151515] dark:hover:border-[#333333]"
    >
      <div onClick={(e) => e.stopPropagation()} className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
        <Dropdown>
          <Dropdown.Trigger
            className="text-gray-400 hover:text-gray-900 dark:hover:text-white border-0 w-8 h-8 min-w-8 rounded-lg flex items-center justify-center hover:bg-gray-100 dark:hover:bg-[#1a1a1a] transition-colors cursor-pointer outline-none bg-[#F5FEFD]/90 dark:bg-[#111111]/80 backdrop-blur-sm border border-gray-200 dark:border-[#222222]"
            aria-label="Folder actions"
          >
            <MoreVertical className="w-4 h-4" />
          </Dropdown.Trigger>
          <Dropdown.Popover placement="bottom end" className="bg-[#F5FEFD] dark:bg-[#111111] border border-gray-200 dark:border-[#222222] min-w-[140px] p-1 rounded-lg shadow-xl outline-none">
            <Dropdown.Menu aria-label="Folder Actions" className="outline-none flex flex-col gap-0.5">
              <Dropdown.Item
                onAction={() => onRename(folder)}
                className="flex items-center gap-2 px-2 py-1.5 hover:bg-gray-100 dark:hover:bg-[#1a1a1a] rounded-md cursor-pointer text-sm text-gray-700 dark:text-gray-200 outline-none"
              >
                <Pencil className="w-4 h-4 text-gray-500" />
                <span>Rename</span>
              </Dropdown.Item>
              <Dropdown.Item
                onAction={() => onDelete(folder.id)}
                className="flex items-center gap-2 px-2 py-1.5 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-md cursor-pointer text-sm text-red-600 dark:text-red-400 outline-none"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete</span>
              </Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown.Popover>
        </Dropdown>
      </div>
      <div className="p-4 flex flex-col items-start">
        <Folder className="w-8 h-8 text-yellow-500 dark:text-yellow-400 mb-2" />
        <p className="font-medium text-sm text-gray-900 dark:text-gray-200 truncate w-full" title={folder.name}>
          {folder.name}
        </p>
      </div>
    </div>
  );
}
