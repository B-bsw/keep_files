import { motion } from "framer-motion";
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
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-4">
        <h2 className="text-2xl font-semibold flex items-center gap-3">
          Your Files
          <span className="text-sm font-normal text-gray-500 bg-white/10 px-3 py-1 rounded-full">
            {filesCount}
          </span>
        </h2>

        {filesCount > 0 && (
          <div className="flex items-center gap-3 ml-4 pl-4 border-l border-white/10">
            <Button
              onPress={onToggleSelectAll}
              variant="ghost"
              className="text-gray-400 hover:text-white"
            >
              {isAllSelected ? (
                <SquareCheck className="w-5 h-5 text-indigo-400" />
              ) : (
                <Square className="w-5 h-5" />
              )}
              Select All
            </Button>

            {selectedCount > 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <Button onPress={onBulkDelete} variant="danger">
                  <Trash2 className="w-4 h-4" />
                  Delete ({selectedCount})
                </Button>
              </motion.div>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        <Dropdown>
          <Button
            variant="secondary"
            className="bg-white/5 border border-white/10 text-gray-300"
          >
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
                    <Label
                      className={sortOption === val ? "text-indigo-400" : ""}
                    >
                      {label}
                    </Label>
                  </Dropdown.Item>
                ),
              )}
            </Dropdown.Menu>
          </Dropdown.Popover>
        </Dropdown>

        <ButtonGroup variant="secondary">
          <Button
            isIconOnly
            onPress={() => setViewMode("grid")}
            className={
              viewMode === "grid" ? "bg-white/10 text-white" : "text-gray-400"
            }
          >
            <LayoutGrid className="w-4 h-4" />
          </Button>
          <Button
            isIconOnly
            onPress={() => setViewMode("list")}
            className={
              viewMode === "list" ? "bg-white/10 text-white" : "text-gray-400"
            }
          >
            <List className="w-4 h-4" />
          </Button>
        </ButtonGroup>
      </div>
    </div>
  );
}
