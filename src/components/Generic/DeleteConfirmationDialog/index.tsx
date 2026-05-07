import {
  Button,
  Box,
  Input,
  VStack,
  Dialog,
  CloseButton,
} from "@chakra-ui/react";
import { ReactNode, useState } from "react";
import { dictionary } from "./dictionary";
import { useUX } from "@/context/UXContext";

interface IModalProps {
  title?: string;
  children: ReactNode;
  mainContent: ReactNode;
  isCentered?: boolean;
  onConfirm: () => void;
  hasConfirmText?: boolean;
}

const Index = ({
  title,
  isCentered = true,
  children,
  mainContent,
  hasConfirmText,
  onConfirm,
}: IModalProps) => {
  const { translate } = useUX();
  const [value, setValue] = useState(!hasConfirmText ? "confirm" : "");
  const [open, setOpen] = useState(false);

  const handleConfirm = () => {
    onConfirm();
    setOpen(false);
  };

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(e) => setOpen(e.open)}
      motionPreset="slide-in-bottom"
      role="alertdialog"
      placement={isCentered ? "center" : "top"}
    >
      <Dialog.Trigger asChild>
        <Box onClick={() => setOpen(true)}>{children}</Box>
      </Dialog.Trigger>
      <Dialog.Backdrop />
      <Dialog.Positioner>
        <Dialog.Content>
          <Dialog.CloseTrigger asChild>
            <CloseButton size="sm" />
          </Dialog.CloseTrigger>
          {title && (
            <Dialog.Header>
              <Dialog.Title fontWeight="bold">{title}</Dialog.Title>
            </Dialog.Header>
          )}

          <Dialog.Body mt={title ? 0 : 4}>
            <VStack gap={2} align="start">
              <Box fontSize="sm">{mainContent}</Box>
              {hasConfirmText && (
                <>
                  <Box fontWeight="500" fontSize="sm">
                    {translate(dictionary.confirmText)}
                  </Box>
                  <Input
                    color="gray.500"
                    size="sm"
                    variant="outline"
                    onChange={(e) => setValue(e.target.value)}
                  />
                </>
              )}
            </VStack>
          </Dialog.Body>

          <Dialog.Footer>
            <Dialog.ActionTrigger asChild>
              <Button size="xs" variant="outline">
                {translate(dictionary.cancel)}
              </Button>
            </Dialog.ActionTrigger>
            <Button
              size="xs"
              disabled={value.toLowerCase() !== "confirm"}
              colorPalette="red"
              onClick={handleConfirm}
              ml={3}
            >
              {translate(dictionary.confirm)}
            </Button>
          </Dialog.Footer>
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.Root>
  );
};

export default Index;
