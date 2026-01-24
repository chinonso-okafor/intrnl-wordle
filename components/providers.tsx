"use client";

import { SessionProvider } from "next-auth/react";
import { DarkModeProvider } from "@/lib/dark-mode-context";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <DarkModeProvider>
      <SessionProvider>{children}</SessionProvider>
    </DarkModeProvider>
  );
}
