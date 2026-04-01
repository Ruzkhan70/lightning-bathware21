import { toast } from "sonner";

export function handleError(error: unknown, customMessage?: string): void {
  const message = customMessage || "An error occurred";
  
  if (error instanceof Error) {
    toast.error(`${message}: ${error.message}`);
  } else {
    toast.error(message);
  }
}

export function handleSuccess(message: string): void {
  toast.success(message);
}

export function handleInfo(message: string): void {
  toast.info(message);
}