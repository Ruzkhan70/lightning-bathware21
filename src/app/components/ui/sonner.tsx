"use client";

import { Toaster as SonnerToaster } from "sonner";

export function Toaster() {
  console.log("🔔 TOAST DEBUG: Toaster component is rendering!");
  
  return (
    <SonnerToaster 
      position="top-right"
      expand={true}
      richColors
      closeButton
      draggable
      theme="light"
    />
  );
}
