import { useState } from "react";

export function useToast() {
  const [toasts, setToasts] = useState<any[]>([]);

  const addToast = (message: string, type: "success" | "error" | "info" = "info", duration = 3000) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const toast = { id, message, type, duration };
    setToasts((prev) => [...prev, toast]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  const showSuccess = (message: string) => addToast(message, "success");
  const showError = (message: string) => addToast(message, "error");
  const showInfo = (message: string) => addToast(message, "info");

  return {
    toasts,
    addToast,
    removeToast,
    showSuccess,
    showError,
    showInfo,
  };
}
