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
          <Modal.Dialog className="border border-white/10 bg-black shadow-2xl">
            <Modal.CloseTrigger className="text-gray-400 hover:text-white" />
            <Modal.Header>
              <Modal.Heading className="text-white">{title}</Modal.Heading>
            </Modal.Header>
            <Modal.Body>
              <p className="text-gray-300">{description}</p>
            </Modal.Body>
            <Modal.Footer>
              <Button slot="close" variant="secondary" className="text-white hover:bg-white/10 border border-white/10 bg-white/5">
                {cancelText}
              </Button>
              <Button
                onPress={() => {
                  onConfirm();
                  onOpenChange(false);
                }}
                className="bg-white text-black hover:bg-white/90"
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
