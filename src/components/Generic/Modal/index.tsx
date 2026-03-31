import { CloseButton, Dialog } from "@chakra-ui/react";
import { ReactNode, cloneElement, isValidElement } from "react";

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
  const {
    children,
    title = "",
    mainContent,
    size = "lg",
    open,
    vh,
    onOpenChange,
  } = props;

  // Inject onClose into mainContent if it's a React element
  const enhancedMainContent = isValidElement(mainContent)
    ? cloneElement(
        mainContent as React.ReactElement<{ onClose?: () => void }>,
        {
          onClose: () => onOpenChange?.(false),
        }
      )
    : mainContent;

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(details) => onOpenChange?.(details.open)}
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
          {/* {title && ( */}
          <Dialog.Header>
            <Dialog.Title>{title}</Dialog.Title>
          </Dialog.Header>
          {/* )} */}
          <Dialog.Body>{enhancedMainContent}</Dialog.Body>
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.Root>
  );
};

export default CustomModal;
