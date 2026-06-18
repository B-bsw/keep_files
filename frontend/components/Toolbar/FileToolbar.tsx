import {
  Square,
  Trash2,
  ChevronDown,
  LayoutGrid,
  List,
  SquareCheck,
  ArrowUpDown,
  Clock,
  HardDrive,
  Type,
  ArrowDown,
  ArrowUp,
  Check,
} from "lucide-react";
import { Button, Dropdown, ButtonGroup, Label } from "@heroui/react";
import { SortOption } from "../../types";

const SORT_LABELS: Record<SortOption, string> = {
  "date-desc": "Date",
  "date-asc": "Date",
  "size-desc": "Size",
  "size-asc": "Size",
  "name-desc": "Name",
  "name-asc": "Name",
};

type FileToolbarProps = {
  filesCount: number;
  selectedCount: number;
  isAllSelected: boolean;
  onToggleSelectAll: () => void;
  onBulkDelete: () => void;
  viewMode: "grid" | "list";
  setViewMode: (mode: "grid" | "list") => void;
  sortOption: SortOption;
  setSortOption: (opt: SortOption) => void;
};

export function FileToolbar({
  filesCount,
  selectedCount,
  isAllSelected,
  onToggleSelectAll,
  onBulkDelete,
  viewMode,
  setViewMode,
  sortOption,
  setSortOption,
}: FileToolbarProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
      <div className="flex flex-wrap items-center gap-4">
        <h2 className="text-xl sm:text-2xl font-semibold flex items-center gap-3">
          Your Files
          <span className="text-sm font-normal text-gray-600 dark:text-gray-500 bg-gray-100 dark:bg-[#111111] border border-gray-200 dark:border-[#222222] px-3 py-1 rounded-lg">
            {filesCount}
          </span>
        </h2>

        {filesCount > 0 && (
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 border-[#222222] w-full sm:w-auto">
            <Button
              onPress={onToggleSelectAll}
              variant="ghost"
              className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white rounded-lg h-10 px-3"
            >
              {isAllSelected ? (
                <SquareCheck className="w-5 h-5 text-blue-600 dark:text-white" />
              ) : (
                <Square className="w-5 h-5" />
              )}
              Select All
            </Button>

            {selectedCount > 0 && (
              <Button
                onPress={onBulkDelete}
                className="dark:bg-red-700 text-white dark:hover:bg-red-700/80 rounded-lg h-10 px-4 bg-red-600 hover:bg-red-600/80 "
              >
                <Trash2 className="w-4 h-4" />
                Delete ({selectedCount})
              </Button>
            )}
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3 w-full md:w-auto mt-2 md:mt-0">
        <div className={viewMode === "list" ? "block md:hidden" : "block"}>
          <Dropdown>
            <Button className="bg-[#F5FEFD] dark:bg-[#111111] border border-gray-200 dark:border-[#222222] text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-[#F5FEFD] dark:hover:bg-[#151515] rounded-lg h-10 px-4 flex items-center gap-2">
              <ArrowUpDown className="w-4 h-4 opacity-70" />
              <span>{SORT_LABELS[sortOption]}</span>
              <ChevronDown className="w-4 h-4 opacity-50" />
            </Button>
            <Dropdown.Popover>
              <Dropdown.Menu
                aria-label="Sort options"
                selectedKeys={new Set([sortOption])}
                selectionMode="single"
                disallowEmptySelection
                onSelectionChange={(keys) =>
                  setSortOption(Array.from(keys)[0] as SortOption)
                }
              >
                {(Object.entries(SORT_LABELS) as [SortOption, string][]).map(
                  ([val, label]) => {
                    const Icon = val.startsWith("date")
                      ? Clock
                      : val.startsWith("size")
                        ? HardDrive
                        : Type;
                    const DirIcon = val.endsWith("desc") ? ArrowDown : ArrowUp;
                    return (
                      <Dropdown.Item key={val} id={val} textValue={label}>
                        <div className="flex items-center justify-between w-full">
                          <div className="flex items-center gap-2">
                            <div className="w-4 flex justify-center">
                              {sortOption === val && (
                                <Check className="w-4 h-4 text-gray-900 dark:text-white" />
                              )}
                            </div>
                            <Icon
                              className={`w-4 h-4 ${sortOption === val ? "opacity-100 text-gray-900 dark:text-white" : "opacity-70 text-gray-500 dark:text-gray-400"}`}
                            />
                            <Label
                              className={
                                sortOption === val
                                  ? "text-gray-900 dark:text-white font-medium"
                                  : "text-gray-600 dark:text-gray-400"
                              }
                            >
                              {label}
                            </Label>
                          </div>
                          <DirIcon
                            className={`w-3 h-3 ${sortOption === val ? "opacity-100 text-gray-900 dark:text-white" : "opacity-50 text-gray-400 dark:text-gray-500"}`}
                          />
                        </div>
                      </Dropdown.Item>
                    );
                  },
                )}
              </Dropdown.Menu>
            </Dropdown.Popover>
          </Dropdown>
        </div>

        <ButtonGroup>
          <Button
            isIconOnly
            onPress={() => setViewMode("grid")}
            className={`border border-gray-200 dark:border-[#222222] h-10 w-10 ${
              viewMode === "grid"
                ? "bg-gray-100 dark:bg-[#222222] text-gray-900 dark:text-white"
                : "bg-[#F5FEFD] dark:bg-[#111111] text-gray-500 dark:text-gray-400 hover:bg-[#F5FEFD] dark:hover:bg-[#151515]"
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
          </Button>
          <Button
            isIconOnly
            onPress={() => setViewMode("list")}
            className={`border border-gray-200 dark:border-[#222222] border-l-0 h-10 w-10 ${
              viewMode === "list"
                ? "bg-gray-100 dark:bg-[#222222] text-gray-900 dark:text-white"
                : "bg-[#F5FEFD] dark:bg-[#111111] text-gray-500 dark:text-gray-400 hover:bg-[#F5FEFD] dark:hover:bg-[#151515]"
            }`}
          >
            <List className="w-4 h-4" />
          </Button>
        </ButtonGroup>
      </div>
    </div>
  );
}
