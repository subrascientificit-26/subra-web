"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function BackButton() {
  const router = useRouter();
  const [canGoBack, setCanGoBack] = useState(false);

  useEffect(() => {
    // Check if we can go back (history length > 1)
    // Note: This works better when checked in useEffect after client hydration
    setCanGoBack(window.history.length > 1);
  }, []);

  const handleBack = () => {
    try {
      // Attempt to go back first
      router.back();
    } catch (error) {
      // Fallback to home page if back fails
      router.push("/");
    }
  };

  return (
    <button
      onClick={handleBack}
      className="rounded-md bg-primary hover:bg-primary-hover px-4 py-2 text-white transition"
      aria-label="Go back to previous page"
    >
      Previous
    </button>
  );
}