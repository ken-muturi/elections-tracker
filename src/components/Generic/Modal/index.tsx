"use client"

import { useState, useCallback, cloneElement, isValidElement, ReactNode } from "react";
import { CloseButton, Dialog } from "@chakra-ui/react";

interface IModalProps {
  title?: string;
  children: ReactNode;
  mainContent: ReactNode;
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "cover" | "full";
  vh?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const CustomModal = (props: IModalProps) => {
  const { children, title = "", mainContent, size = "lg", open: controlledOpen, vh, onOpenChange } = props;

  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;

  const handleOpenChange = useCallback((next: boolean) => {
    if (!isControlled) setInternalOpen(next);
    onOpenChange?.(next);
  }, [isControlled, onOpenChange]);

  // Inject onClose so forms can close the dialog programmatically after save
  const enhancedMainContent = isValidElement(mainContent)
    ? cloneElement(
        mainContent as React.ReactElement<{ onClose?: () => void }>,
        { onClose: () => handleOpenChange(false) }
      )
    : mainContent;

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(details) => handleOpenChange(details.open)}
      size={size}
      scrollBehavior="inside"
    >
      <Dialog.Trigger asChild>{children}</Dialog.Trigger>
      <Dialog.Backdrop />
      <Dialog.Positioner>
        <Dialog.Content {...(vh ? { h: vh } : {})}>
          <Dialog.CloseTrigger asChild>
            <CloseButton size="sm" />
          </Dialog.CloseTrigger>
          <Dialog.Header>
            <Dialog.Title>{title}</Dialog.Title>
          </Dialog.Header>
          <Dialog.Body>{enhancedMainContent}</Dialog.Body>
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.Root>
  );
};

export default CustomModal;
