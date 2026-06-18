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
          <Modal.Dialog className="border border-[#222222] bg-[#050505] rounded-lg">
            <Modal.CloseTrigger className="text-gray-400 hover:text-white" />
            <Modal.Header>
              <Modal.Heading className="text-white">{title}</Modal.Heading>
            </Modal.Header>
            <Modal.Body>
              <p className="text-gray-300">{description}</p>
            </Modal.Body>
            <Modal.Footer>
              <Button slot="close" className="text-white hover:bg-[#151515] hover:border-[#333333] border border-[#222222] bg-[#111111] rounded-lg">
                {cancelText}
              </Button>
              <Button
                onPress={() => {
                  onConfirm();
                  onOpenChange(false);
                }}
                className="bg-white text-black hover:bg-white/90 rounded-lg"
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
