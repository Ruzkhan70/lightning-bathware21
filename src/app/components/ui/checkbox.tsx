"use client";

import * as React from "react";
import { CheckIcon } from "lucide-react";

import { cn } from "./utils";

const Checkbox = React.forwardRef<
  HTMLInputElement,
  Omit<React.ComponentPropsWithoutRef<"input">, "onChange"> & {
    onCheckedChange?: (checked: boolean) => string | void;
    onChange?: React.ChangeEventHandler<HTMLInputElement>;
  }
>(({ className, checked, onCheckedChange, onChange, disabled, ...props }, ref) => (
  <div className={cn("relative flex items-center justify-center shrink-0 size-4", className)}>
    <input
      type="checkbox"
      ref={ref}
      checked={checked}
      disabled={disabled}
      onChange={(e) => {
        onChange?.(e);
        onCheckedChange?.(e.target.checked);
      }}
      className="peer absolute inset-0 z-10 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed m-0"
      {...props}
    />
    <div className="absolute inset-0 pointer-events-none flex items-center justify-center border bg-input-background dark:bg-input/30 peer-checked:bg-primary peer-checked:text-primary-foreground peer-checked:border-primary peer-focus-visible:border-ring peer-focus-visible:ring-ring/50 peer-aria-invalid:ring-destructive/20 dark:peer-aria-invalid:ring-destructive/40 peer-aria-invalid:border-destructive rounded-[4px] shadow-xs transition-shadow outline-none peer-focus-visible:ring-[3px] peer-disabled:opacity-50">
      <CheckIcon className="size-3.5 opacity-0 peer-checked:opacity-100 transition-opacity" />
    </div>
  </div>
))
Checkbox.displayName = "Checkbox"

export { Checkbox };
