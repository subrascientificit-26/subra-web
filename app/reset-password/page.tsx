"use client";

import { useState, useEffect } from "react";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ROUTES } from "@/lib/routes";

import { Inter } from "next/font/google";

import {
  FaLock,
  FaEye,
  FaEyeSlash,
  FaKey,
} from "react-icons/fa";
import { ToastContainer } from "@/components/Toast";
import { useToast } from "@/lib/useToast";
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
  AUTH_OVERLAY_CLASS,
  AUTH_SUBMIT_BTN_CLASS,
} from "@/lib/authPageStyles";

const inter = Inter({
  subsets: ["latin"],
});

export default function ResetPasswordPage() {
  const router = useRouter();
  const [token, setToken] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(
      window.location.search
    );
    setToken(params.get("token") || "");
  }, []);

  const [password, setPassword] =
    useState("");

  const [
    confirmPassword,
    setConfirmPassword,
  ] = useState("");

  const [
    showPassword,
    setShowPassword,
  ] = useState(false);

  const [
    showConfirmPassword,
    setShowConfirmPassword,
  ] = useState(false);

  const [loading, setLoading] =
    useState(false);
  const { toasts, removeToast, showError } = useToast();
  const [success, setSuccess] =
    useState("");

  // PASSWORD RULES
  const passwordRules = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special:
      /[!@#$%^&*(),.?":{}|<>]/.test(
        password
      ),
  };

  const isPasswordValid =
    passwordRules.length &&
    passwordRules.uppercase &&
    passwordRules.lowercase &&
    passwordRules.number &&
    passwordRules.special;

  // RESET PASSWORD
  const handleResetPassword =
    async () => {
      setSuccess("");

      // VALIDATION
      if (
        !password ||
        !confirmPassword
      ) {
        showError(
            "All fields are required"
          );
        return;
      }

      // PASSWORD VALIDATION
      if (!isPasswordValid) {
        showError(
          "Password must be 8+ chars with uppercase, lowercase, number & special character"
        );
        return;
      }

      if (
        password !==
        confirmPassword
      ) {
        showError(
          "Passwords do not match"
        );
        return;
      }

      try {
        setLoading(true);

        const res = await fetch(
          "/api/auth/reset-password",
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              token,
              password,
            }),
          }
        );

        const data =
          await res.json();

        if (!res.ok) {
          showError(
            data.error ||
              "Reset failed"
          );
          return;
        }

        setSuccess(
          "Password reset successful"
        );
        toast.success("Password reset successful");
        router.push(ROUTES.login);
      } catch (err) {
        console.error(err);

          showError(
            "Something went wrong"
          );
      } finally {
        setLoading(false);
      }
    };

  return (
    <div
      className={`${inter.className} relative min-h-screen bg-cover bg-center`}
      style={{
        backgroundImage:
          "url('/Lab-test.jpg')",
      }}
    >
      {/* Overlay */}
      <div className={AUTH_OVERLAY_CLASS} />

      <div className="absolute right-4 top-4 z-20">
        <ThemeToggle />
      </div>

      {/* CENTER */}
      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 pt-16 pb-6">

        <div className={AUTH_CARD_CLASS}>

          {/* ICON */}
          <div className="mb-4 flex justify-center">
            <div className={AUTH_CARD_ICON_WRAPPER_CLASS}>
              <FaKey className="text-2xl text-primary" />
            </div>
          </div>

          {/* TITLE */}
          <h2 className={AUTH_CARD_TITLE_CLASS}>
            Reset Password
          </h2>

          <p className={AUTH_CARD_SUBTITLE_CLASS}>
            Create a new password
          </p>

          <div className={AUTH_CARD_ACCENT_LINE_CLASS} />

          {/* SUCCESS */}
          <ToastContainer toasts={toasts} onClose={removeToast} />

          {/* FORM */}
          <div className="mt-6 space-y-4">

            {/* PASSWORD */}
            <div className={AUTH_INPUT_WRAPPER_CLASS}>

              <FaLock className={AUTH_INPUT_ICON_CLASS} />

              <input
                type={
                  showPassword
                    ? "text"
                    : "password"
                }
                value={password}
                onChange={(e) =>
                  setPassword(
                    e.target.value
                  )
                }
                placeholder="New Password"
                className={AUTH_INPUT_CLASS}
              />

              {showPassword ? (
                <FaEyeSlash
                  onClick={() =>
                    setShowPassword(false)
                  }
                  className={`cursor-pointer ${AUTH_INPUT_ICON_CLASS} mr-0`}
                />
              ) : (
                <FaEye
                  onClick={() =>
                    setShowPassword(true)
                  }
                  className={`cursor-pointer ${AUTH_INPUT_ICON_CLASS} mr-0`}
                />
              )}
            </div>

            {/* PASSWORD RULES UI */}
            <div className="text-xs text-muted pl-1">
              {[
                "8+ chars",
                "Uppercase",
                "Lowercase",
                "Number",
                "Special char",
              ].map((text, i) => (
                <span
                  key={i}
                  className={`
                    mr-2
                    ${
                      [
                        passwordRules.length,
                        passwordRules.uppercase,
                        passwordRules.lowercase,
                        passwordRules.number,
                        passwordRules.special,
                      ][i]
                        ? "text-green-700 font-medium theme-dark:text-green-400"
                        : ""
                    }
                  `}
                >
                  • {text}
                </span>
              ))}
            </div>

            {/* CONFIRM PASSWORD */}
            <div className={AUTH_INPUT_WRAPPER_CLASS}>

              <FaLock className={AUTH_INPUT_ICON_CLASS} />

              <input
                type={
                  showConfirmPassword
                    ? "text"
                    : "password"
                }
                value={confirmPassword}
                onChange={(e) =>
                  setConfirmPassword(
                    e.target.value
                  )
                }
                placeholder="Confirm Password"
                className={AUTH_INPUT_CLASS}
              />

              {showConfirmPassword ? (
                <FaEyeSlash
                  onClick={() =>
                    setShowConfirmPassword(false)
                  }
                  className={`cursor-pointer ${AUTH_INPUT_ICON_CLASS} mr-0`}
                />
              ) : (
                <FaEye
                  onClick={() =>
                    setShowConfirmPassword(true)
                  }
                  className={`cursor-pointer ${AUTH_INPUT_ICON_CLASS} mr-0`}
                />
              )}
            </div>

          </div>

          {/* BUTTON */}
          <button
            onClick={
              handleResetPassword
            }
            disabled={
              loading ||
              !isPasswordValid
            }
            className={`${AUTH_SUBMIT_BTN_CLASS} mt-6`}
          >
            {loading
              ? "RESETTING..."
              : "RESET PASSWORD"}
          </button>

        </div>

      </div>
    </div>
  );
}