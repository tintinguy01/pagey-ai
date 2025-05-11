"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";

export function ThemeProvider({
  children,
  ...props
}: {
  children: React.ReactNode;
  [key: string]: unknown;
}) {
  return (
    <NextThemesProvider 
      defaultTheme="dark" 
      enableSystem={true}
      enableColorScheme={true}
      attribute="class"
      forcedTheme={typeof window === 'undefined' ? 'dark' : undefined}
      {...props}
    >
      {children}
    </NextThemesProvider>
  );
} 