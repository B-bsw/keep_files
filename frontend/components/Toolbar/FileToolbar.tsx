import {
  Square,
  Trash2,
  ChevronDown,
  LayoutGrid,
  List,
  SquareCheck,
} from "lucide-react";
import { Button, Dropdown, ButtonGroup, Label } from "@heroui/react";
import { SortOption } from "../../types";

const SORT_LABELS: Record<SortOption, string> = {
  "date-desc": "Newest First",
  "date-asc": "Oldest First",
  "size-desc": "Largest First",
  "size-asc": "Smallest First",
  "name-asc": "Name (A-Z)",
  "name-desc": "Name (Z-A)",
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
          <span className="text-sm font-normal text-gray-500 bg-[#111111] border border-[#222222] px-3 py-1 rounded-lg">
            {filesCount}
          </span>
        </h2>

        {filesCount > 0 && (
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 border-[#222222] w-full sm:w-auto">
            <Button
              onPress={onToggleSelectAll}
              variant="ghost"
              className="text-gray-400 hover:text-white rounded-lg h-10 px-3"
            >
              {isAllSelected ? (
                <SquareCheck className="w-5 h-5 text-white" />
              ) : (
                <Square className="w-5 h-5" />
              )}
              Select All
            </Button>

            {selectedCount > 0 && (
              <Button
                onPress={onBulkDelete}
                className="bg-red-600 text-white hover:bg-red-600/80 rounded-lg h-10 px-4 "
              >
                <Trash2 className="w-4 h-4" />
                Delete ({selectedCount})
              </Button>
            )}
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3 w-full md:w-auto mt-2 md:mt-0">
        <Dropdown>
          <Button className="bg-[#111111] border border-[#222222] text-gray-300 hover:text-white hover:bg-[#151515] rounded-lg h-10 px-4">
            {SORT_LABELS[sortOption]}
            <ChevronDown className="w-4 h-4 opacity-50" />
          </Button>
          <Dropdown.Popover>
            <Dropdown.Menu
              aria-label="Sort options"
              selectedKeys={new Set([sortOption])}
              selectionMode="single"
              onSelectionChange={(keys) =>
                setSortOption(Array.from(keys)[0] as SortOption)
              }
            >
              {(Object.entries(SORT_LABELS) as [SortOption, string][]).map(
                ([val, label]) => (
                  <Dropdown.Item key={val} id={val} textValue={label}>
                    <Label className={sortOption === val ? "text-white" : ""}>
                      {label}
                    </Label>
                  </Dropdown.Item>
                ),
              )}
            </Dropdown.Menu>
          </Dropdown.Popover>
        </Dropdown>

        <ButtonGroup>
          <Button
            isIconOnly
            onPress={() => setViewMode("grid")}
            className={`border border-[#222222] h-10 w-10 ${
              viewMode === "grid"
                ? "bg-[#222222] text-white"
                : "bg-[#111111] text-gray-400 hover:bg-[#151515]"
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
          </Button>
          <Button
            isIconOnly
            onPress={() => setViewMode("list")}
            className={`border border-[#222222] border-l-0 h-10 w-10 ${
              viewMode === "list"
                ? "bg-[#222222] text-white"
                : "bg-[#111111] text-gray-400 hover:bg-[#151515]"
            }`}
          >
            <List className="w-4 h-4" />
          </Button>
        </ButtonGroup>
      </div>
    </div>
  );
}
