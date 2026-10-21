"use client";

import { useEffect, useState } from "react";
import { FaCheckCircle, FaExclamationCircle, FaTimes } from "react-icons/fa";

interface ToastProps {
  id: string;
  message: string;
  type: "success" | "error" | "info";
  duration?: number;
  onClose: (id: string) => void;
}

export function Toast({ id, message, type, duration = 4000, onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(id);
    }, duration);

    return () => clearTimeout(timer);
  }, [id, duration, onClose]);

  const bgColor = {
    success: "bg-green-600",
    error: "bg-red-600",
    info: "bg-blue-600",
  }[type];

  const borderColor = {
    success: "border-green-700",
    error: "border-red-700",
    info: "border-blue-700",
  }[type];

  const Icon = {
    success: FaCheckCircle,
    error: FaExclamationCircle,
    info: FaExclamationCircle,
  }[type];

  return (
    <div
      className={`${bgColor} ${borderColor} border-l-4 text-white px-5 py-4 rounded-lg shadow-2xl flex items-center gap-3 animate-in slide-in-from-top-2 duration-300 min-w-[300px] backdrop-blur-sm bg-opacity-95`}
      role="alert"
    >
      <Icon className="w-6 h-6 flex-shrink-0" />
      <span className="flex-1 font-medium text-sm">{message}</span>
      <button
        onClick={() => onClose(id)}
        className="hover:opacity-70 transition flex-shrink-0 ml-2"
        aria-label="Close notification"
      >
        <FaTimes className="w-4 h-4" />
      </button>
    </div>
  );
}

export function ToastContainer({ toasts, onClose }: any) {
  return (
    <div className="fixed top-6 right-6 z-[9999] space-y-3 pointer-events-none">
      {toasts.map((toast: any) => (
        <div key={toast.id} className="pointer-events-auto">
          <Toast {...toast} onClose={onClose} />
        </div>
      ))}
    </div>
  );
}
