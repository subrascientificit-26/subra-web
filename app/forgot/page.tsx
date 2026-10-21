"use client";

import { useState } from "react";
import { ToastContainer } from "@/components/Toast";
import { useToast } from "@/lib/useToast";
import { useRouter } from "next/navigation";
import { Inter } from "next/font/google";
import { FaEnvelope, FaArrowLeft } from "react-icons/fa";
import ThemeToggle from "@/components/ThemeToggle";
import {
  AUTH_CARD_ACCENT_LINE_CLASS,
  AUTH_CARD_CLASS,
  AUTH_CARD_ICON_WRAPPER_CLASS,
  AUTH_CARD_SUBTITLE_CLASS,
  AUTH_CARD_TITLE_CLASS,
  AUTH_INPUT_CLASS,
  AUTH_INPUT_ICON_CLASS,
  AUTH_INPUT_WRAPPER_CLASS,
  AUTH_LINK_CLASS,
  AUTH_OVERLAY_CLASS,
  AUTH_SUBMIT_BTN_CLASS,
} from "@/lib/authPageStyles";

const inter = Inter({ subsets: ["latin"] });

export default function ForgotPasswordPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const { toasts, removeToast, showError, showSuccess } = useToast();

  const handleForgotPassword = async () => {
    setSuccess("");
    setMessage("");

    if (!email) {
      showError("Email required");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch(
        "/api/auth/forgot-password",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        showError(data.error || "Failed to send reset link");
        return;
      }

      const successMsg = "Reset link sent to your email! Check your inbox.";
      setSuccess(successMsg);
      setMessage(successMsg);
      showSuccess(successMsg);

      setTimeout(() => {
        router.push("/login");
      }, 3000);
    } catch (error) {
      showError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`${inter.className} relative min-h-screen bg-cover bg-center`}
      style={{ backgroundImage: "url('/Lab-test.jpg')" }}
    >
      <div className={AUTH_OVERLAY_CLASS} />

      <div className="absolute right-4 top-4 z-20">
        <ThemeToggle />
      </div>

      <div className="relative z-10 flex min-h-screen items-center justify-center px-4">

        <div className={AUTH_CARD_CLASS}>

          <div className="mb-4 flex justify-center">
            <div className={AUTH_CARD_ICON_WRAPPER_CLASS}>
              <FaEnvelope className="text-2xl text-primary" />
            </div>
          </div>

          <h2 className={AUTH_CARD_TITLE_CLASS}>
            Forgot Password
          </h2>

          <p className={AUTH_CARD_SUBTITLE_CLASS}>
            Enter your email to receive reset link
          </p>

          <div className={AUTH_CARD_ACCENT_LINE_CLASS} />

          <ToastContainer toasts={toasts} onClose={removeToast} />

          <div className="mt-6">
            <div className={AUTH_INPUT_WRAPPER_CLASS}>
              <FaEnvelope className={AUTH_INPUT_ICON_CLASS} />

              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email Address"
                className={AUTH_INPUT_CLASS}
              />
            </div>
          </div>

          <button
            onClick={handleForgotPassword}
            disabled={loading}
            className={`${AUTH_SUBMIT_BTN_CLASS} mt-6`}
          >
            {loading ? "SENDING..." : "SEND RESET LINK"}
          </button>

          <div className="mt-5 text-center">
            <button
              onClick={() => router.push("/login")}
              className={`flex items-center justify-center gap-2 ${AUTH_LINK_CLASS} mx-auto`}
            >
              <FaArrowLeft />
              Back to Login
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}