"use client";

import { Toaster as SonnerToaster } from "sonner";
import { useTheme } from "../../context/ThemeContext";

export function Toaster() {
  const { theme } = useTheme();
  
  return (
    <SonnerToaster 
      position="top-right"
      expand={false}
      closeButton={false}
      theme={theme}
      style={{ zIndex: 99999 }}
    />
  );
}
