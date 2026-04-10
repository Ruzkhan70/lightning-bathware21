"use client";

import { useEffect } from "react";
import { Toaster as SonnerToaster, toast } from "sonner";

export function Toaster() {
  console.log("🔔 TOAST DEBUG: Toaster component is rendering!");
  
  useEffect(() => {
    // Test toast on page load to verify toasts work
    const timer = setTimeout(() => {
      console.log("🔔 TOAST DEBUG: Firing test toast...");
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
      closeButton
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
