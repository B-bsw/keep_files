import { Modal, Button } from "@heroui/react";

type ConfirmModalProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  title: string;
  description: string;
  onConfirm: () => void;
  confirmText?: string;
  cancelText?: string;
};

export function ConfirmModal({
  isOpen,
  onOpenChange,
  title,
  description,
  onConfirm,
  confirmText = "Confirm",
  cancelText = "Cancel",
}: ConfirmModalProps) {
  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
      <Modal.Backdrop>
        <Modal.Container>
          <Modal.Dialog className="border border-gray-200 dark:border-[#222222] bg-[#F5FEFD] dark:bg-[#050505] rounded-lg">
            <Modal.CloseTrigger className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white" />
            <Modal.Header>
              <Modal.Heading className="text-gray-900 dark:text-white">{title}</Modal.Heading>
            </Modal.Header>
            <Modal.Body>
              <p className="text-gray-600 dark:text-gray-300">{description}</p>
            </Modal.Body>
            <Modal.Footer>
              <Button slot="close" className="text-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-[#151515] hover:border-gray-300 dark:hover:border-[#333333] border border-gray-200 dark:border-[#222222] bg-[#F5FEFD] dark:bg-[#111111] rounded-lg">
                {cancelText}
              </Button>
              <Button
                onPress={() => {
                  onConfirm();
                  onOpenChange(false);
                }}
                className="bg-gray-900 dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-white/90 rounded-lg"
              >
                {confirmText}
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
