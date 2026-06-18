import { useState, useEffect } from "react";
import { Modal, Button, Input, Label, TextField } from "@heroui/react";
import { FileData } from "../../types";

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
          <Modal.Dialog className="border border-[#222222] bg-[#050505] rounded-lg w-full max-w-md">
            <Modal.CloseTrigger className="text-gray-400 hover:text-white" />
            <Modal.Header>
              <Modal.Heading className="text-white text-lg font-semibold">Edit File Info</Modal.Heading>
            </Modal.Header>
            <Modal.Body className="space-y-4">
              <TextField>
                <Label className="text-sm font-medium text-gray-400">File Name</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[#111111] border border-[#222222] focus:border-white rounded-lg p-3 text-white"
                />
              </TextField>
              <TextField>
                <Label className="text-sm font-medium text-gray-400">Sender Name</Label>
                <Input
                  value={uploader}
                  onChange={(e) => setUploader(e.target.value)}
                  placeholder="anonymous"
                  className="w-full bg-[#111111] border border-[#222222] focus:border-white rounded-lg p-3 text-white"
                />
              </TextField>
            </Modal.Body>
            <Modal.Footer>
              <Button slot="close" className="text-white hover:bg-[#151515] hover:border-[#333333] border border-[#222222] bg-[#111111] rounded-lg">
                Cancel
              </Button>
              <Button
                onPress={handleSave}
                isPending={isSubmitting}
                className="bg-white text-black hover:bg-white/90 rounded-lg"
              >
                Save Changes
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
