"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, Trash2, X, ZoomIn } from "lucide-react";

const CROP_SIZE = 280;
const OUTPUT_SIZE = 256;

interface ProfileImageCropProps {
  currentImage?: string;
  previewUrl?: string;
  onCropped: (file: File) => void;
  onRemove?: () => void;
  error?: string;
  disabled?: boolean;
}

function getCroppedImage(
  image: HTMLImageElement,
  scale: number,
  offsetX: number,
  offsetY: number
): Promise<File> {
  const canvas = document.createElement("canvas");
  canvas.width = OUTPUT_SIZE;
  canvas.height = OUTPUT_SIZE;
  const context = canvas.getContext("2d");

  if (!context) {
    return Promise.reject(new Error("Could not prepare image crop"));
  }

  const baseScale = Math.max(CROP_SIZE / image.width, CROP_SIZE / image.height);
  const drawScale = baseScale * scale;
  const drawWidth = image.width * drawScale;
  const drawHeight = image.height * drawScale;
  const drawX = (CROP_SIZE - drawWidth) / 2 + offsetX;
  const drawY = (CROP_SIZE - drawHeight) / 2 + offsetY;
  const sourceX = Math.max(0, -drawX / drawScale);
  const sourceY = Math.max(0, -drawY / drawScale);
  const sourceSize = CROP_SIZE / drawScale;

  context.drawImage(
    image,
    sourceX,
    sourceY,
    sourceSize,
    sourceSize,
    0,
    0,
    OUTPUT_SIZE,
    OUTPUT_SIZE
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Failed to crop image"));
          return;
        }
        resolve(new File([blob], "profile.jpg", { type: "image/jpeg" }));
      },
      "image/jpeg",
      0.92
    );
  });
}

export default function ProfileImageCrop({
  currentImage = "",
  previewUrl = "",
  onCropped,
  onRemove,
  error,
  disabled = false,
}: ProfileImageCropProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const dragRef = useRef<{ x: number; y: number; startX: number; startY: number } | null>(
    null
  );
  const [modalOpen, setModalOpen] = useState(false);
  const [imageSrc, setImageSrc] = useState("");
  const [naturalSize, setNaturalSize] = useState({ width: 0, height: 0 });
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [applying, setApplying] = useState(false);

  const displayImage = previewUrl || currentImage;

  useEffect(() => {
    return () => {
      if (imageSrc.startsWith("blob:")) {
        URL.revokeObjectURL(imageSrc);
      }
    };
  }, [imageSrc]);

  const openFilePicker = () => {
    if (!disabled) inputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      return;
    }

    const url = URL.createObjectURL(file);
    setImageSrc(url);
    setNaturalSize({ width: 0, height: 0 });
    setScale(1);
    setOffset({ x: 0, y: 0 });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    if (imageSrc.startsWith("blob:")) {
      URL.revokeObjectURL(imageSrc);
    }
    setImageSrc("");
  };

  const applyCrop = async () => {
    if (!imageSrc) return;

    setApplying(true);
    try {
      const image = new Image();
      image.src = imageSrc;
      await new Promise<void>((resolve, reject) => {
        image.onload = () => resolve();
        image.onerror = () => reject(new Error("Failed to load image"));
      });

      const croppedFile = await getCroppedImage(image, scale, offset.x, offset.y);
      onCropped(croppedFile);
      closeModal();
    } finally {
      setApplying(false);
    }
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    dragRef.current = {
      x: offset.x,
      y: offset.y,
      startX: event.clientX,
      startY: event.clientY,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current) return;
    setOffset({
      x: dragRef.current.x + (event.clientX - dragRef.current.startX),
      y: dragRef.current.y + (event.clientY - dragRef.current.startY),
    });
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    dragRef.current = null;
    event.currentTarget.releasePointerCapture(event.pointerId);
  };

  const baseScale =
    naturalSize.width > 0
      ? Math.max(CROP_SIZE / naturalSize.width, CROP_SIZE / naturalSize.height)
      : 1;
  const displayWidth = naturalSize.width * baseScale * scale;
  const displayHeight = naturalSize.height * baseScale * scale;

  return (
    <div>
      <p className="mb-2 block text-xs font-semibold uppercase tracking-wider text-muted">
        Profile Photo
      </p>

      <div className="flex items-center gap-4">
        {displayImage ? (
          <img
            src={displayImage}
            alt="Profile"
            className="h-20 w-20 rounded-full border border-border object-cover"
          />
        ) : (
          <div className="flex h-20 w-20 items-center justify-center rounded-full border border-border bg-surface-elevated text-2xl font-semibold text-muted">
            ?
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={openFilePicker}
            disabled={disabled}
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-surface px-4 py-2 text-sm text-foreground transition hover:bg-surface-elevated disabled:opacity-50"
          >
            <Camera size={15} />
            {displayImage ? "Change Photo" : "Upload Photo"}
          </button>

          {displayImage && onRemove ? (
            <button
              type="button"
              onClick={onRemove}
              disabled={disabled}
              className="inline-flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-300 transition hover:bg-red-500/20 disabled:opacity-50"
            >
              <Trash2 size={15} />
              Remove
            </button>
          ) : null}
        </div>
      </div>

      <p className="mt-2 text-xs text-muted">
        Upload a square photo. You can drag and zoom to crop before saving.
      </p>

      {error ? <p className="mt-1.5 text-[11px] font-medium text-red-400">{error}</p> : null}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleFileChange}
      />

      {modalOpen ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-5 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-foreground">Crop Profile Photo</h3>
              <button
                type="button"
                onClick={closeModal}
                className="rounded-lg p-2 text-muted transition hover:bg-surface-elevated hover:text-foreground"
              >
                <X size={18} />
              </button>
            </div>

            <div
              className="relative mx-auto overflow-hidden rounded-full border border-border bg-black"
              style={{ width: CROP_SIZE, height: CROP_SIZE }}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
            >
              {imageSrc ? (
                <img
                  src={imageSrc}
                  alt="Crop preview"
                  draggable={false}
                  onLoad={(event) => {
                    const image = event.currentTarget;
                    setNaturalSize({
                      width: image.naturalWidth,
                      height: image.naturalHeight,
                    });
                  }}
                  className="absolute left-1/2 top-1/2 max-w-none select-none"
                  style={{
                    width: displayWidth || "auto",
                    height: displayHeight || "auto",
                    transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px))`,
                  }}
                />
              ) : null}
            </div>

            <div className="mt-4">
              <label className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted">
                <ZoomIn size={14} />
                Zoom
              </label>
              <input
                type="range"
                min={1}
                max={3}
                step={0.01}
                value={scale}
                onChange={(event) => setScale(Number(event.target.value))}
                className="w-full"
              />
            </div>

            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={closeModal}
                className="flex-1 rounded-xl border border-border px-4 py-2.5 text-sm text-foreground transition hover:bg-surface-elevated"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={applyCrop}
                disabled={applying}
                className="flex-1 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-hover disabled:opacity-50"
              >
                {applying ? "Applying..." : "Apply Crop"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
