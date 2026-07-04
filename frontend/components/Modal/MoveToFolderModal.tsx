"use client";

import { useState, useEffect } from "react";
import { Modal, Button } from "@heroui/react";
import { Folder, Home, LoaderCircle } from "lucide-react";
import { FileData, FolderData } from "../../types";

type Props = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  file: FileData | null;
  onMove: (fileId: string, folderId: string | null) => Promise<void>;
};

export function MoveToFolderModal({ isOpen, onOpenChange, file, onMove }: Props) {
  const [folders, setFolders] = useState<FolderData[]>([]);
  const [loading, setLoading] = useState(false);
  const [moving, setMoving] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setSelected(file?.folderId ?? null);
    setLoading(true);
    fetch("/api/folders?parentId=root")
      .then((r) => r.json())
      .then((data) => setFolders(Array.isArray(data) ? data : []))
      .catch(() => setFolders([]))
      .finally(() => setLoading(false));
  }, [isOpen, file]);

  const handleMove = async () => {
    if (!file) return;
    setMoving(true);
    try {
      await onMove(file.id, selected);
      onOpenChange(false);
    } finally {
      setMoving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
      <Modal.Backdrop>
        <Modal.Container>
          <Modal.Dialog className="border border-gray-200 dark:border-[#222222] bg-[#F5FEFD] dark:bg-[#050505] rounded-lg w-full max-w-sm">
            <Modal.CloseTrigger className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white" />
            <Modal.Header>
              <Modal.Heading className="text-gray-900 dark:text-white text-lg font-semibold">
                Move to Folder
              </Modal.Heading>
              {file && <p className="text-sm text-gray-500 mt-1 truncate">{file.originalName}</p>}
            </Modal.Header>
            <Modal.Body>
              {loading ? (
                <div className="flex justify-center py-6">
                  <LoaderCircle className="w-5 h-5 animate-spin text-gray-400" />
                </div>
              ) : (
                <div className="space-y-1 max-h-60 overflow-y-auto">
                  {/* Root option */}
                  <button
                    onClick={() => setSelected(null)}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                      selected === null
                        ? "bg-gray-900 dark:bg-white text-white dark:text-black"
                        : "hover:bg-gray-100 dark:hover:bg-[#1a1a1a] text-gray-700 dark:text-gray-300"
                    }`}
                  >
                    <Home className="w-4 h-4 shrink-0" />
                    <span>Root (no folder)</span>
                  </button>
                  {folders.map((f) => (
                    <button
                      key={f.id}
                      onClick={() => setSelected(f.id)}
                      className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                        selected === f.id
                          ? "bg-gray-900 dark:bg-white text-white dark:text-black"
                          : "hover:bg-gray-100 dark:hover:bg-[#1a1a1a] text-gray-700 dark:text-gray-300"
                      }`}
                    >
                      <Folder className="w-4 h-4 shrink-0 text-yellow-500 dark:text-yellow-400" />
                      <span className="truncate">{f.name}</span>
                    </button>
                  ))}
                  {folders.length === 0 && (
                    <p className="text-sm text-gray-400 text-center py-4">No folders yet</p>
                  )}
                </div>
              )}
            </Modal.Body>
            <Modal.Footer>
              <Button
                slot="close"
                className="text-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-[#151515] border border-gray-200 dark:border-[#222222] bg-[#F5FEFD] dark:bg-[#111111] rounded-lg"
              >
                Cancel
              </Button>
              <Button
                onPress={handleMove}
                isPending={moving}
                isDisabled={selected === (file?.folderId ?? null)}
                className="bg-gray-900 dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-white/90 disabled:opacity-50 rounded-lg"
              >
                {moving ? <LoaderCircle className="animate-spin-fast" /> : "Move"}
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
