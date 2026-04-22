import { Switch as ChakraSwitch } from "@chakra-ui/react"
import { forwardRef } from "react"

export interface SwitchProps extends ChakraSwitch.RootProps {
  inputProps?: React.InputHTMLAttributes<HTMLInputElement>
  rootRef?: React.Ref<HTMLLabelElement>
  thumbLabel?: { on: string; off: string }
}

export const Switch = forwardRef<HTMLInputElement, SwitchProps>(
  function Switch(props, ref) {
    const { inputProps, children, rootRef, thumbLabel, ...rootProps } = props

    return (
      <ChakraSwitch.Root {...rootProps} ref={rootRef}>
        <ChakraSwitch.HiddenInput ref={ref} {...inputProps} />
        <ChakraSwitch.Control>
          <ChakraSwitch.Thumb>
            {thumbLabel && (
              <ChakraSwitch.ThumbIndicator fallback={thumbLabel.off}>
                {thumbLabel.on}
              </ChakraSwitch.ThumbIndicator>
            )}
          </ChakraSwitch.Thumb>
        </ChakraSwitch.Control>
        {children != null && (
          <ChakraSwitch.Label>{children}</ChakraSwitch.Label>
        )}
      </ChakraSwitch.Root>
    )
  },
)
