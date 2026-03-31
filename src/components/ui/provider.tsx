"use client"

import { ChakraProvider } from "@chakra-ui/react";
import { ThemeProvider } from "next-themes";
import { system } from "./theme";
import { useState, useEffect } from "react";

export function Provider(props: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Prevent hydration mismatch by showing minimal version during SSR
  if (!mounted) {
    return (
      <ChakraProvider value={system}>
        <div suppressHydrationWarning>{props.children}</div>
      </ChakraProvider>
    );
  }

  return (
    <ChakraProvider value={system}>
      <ThemeProvider attribute="class" disableTransitionOnChange>
        {props.children}
      </ThemeProvider>
    </ChakraProvider>
  );
}
