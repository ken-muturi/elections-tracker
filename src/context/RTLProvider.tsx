'use client';
import { CacheProvider } from '@emotion/react'
import createCache from '@emotion/cache'
import rtl from 'stylis-plugin-rtl'
import { Box } from '@chakra-ui/react';
import { useUX } from './UXContext';

// NB: A unique `key` is important for it to work!
const options = {
  rtl: { key: 'css-ar', stylisPlugins: [rtl] },
  ltr: { key: 'css-en' },
}

export function RtlProvider({ children }: { children: React.ReactNode }) {
  const { locale } = useUX();
  const dir = locale === "ar" ? "rtl" : "ltr";

  const cache = createCache(options[dir])
  return (
    <CacheProvider value={cache}>
        <Box lang={locale} dir={dir}>
            {children}
        </Box>
    </CacheProvider>
  )
}