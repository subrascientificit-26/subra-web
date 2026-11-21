"use client";

import { useRef, useState } from "react";
import { ImagePlus, X } from "lucide-react";
import { DEFAULT_PRODUCT_IMAGE } from "@/lib/products";

interface SimpleImageUploadProps {
  label?: string;
  previewUrl?: string | null;
  onChange: (file: File | null) => void;
  onRemove?: () => void;
  accept?: string;
  disabled?: boolean;
  error?: string;
  hint?: string;
  className?: string;
}

export default function SimpleImageUpload({
  label = "Image",
  previewUrl,
  onChange,
  onRemove,
  accept = "image/jpeg,image/png,image/webp,image/svg+xml,image/x-icon",
  disabled = false,
  error,
  hint = "Click or drag to upload an image",
  className = "h-28",
}: SimpleImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [errorUrl, setErrorUrl] = useState<string | null>(null);
  const imgError = Boolean(previewUrl && errorUrl === previewUrl);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    onChange(file);
  };

  const handleDrop = (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setDragging(false);
    if (disabled) return;
    const file = event.dataTransfer.files?.[0];
    if (file) {
      onChange(file);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    if (!disabled) setDragging(true);
  };

  const handleDragLeave = (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setDragging(false);
  };

  const handleRemove = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    onRemove?.();
    onChange(null);
  };

  return (
    <div>
      {label ? (
        <p className="mb-2 block text-xs font-semibold uppercase tracking-wider text-muted">
          {label}
        </p>
      ) : null}

      <label
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative flex ${className} w-full cursor-pointer items-center justify-center overflow-hidden rounded-xl border border-dashed bg-surface-elevated transition ${
          dragging ? "border-primary bg-primary/5" : "border-border hover:border-primary"
        } ${disabled ? "pointer-events-none opacity-50" : ""}`}
      >
        {previewUrl ? (
          <>
            <img
              src={imgError ? DEFAULT_PRODUCT_IMAGE : previewUrl}
              alt="Upload preview"
              onError={() => {
                if (!imgError) {
                  setErrorUrl(previewUrl || null);
                }
              }}
              className="h-full w-full object-contain p-2"
            />
            {onRemove && !disabled ? (
              <button
                type="button"
                onClick={handleRemove}
                className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/70 text-white transition hover:bg-red-600"
                aria-label="Remove image"
              >
                <X size={14} />
              </button>
            ) : null}
          </>
        ) : disabled ? (
          <img
            src={DEFAULT_PRODUCT_IMAGE}
            alt="Default image"
            className="h-full w-full object-contain p-2"
          />
        ) : (
          <div className="flex flex-col items-center gap-1.5 px-4 text-center">
            <ImagePlus size={18} className="text-muted" />
            <span className="text-[11px] text-muted">{hint}</span>
          </div>
        )}

        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="hidden"
          disabled={disabled}
          onChange={handleFileChange}
        />
      </label>

      {error ? (
        <p className="mt-1.5 text-[11px] font-medium text-red-600 theme-dark:text-red-400">{error}</p>
      ) : null}
    </div>
  );
}
