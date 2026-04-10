"use client";

import { Toaster as SonnerToaster } from "sonner";

export function Toaster() {
  return (
    <SonnerToaster 
      position="bottom-center"
      expand={false}
      richColors
      closeButton={false}
      draggable
      theme="light"
      style={{ zIndex: 99999 }}
      toastOptions={{
        style: {
          zIndex: 99999,
        },
      }}
    />
  );
}
