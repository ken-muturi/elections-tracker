"use client"

import { Box, Text } from "@chakra-ui/react"

type Props = {
  value: number      // 0–100
  showLabel?: boolean
  height?: number
}

const getColor = (v: number) =>
  v >= 75 ? "#2A9D8F" : v >= 55 ? "#E9C46A" : "#E63946"

export const ProgressBar = ({ value, showLabel = true, height = 8 }: Props) => {
  const clamp = Math.max(0, Math.min(100, value))
  const color = getColor(clamp)

  return (
    <Box>
      <Box
        bg="whiteAlpha.100"
        borderRadius="full"
        overflow="hidden"
        h={`${height}px`}
      >
        <Box
          h="full"
          bg={color}
          borderRadius="full"
          style={{ width: `${clamp}%`, transition: "width 0.6s ease" }}
        />
      </Box>
      {showLabel && (
        <Text fontSize="xs" color={color} fontWeight="bold" mt={1} fontFamily="'Space Mono', monospace">
          {clamp.toFixed(1)}%
        </Text>
      )}
    </Box>
  )
}
