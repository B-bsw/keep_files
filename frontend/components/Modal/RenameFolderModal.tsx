"use client";

import { useState, useEffect } from "react";
import { Modal, Button, Input, Label, TextField } from "@heroui/react";
import { FolderData } from "../../types";
import { LoaderCircle } from "lucide-react";

type Props = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  folder: FolderData | null;
  onSave: (id: string, name: string) => Promise<void>;
};

export function RenameFolderModal({ isOpen, onOpenChange, folder, onSave }: Props) {
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (folder && isOpen) setName(folder.name);
  }, [folder, isOpen]);

  const handleSave = async () => {
    if (!folder || !name.trim() || name === folder.name) return;
    setSaving(true);
    try {
      await onSave(folder.id, name.trim());
      onOpenChange(false);
    } finally {
      setSaving(false);
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
                Rename Folder
              </Modal.Heading>
            </Modal.Header>
            <Modal.Body>
              <TextField>
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-400">Folder Name</Label>
                <Input
                  autoFocus
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSave()}
                  className="w-full bg-[#F5FEFD] dark:bg-[#111111] border border-gray-200 dark:border-[#222222] focus:border-gray-400 dark:focus:border-white rounded-lg p-3 text-gray-900 dark:text-white"
                />
              </TextField>
            </Modal.Body>
            <Modal.Footer>
              <Button
                slot="close"
                className="text-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-[#151515] border border-gray-200 dark:border-[#222222] bg-[#F5FEFD] dark:bg-[#111111] rounded-lg"
              >
                Cancel
              </Button>
              <Button
                onPress={handleSave}
                isPending={saving}
                isDisabled={!name.trim() || name === folder?.name}
                className="bg-gray-900 dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-white/90 disabled:opacity-50 rounded-lg"
              >
                {saving ? <LoaderCircle className="animate-spin-fast" /> : "Save"}
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
