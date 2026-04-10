"use client";

import { Toaster as Sonner, ToasterProps } from "sonner";

const Toaster = ({ ...props }: ToasterProps) => {
  console.log("🔔 TOAST DEBUG: Toaster component rendered", props);
  
  return (
    <Sonner
      theme="light"
      className="toaster group"
      closeButton={true}
      expand={true}
      richColors={true}
      draggable={true}
      position="top-right"
      {...props}
    />
  );
};

export { Toaster };
