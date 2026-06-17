import { motion, AnimatePresence } from "framer-motion";
import {
  CheckSquare,
  Square,
  Trash2,
  ChevronDown,
  LayoutGrid,
  List,
} from "lucide-react";
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
  sortDropdownOpen: boolean;
  setSortDropdownOpen: (open: boolean) => void;
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
  sortDropdownOpen,
  setSortDropdownOpen,
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
            <button
              onClick={onToggleSelectAll}
              className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
            >
              {isAllSelected ? (
                <CheckSquare className="w-5 h-5 text-indigo-400" />
              ) : (
                <Square className="w-5 h-5" />
              )}
              Select All
            </button>

            {selectedCount > 0 && (
              <motion.button
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                onClick={onBulkDelete}
                className="flex items-center gap-2 text-sm text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 px-3 py-1.5 rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Delete ({selectedCount})
              </motion.button>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        {/* Sort Dropdown */}
        <div className="relative">
          <button
            onClick={() => setSortDropdownOpen(!sortDropdownOpen)}
            className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 text-sm rounded-xl px-4 py-2 transition-colors focus:outline-none"
          >
            {SORT_LABELS[sortOption]}
            <ChevronDown className="w-4 h-4 opacity-50" />
          </button>

          <AnimatePresence>
            {sortDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-30"
                  onClick={() => setSortDropdownOpen(false)}
                />
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 mt-2 w-48 bg-[#111] border border-white/10 rounded-xl shadow-2xl z-40 overflow-hidden"
                >
                  {(Object.entries(SORT_LABELS) as [SortOption, string][]).map(
                    ([val, label]) => (
                      <button
                        key={val}
                        onClick={() => {
                          setSortOption(val);
                          setSortDropdownOpen(false);
                        }}
                        className={`w-full text-left px-4 py-2.5 text-sm transition-colors hover:bg-white/10 ${sortOption === val ? "text-indigo-400 bg-indigo-500/10" : "text-gray-300"}`}
                      >
                        {label}
                      </button>
                    ),
                  )}
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        {/* View Toggle */}
        <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
          <button
            onClick={() => setViewMode("grid")}
            className={`p-2 rounded-lg transition-colors ${viewMode === "grid" ? "bg-white/10 text-white shadow-sm" : "text-gray-400 hover:text-white"}`}
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`p-2 rounded-lg transition-colors ${viewMode === "list" ? "bg-white/10 text-white shadow-sm" : "text-gray-400 hover:text-white"}`}
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
