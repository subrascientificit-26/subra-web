"use client";

import { useEffect, useRef, useState } from "react";
import { RefreshCw, ShieldCheck } from "lucide-react";
import { RequiredMark } from "@/components/ui/FieldLabel";

interface CaptchaFieldProps {
  value: string;
  onChange: (value: string) => void;
  onTokenChange: (token: string) => void;
  refreshTrigger?: number;
  error?: string;
  compact?: boolean;
  disabled?: boolean;
}

export default function CaptchaField({
  value,
  onChange,
  onTokenChange,
  refreshTrigger = 0,
  error,
  compact = false,
  disabled = false,
}: CaptchaFieldProps) {
  const [imageDataUrl, setImageDataUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [manualTick, setManualTick] = useState(0);
  const onTokenChangeRef = useRef(onTokenChange);

  useEffect(() => {
    onTokenChangeRef.current = onTokenChange;
  }, [onTokenChange]);

  useEffect(() => {
    let active = true;

    fetch(`/api/captcha?t=${Date.now()}`, { cache: "no-store" })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok || !data?.token || !data?.imageDataUrl) {
          throw new Error("Could not load CAPTCHA");
        }
        return data as { token: string; imageDataUrl: string };
      })
      .then((data) => {
        if (!active) return;
        setImageDataUrl(data.imageDataUrl);
        setLoadError("");
        onTokenChangeRef.current(data.token);
      })
      .catch(() => {
        if (!active) return;
        setImageDataUrl("");
        onTokenChangeRef.current("");
        setLoadError("Could not load CAPTCHA. Click refresh to retry.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [refreshTrigger, manualTick]);

  const handleManualRefresh = () => {
    setLoading(true);
    setLoadError("");
    onChange("");
    setManualTick((prev) => prev + 1);
  };

  return (
    <div className={compact ? "space-y-2" : "space-y-2.5"}>
      <label
        className={`flex items-center gap-1.5 font-medium text-foreground ${
          compact ? "text-xs" : "text-sm"
        }`}
      >
        <ShieldCheck size={compact ? 14 : 16} className="text-primary shrink-0" />
        <span>Security Verification (CAPTCHA)</span>
        <RequiredMark />
      </label>

      <div
        className={`rounded-xl border border-border bg-surface-elevated ${
          compact ? "p-2.5 space-y-2" : "p-3 space-y-3"
        }`}
      >
        <div className="flex items-center gap-2.5">
          <div
            className={`relative flex flex-1 items-center justify-center overflow-hidden rounded-lg border border-border bg-slate-100 ${
              compact ? "h-12" : "h-14"
            }`}
          >
            {loading ? (
              <span className="text-xs text-slate-500">Loading CAPTCHA...</span>
            ) : imageDataUrl ? (
              <img
                src={imageDataUrl}
                alt="CAPTCHA challenge"
                className="h-full w-auto max-w-full select-none object-contain"
                draggable={false}
              />
            ) : (
              <span className="text-xs text-red-600">Unavailable</span>
            )}
          </div>

          <button
            type="button"
            onClick={handleManualRefresh}
            disabled={loading || disabled}
            title="Refresh CAPTCHA"
            aria-label="Refresh CAPTCHA"
            className={`inline-flex shrink-0 items-center justify-center rounded-lg border border-border bg-surface text-muted transition hover:border-primary hover:text-primary disabled:opacity-50 ${
              compact ? "h-12 w-11" : "h-14 w-12"
            }`}
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          </button>
        </div>

        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value.replace(/\s+/g, ""))}
          placeholder="Enter the 6 characters shown above"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="characters"
          spellCheck={false}
          maxLength={8}
          disabled={disabled}
          required
          aria-label="CAPTCHA verification code"
          className={`w-full rounded-lg border bg-surface px-3.5 text-sm font-mono tracking-[0.2em] uppercase text-foreground placeholder:font-sans placeholder:tracking-normal placeholder:normal-case placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition ${
            error || loadError ? "border-red-500/70" : "border-border"
          } ${compact ? "h-10" : "h-11"}`}
        />
      </div>

      {(error || loadError) && (
        <p className="text-xs font-medium text-red-600 theme-dark:text-red-400">
          {error || loadError}
        </p>
      )}
    </div>
  );
}
