import { forwardRef } from "react"
import { IconButton as ChakraIconButton, IconButtonProps, Box } from "@chakra-ui/react"

type ButtonVariant = "edit" | "delete" | "view" | "ghost"

type StyledIconButtonProps = Omit<IconButtonProps, "variant"> & {
  variant?: ButtonVariant
}

const StyledIconButton = forwardRef<HTMLButtonElement, StyledIconButtonProps>(
  ({ variant = "ghost", children, ...props }, ref) => {
    const variantStyles: Record<ButtonVariant, object> = {
      edit: {
        bg: "#eff6ff",
        color: "#2563eb",
        _hover: { bg: "#dbeafe", transform: "scale(1.05)" },
        _active: { bg: "#bfdbfe" },
      },
      delete: {
        bg: "#fef2f2",
        color: "#dc2626",
        _hover: { bg: "#fee2e2", transform: "scale(1.05)" },
        _active: { bg: "#fecaca" },
      },
      view: {
        bg: "#f0fdf4",
        color: "#16a34a",
        _hover: { bg: "#dcfce7", transform: "scale(1.05)" },
        _active: { bg: "#bbf7d0" },
      },
      ghost: {
        bg: "transparent",
        color: "gray.600",
        _hover: { bg: "gray.100", transform: "scale(1.05)" },
        _active: { bg: "gray.200" },
      },
    }

    return (
      <ChakraIconButton
        ref={ref}
        size="xs"
        h="20px"
        w="20px"
        minW="20px"
        borderRadius="full"
        transition="all 0.15s"
        {...variantStyles[variant]}
        {...props}
      >
        <Box fontSize="0.45rem">
          {children}
        </Box>
      </ChakraIconButton>
    )
  }
)

StyledIconButton.displayName = "StyledIconButton"

export default StyledIconButton
