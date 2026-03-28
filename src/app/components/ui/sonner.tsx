"use client";

import { Toaster as Sonner, ToasterProps, Toast } from "sonner";
import type { ExternalToast } from "sonner";

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="light"
      className="toaster group"
      closeButton={false}
      toastOptions={{
        classNames: {
          toast: "toast-custom",
          success: "toast-success",
          error: "toast-error",
          info: "toast-info",
          warning: "toast-warning",
        },
      }}
      style={
        {
          "--normal-bg": "#ffffff",
          "--normal-text": "#1f2937",
          "--normal-border": "#e5e7eb",
          "--success-bg": "#ffffff",
          "--success-text": "#166534",
          "--success-border": "#bbf7d0",
          "--error-bg": "#ffffff",
          "--error-text": "#991b1b",
          "--error-border": "#fecaca",
        } as React.CSSProperties
      }
      draggable={true}
      {...props}
    />
  );
};

export { Toaster };
