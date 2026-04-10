"use client";

import { Toaster as Sonner, ToasterProps } from "sonner";

const Toaster = ({ ...props }: ToasterProps) => {
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
