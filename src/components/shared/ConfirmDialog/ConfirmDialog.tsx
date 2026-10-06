"use client";

import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Dialog";

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDangerous?: boolean;
  isLoading?: boolean;
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  isDangerous = false,
  isLoading = false,
}: ConfirmDialogProps) {
  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title={title}
      footer={
        <div className="flex w-full flex-wrap items-center justify-between gap-3">
          <Button variant="outline" onPress={onClose}>
            {cancelLabel}
          </Button>
          <Button
            variant={isDangerous ? "danger" : "primary"}
            isLoading={isLoading}
            onPress={() => {
              onConfirm();
              onClose();
            }}
          >
            {confirmLabel}
          </Button>
        </div>
      }
    >
      <p className="text-ink">{message}</p>
    </Modal>
  );
}
