"use client";

import { Toaster as SonnerToaster } from "sonner";

export function Toaster() {
  return (
    <SonnerToaster 
      position="top-right"
      expand={false}
      closeButton={false}
      draggable
      theme="light"
      style={{ zIndex: 99999 }}
    />
  );
}
