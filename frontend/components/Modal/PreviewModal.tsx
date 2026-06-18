import Image from "next/image";
import { Modal } from "@heroui/react";

type PreviewModalProps = {
  isOpen: boolean;
  previewUrl: string | null;
  onClose: () => void;
};

export function PreviewModal({
  isOpen,
  previewUrl,
  onClose,
}: PreviewModalProps) {
  if (!previewUrl) return null;

  return (
    <Modal>
      <Modal.Backdrop
        variant="blur"
        isOpen={isOpen}
        onOpenChange={(open) => !open && onClose()}
      >
        <Modal.Container placement="center">
          <Modal.Dialog className="bg-[#F5FEFD] dark:bg-[#111111] border border-gray-200 dark:border-[#222222] p-2 overflow-hidden w-[90vw] md:w-[70vw] h-[70vh] max-w-none rounded-xl shadow-2xl">
            <Modal.CloseTrigger className="absolute top-4 right-4 z-50 bg-black/10 dark:bg-black/50 hover:bg-black/20 dark:hover:bg-black/80 border border-black/10 dark:border-white/10 text-gray-900 dark:text-white" />
            <Modal.Body className="relative w-full h-full flex items-center justify-center p-0 rounded-lg overflow-hidden bg-gray-100 dark:bg-[#0a0a0a]">
              <Image
                src={previewUrl}
                alt="Preview"
                fill
                className="object-contain w-full h-full"
              />
            </Modal.Body>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
