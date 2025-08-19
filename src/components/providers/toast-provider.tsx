"use client";

import { Toaster } from "sonner";
import { useTheme } from "next-themes";

export function ToastProvider() {
  const { theme } = useTheme();

  return (
    <Toaster
      theme={theme as "light" | "dark" | "system"}
      className="toaster group"
      position="top-right"
      expand={true}
      richColors
      closeButton
    />
  );
}
