import { Folder, MoreVertical, Pencil, Trash2 } from "lucide-react";
import { Chip, Dropdown } from "@heroui/react";
import { FolderData } from "../../types";

type FolderCardProps = {
  folder: FolderData;
  viewMode: "grid" | "list";
  onOpen: (id: string) => void;
  onRename: (folder: FolderData) => void;
  onDelete: (id: string) => void;
};

function ActionMenu({
  folder,
  onRename,
  onDelete,
  className = "",
}: {
  folder: FolderData;
  onRename: (f: FolderData) => void;
  onDelete: (id: string) => void;
  className?: string;
}) {
  return (
    <div className={className} onClick={(e) => e.stopPropagation()}>
      <Dropdown>
        <Dropdown.Trigger
          className="text-gray-400 hover:text-gray-900 dark:hover:text-white border-0 w-8 h-8 min-w-8 rounded-lg flex items-center justify-center hover:bg-gray-100 dark:hover:bg-[#1a1a1a] transition-colors cursor-pointer outline-none"
          aria-label="Folder actions"
        >
          <MoreVertical className="w-4 h-4" />
        </Dropdown.Trigger>
        <Dropdown.Popover
          placement="bottom end"
          className="bg-[#F5FEFD] dark:bg-[#111111] border border-gray-200 dark:border-[#222222] min-w-[140px] p-1 rounded-lg shadow-xl outline-none"
        >
          <Dropdown.Menu
            aria-label="Folder Actions"
            className="outline-none flex flex-col gap-0.5"
          >
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
  );
}

export function FolderCard({
  folder,
  viewMode,
  onOpen,
  onRename,
  onDelete,
}: FolderCardProps) {
  if (viewMode === "list") {
    return (
      <div
        onClick={() => onOpen(folder.id)}
        className="group flex items-center gap-3 md:gap-4 px-3 py-2.5 md:px-4 md:py-3 rounded-lg border cursor-pointer transition-colors w-full select-none overflow-hidden border-gray-200 bg-[#F5FEFD] hover:bg-[#F5FEFD] hover:border-gray-300 dark:border-[#222222] dark:bg-[#111111] dark:hover:bg-[#151515] dark:hover:border-[#333333]"
      >
        <div className="flex-1 min-w-0 flex flex-col md:flex-row md:items-center justify-between gap-1 md:gap-4">
          <div className="flex-1 min-w-0 flex items-center gap-2">
            <h4
              className="font-medium text-sm text-gray-900 dark:text-gray-200 truncate"
              title={folder.name}
            >
              {folder.name}
            </h4>
            <Chip color="accent">
              <Folder className="w-3 h-3 shrink-0" />
              <Chip.Label>Folder</Chip.Label>
            </Chip>
            {/*<Folder className="w-4 h-4 text-yellow-500 dark:text-yellow-400 shrink-0" />*/}
          </div>
          <div className="hidden md:flex shrink-0 w-100 items-center gap-4 text-xs text-gray-500">
            <span className="w-16 font-medium text-gray-700 dark:text-gray-400">
              Folder
            </span>
            <span className="flex-1" />
            <span className="w-20" />
            <span className="w-32 font-mono text-right text-nowrap">
              {new Date(folder.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>
        <div
          onClick={(e) => e.stopPropagation()}
          className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0 pl-1"
        >
          <ActionMenu folder={folder} onRename={onRename} onDelete={onDelete} />
        </div>
      </div>
    );
  }

  // grid — mirrors FileCard exactly
  return (
    <div
      onClick={() => onOpen(folder.id)}
      className="group flex flex-col rounded-lg border cursor-pointer transition-colors relative overflow-hidden select-none border-gray-200 bg-[#F5FEFD] hover:bg-[#F5FEFD] hover:border-gray-300 dark:border-[#222222] dark:bg-[#111111] dark:hover:bg-[#151515] dark:hover:border-[#333333]"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="absolute top-2 right-2 z-10 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity"
      >
        <ActionMenu
          folder={folder}
          onRename={onRename}
          onDelete={onDelete}
          className="bg-[#F5FEFD]/90 dark:bg-[#111111]/80 backdrop-blur-sm rounded-md border border-gray-200 dark:border-[#222222]"
        />
      </div>

      <div className="p-4 pt-4 flex flex-col flex-1">
        <div className="flex gap-2 items-center">
          <h4
            className="font-medium text-sm text-gray-900 dark:text-gray-200 truncate"
            title={folder.name}
          >
            {folder.name}
          </h4>

          <Chip color="accent">
            <Folder className="w-3 h-3 shrink-0" />
            <Chip.Label>Folder</Chip.Label>
          </Chip>
        </div>

        <p className="text-xs text-gray-500 dark:text-gray-500 truncate mb-4">
          {folder.createdBy || "anonymous"}
        </p>

        <div className="flex justify-between items-center w-full font-mono text-[10px] text-gray-600 dark:text-gray-500">
          <span>—</span>
          <span>{new Date(folder.createdAt).toLocaleDateString()}</span>
        </div>
      </div>
    </div>
  );
}
