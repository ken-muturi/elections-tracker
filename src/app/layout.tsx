import type { Metadata } from "next";

import { Providers } from "./providers";
export const metadata: Metadata = {
  title: "Event Registration System",
  description: "Professional event registration and management system",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html suppressHydrationWarning>
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
