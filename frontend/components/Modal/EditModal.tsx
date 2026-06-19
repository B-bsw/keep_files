import { useState, useEffect } from "react";
import { Modal, Button, Input, Label, TextField } from "@heroui/react";
import { FileData } from "../../types";
import { LoaderCircle } from "lucide-react";

type EditModalProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  file: FileData | null;
  onSave: (fileId: string, newName: string, newUploader: string) => void;
};

export function EditModal({
  isOpen,
  onOpenChange,
  file,
  onSave,
}: EditModalProps) {
  const [name, setName] = useState("");
  const [uploader, setUploader] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (file && isOpen) {
      setName(file.originalName);
      setUploader(file.uploaderName || "");
    }
  }, [file, isOpen]);

  const handleSave = async () => {
    if (!file) return;
    setIsSubmitting(true);
    try {
      await onSave(file.id, name, uploader || "anonymous");
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
      <Modal.Backdrop>
        <Modal.Container>
          <Modal.Dialog className="border border-gray-200 dark:border-[#222222] bg-[#F5FEFD] dark:bg-[#050505] rounded-lg w-full max-w-md">
            <Modal.CloseTrigger className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white" />
            <Modal.Header>
              <Modal.Heading className="text-gray-900 dark:text-white text-lg font-semibold">
                Edit File Info
              </Modal.Heading>
            </Modal.Header>
            <Modal.Body className="space-y-4">
              <TextField>
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-400">
                  File Name
                </Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[#F5FEFD] dark:bg-[#111111] border border-gray-200 dark:border-[#222222] focus:border-gray-400 dark:focus:border-white rounded-lg p-3 text-gray-900 dark:text-white"
                />
              </TextField>
              <TextField>
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-400">
                  Sender Name
                </Label>
                <Input
                  value={uploader}
                  onChange={(e) => setUploader(e.target.value)}
                  placeholder="anonymous"
                  className="w-full bg-[#F5FEFD] dark:bg-[#111111] border border-gray-200 dark:border-[#222222] focus:border-gray-400 dark:focus:border-white rounded-lg p-3 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-600"
                />
              </TextField>
            </Modal.Body>
            <Modal.Footer>
              <Button
                slot="close"
                className="text-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-[#151515] hover:border-gray-300 dark:hover:border-[#333333] border border-gray-200 dark:border-[#222222] bg-[#F5FEFD] dark:bg-[#111111] rounded-lg"
              >
                Cancel
              </Button>
              <Button
                onPress={handleSave}
                isPending={isSubmitting}
                className="bg-gray-900 dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-white/90 rounded-lg"
              >
                {isSubmitting ? (
                  <LoaderCircle className="animate-spin-fast" />
                ) : (
                  "Save Changes"
                )}
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
