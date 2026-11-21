import { useCallback, useState } from "react";

export function useToast() {
  const [toasts, setToasts] = useState<
    Array<{
      id: string;
      message: string;
      type: "success" | "error" | "info";
      duration: number;
    }>
  >([]);

  const addToast = useCallback(
    (
      message: string,
      type: "success" | "error" | "info" = "info",
      duration = 3000
    ) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      const toast = { id, message, type, duration };
      setToasts((prev) => [...prev, toast]);
    },
    []
  );

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const showSuccess = useCallback(
    (message: string) => addToast(message, "success"),
    [addToast]
  );
  const showError = useCallback(
    (message: string) => addToast(message, "error"),
    [addToast]
  );
  const showInfo = useCallback(
    (message: string) => addToast(message, "info"),
    [addToast]
  );

  return {
    toasts,
    addToast,
    removeToast,
    showSuccess,
    showError,
    showInfo,
  };
}
