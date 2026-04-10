"use client";

import { useEffect } from "react";
import { Toaster as SonnerToaster, toast } from "sonner";

export function Toaster() {
  useEffect(() => {
    const timer = setTimeout(() => {
      toast.success("Test toast - If you see this, toasts are working!", {
        duration: 10000,
      });
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);
  
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
