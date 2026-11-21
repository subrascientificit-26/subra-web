"use client";

import Link from "next/link";
import { useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";

import { Inter } from "next/font/google";

import {
  FaUser,
  FaLock,
  FaEye,
  FaEyeSlash,
  FaFlask,
  FaHeadset,
  FaShieldAlt,
} from "react-icons/fa";

import { HiOutlineUserGroup } from "react-icons/hi2";
import { ToastContainer } from "@/components/Toast";
import { useToast } from "@/lib/useToast";
import AuthPageBranding from "@/components/AuthPageBranding";
import ThemeToggle from "@/components/ThemeToggle";
import { ROUTES } from "@/lib/routes";
import {
  AUTH_CARD_ACCENT_LINE_CLASS,
  AUTH_CARD_CLASS,
  AUTH_CARD_ICON_WRAPPER_CLASS,
  AUTH_CARD_SUBTITLE_CLASS,
  AUTH_CARD_TITLE_CLASS,
  AUTH_DIVIDER_LINE_CLASS,
  AUTH_DIVIDER_TEXT_CLASS,
  AUTH_FEATURE_ICON_CLASS,
  AUTH_FEATURE_ICON_WRAPPER_CLASS,
  AUTH_FEATURE_LABEL_CLASS,
  AUTH_INPUT_CLASS,
  AUTH_INPUT_ICON_CLASS,
  AUTH_INPUT_WRAPPER_CLASS,
  AUTH_LEFT_PANEL_CLASS,
  AUTH_LINK_CLASS,
  AUTH_OVERLAY_CLASS,
  AUTH_REMEMBER_LABEL_CLASS,
  AUTH_SECONDARY_BTN_CLASS,
  AUTH_SUBMIT_BTN_CLASS,
  AUTH_SUBTITLE_CLASS,
  AUTH_ACCENT_LINE_CLASS,
} from "@/lib/authPageStyles";

const emptySubscribe = () => () => {};

const inter = Inter({
  subsets: ["latin"],
});

export default function LoginPage() {
  const router = useRouter();
  const searchString = useSyncExternalStore(
    emptySubscribe,
    () => window.location.search,
    () => ""
  );
  const urlSearchParams = new URLSearchParams(searchString);
  const verified = urlSearchParams.get("verified");
  const registered = urlSearchParams.get("registered");
  const registeredEmail = urlSearchParams.get("email") || "";
  const urlError = urlSearchParams.get("error");

  const [showPassword, setShowPassword] =
    useState(false);
  const [rememberMe, setRememberMe] =
    useState(false);

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [loading, setLoading] =
    useState(false);
  const [needsVerification, setNeedsVerification] =
    useState(false);
  const [resendingVerification, setResendingVerification] =
    useState(false);
  const [resendFeedback, setResendFeedback] =
    useState<{ type: "success" | "error"; text: string } | null>(null);
  const { toasts, removeToast, showError, showSuccess } = useToast();

  // =========================
  // VALIDATION
  // =========================
  const validate = () => {
    // clear previous success state

    if (!email || !password) {
      showError(
        "Email and password are required"
      );
      return false;
    }

    const emailRegex =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      showError(
        "Enter a valid email address"
      );
      return false;
    }

    if (password.length < 8) {
      showError(
        "Password must be at least 8 characters"
      );
      return false;
    }

    if (!/[A-Z]/.test(password)) {
      showError(
        "Password must contain at least one uppercase letter"
      );
      return false;
    }

    return true;
  };

  const handleResendVerification = async (targetEmail: string) => {
    const cleanEmail = targetEmail.trim().toLowerCase();
    if (!cleanEmail) {
      const msg = "Enter your email address above first, then click Resend.";
      setResendFeedback({ type: "error", text: msg });
      showError(msg);
      return;
    }

    setResendingVerification(true);
    setResendFeedback(null);
    try {
      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cleanEmail }),
      });

      const data = await res.json();
      if (!res.ok) {
        const msg = data.error || "Failed to resend verification email";
        setResendFeedback({ type: "error", text: msg });
        showError(msg);
        return;
      }

      const msg =
        data.message ||
        `Verification email sent to ${cleanEmail}. Check Inbox and Spam.`;
      setResendFeedback({ type: "success", text: msg });
      showSuccess(msg);
    } catch {
      const msg = "Could not resend verification email. Please try again.";
      setResendFeedback({ type: "error", text: msg });
      showError(msg);
    } finally {
      setResendingVerification(false);
    }
  };

  // =========================
  // LOGIN
  // =========================
  const handleLogin = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();
    setNeedsVerification(false);

    if (!validate()) return;

    setLoading(true);

    try {
      const res = await fetch(
        "/api/auth/login",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            email,
            password,
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        if (data.code === "EMAIL_NOT_VERIFIED") {
          setNeedsVerification(true);
        }
        showError(
          data.error || "Login failed"
        );

        setLoading(false);
        return;
      }

      // =========================
      // CLEAR OLD TOKENS
      // =========================
      localStorage.removeItem(
        "token"
      );

      sessionStorage.removeItem(
        "token"
      );

      // =========================
      // REMEMBER ME
      // =========================
      if (rememberMe) {
        localStorage.setItem(
          "rememberedEmail",
          email
        );

        localStorage.setItem(
          "rememberMe",
          "true"
        );

        // Permanent login
        if (data.token) {
          localStorage.setItem(
            "token",
            data.token
          );
        }
      } else {
        localStorage.removeItem(
          "rememberedEmail"
        );

        localStorage.removeItem(
          "rememberMe"
        );

        // Temporary login
        if (data.token) {
          sessionStorage.setItem(
            "token",
            data.token
          );
        }
      }

      // =========================
      // REDIRECT
      // =========================
      const targetRoute =
        data.user?.role === "admin"
          ? ROUTES.admin.dashboard
          : ROUTES.dashboard;
      router.replace(targetRoute);
      router.refresh();
    } catch (err) {
      console.error(
        "Login error:",
        err
      );

      showError(
        "Something went wrong. Please try again."
      );

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

      {/* Main */}
      <div className="relative z-10 flex min-h-screen flex-col">
        <div className="flex flex-1 flex-col lg:flex-row">
          {/* LEFT */}
          <div className="flex w-full items-center justify-start px-4 pt-14 pb-6 sm:px-6 sm:pt-16 md:px-10 lg:w-1/2 lg:pt-6 lg:pl-16 lg:pr-[15%]">
            <div className={AUTH_LEFT_PANEL_CLASS}>
              <AuthPageBranding />

              <h2 className="text-[24px] font-semibold leading-tight sm:text-[30px] lg:text-[40px]">
                Your Trusted Partner in
                Scientific Solutions
              </h2>

              <div className={AUTH_ACCENT_LINE_CLASS} />

              <p className={AUTH_SUBTITLE_CLASS}>
                Explore our extensive
                range of high-quality
                specialty chemicals,
                laboratory reagents,
                instruments and lab
                consumables.
              </p>

              <div className="mt-8 flex flex-col gap-6 sm:grid sm:grid-cols-3 sm:gap-5">
                <div className="flex flex-col items-center text-center">
                  <div className={AUTH_FEATURE_ICON_WRAPPER_CLASS}>
                    <FaShieldAlt className={AUTH_FEATURE_ICON_CLASS} />
                  </div>

                  <p className={AUTH_FEATURE_LABEL_CLASS}>
                    Quality Assured
                  </p>
                </div>

                <div className="flex flex-col items-center text-center">
                  <div className={AUTH_FEATURE_ICON_WRAPPER_CLASS}>
                    <FaFlask className={AUTH_FEATURE_ICON_CLASS} />
                  </div>

                  <p className={AUTH_FEATURE_LABEL_CLASS}>
                    Wide Range
                  </p>
                </div>

                <div className="flex flex-col items-center text-center">
                  <div className={AUTH_FEATURE_ICON_WRAPPER_CLASS}>
                    <FaHeadset className={AUTH_FEATURE_ICON_CLASS} />
                  </div>

                  <p className={AUTH_FEATURE_LABEL_CLASS}>
                    Reliable Support
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT */}
          <div className="flex w-full items-center justify-center px-4 py-6 lg:w-1/2 lg:px-8">
            <div className={AUTH_CARD_CLASS}>
              <div className="mb-4 flex justify-center">
                <div className={AUTH_CARD_ICON_WRAPPER_CLASS}>
                  <FaUser className="text-2xl text-primary" />
                </div>
              </div>

              <h2 className={AUTH_CARD_TITLE_CLASS}>
                Welcome Back!
              </h2>

              <p className={AUTH_CARD_SUBTITLE_CLASS}>
                Please sign in to access your account
              </p>

              <div className={AUTH_CARD_ACCENT_LINE_CLASS} />

              {verified === "true" && (
                <div className="mt-4 rounded-lg border border-green-600/40 bg-green-500/15 px-4 py-3 text-sm text-green-800 theme-dark:border-green-500/50 theme-dark:bg-green-500/20 theme-dark:text-green-300">
                  Email verified successfully. Please login.
                </div>
              )}

              {registered === "true" && (
                <div className="mt-4 space-y-2 rounded-lg border border-blue-600/40 bg-blue-500/15 px-4 py-3 text-sm text-blue-900 theme-dark:border-blue-400/50 theme-dark:bg-blue-500/20 theme-dark:text-blue-200">
                  <p>
                    Registration successful! We sent a verification link
                    {registeredEmail ? (
                      <>
                        {" "}
                        to <strong className="break-all">{registeredEmail}</strong>
                      </>
                    ) : null}
                    . Please check both your <strong>Inbox</strong> and{" "}
                    <strong>Spam / Updates</strong> folder before logging in.
                  </p>
                  <button
                    type="button"
                    disabled={resendingVerification}
                    onClick={() => handleResendVerification(email || registeredEmail)}
                    className="inline-flex items-center rounded-md border border-blue-700/40 bg-blue-600/15 px-3 py-1.5 text-xs font-semibold text-blue-900 transition hover:bg-blue-600/25 disabled:opacity-50 theme-dark:border-blue-300/40 theme-dark:text-blue-100"
                  >
                    {resendingVerification ? "Sending..." : "Didn't receive it? Resend Email"}
                  </button>
                </div>
              )}

              {needsVerification && (
                <div className="mt-4 space-y-2 rounded-lg border border-amber-600/40 bg-amber-500/15 px-4 py-3 text-sm text-amber-900 theme-dark:border-amber-400/50 theme-dark:bg-amber-500/20 theme-dark:text-amber-200">
                  <p>
                    Your email is not verified yet. Check your Inbox &amp; Spam folder, or resend the verification link.
                  </p>
                  <button
                    type="button"
                    disabled={resendingVerification}
                    onClick={() => handleResendVerification(email || registeredEmail)}
                    className="inline-flex items-center rounded-md border border-amber-700/40 bg-amber-600/20 px-3 py-1.5 text-xs font-semibold text-amber-900 transition hover:bg-amber-600/30 disabled:opacity-50 theme-dark:border-amber-300/40 theme-dark:text-amber-100"
                  >
                    {resendingVerification ? "Sending..." : "Resend Verification Email"}
                  </button>
                </div>
              )}

              {urlError && (
                <div className="mt-4 space-y-2 rounded-lg border border-red-600/40 bg-red-500/15 px-4 py-3 text-sm text-red-800 theme-dark:border-red-500/50 theme-dark:bg-red-500/20 theme-dark:text-red-300">
                  <p>
                    {urlError === "token-expired"
                      ? "Your verification link has expired. Enter your email below and resend a new verification link."
                      : urlError === "invalid-token"
                        ? "Invalid verification link. Enter your email below to resend a new verification email."
                        : "Could not verify email. Please try again."}
                  </p>
                  {(urlError === "token-expired" || urlError === "invalid-token") && (
                    <button
                      type="button"
                      disabled={resendingVerification}
                      onClick={() => handleResendVerification(email || registeredEmail)}
                      className="inline-flex items-center rounded-md border border-red-700/40 bg-red-600/15 px-3 py-1.5 text-xs font-semibold text-red-900 transition hover:bg-red-600/25 disabled:opacity-50 theme-dark:border-red-400/40 theme-dark:text-red-200"
                    >
                      {resendingVerification ? "Sending..." : "Resend Verification Email"}
                    </button>
                  )}
                </div>
              )}

              {resendFeedback && (
                <div
                  className={`mt-4 rounded-lg border px-4 py-3 text-sm ${
                    resendFeedback.type === "success"
                      ? "border-green-600/40 bg-green-500/15 text-green-800 theme-dark:border-green-500/50 theme-dark:bg-green-500/20 theme-dark:text-green-300"
                      : "border-red-600/40 bg-red-500/15 text-red-800 theme-dark:border-red-500/50 theme-dark:bg-red-500/20 theme-dark:text-red-300"
                  }`}
                >
                  {resendFeedback.text}
                </div>
              )}

              <ToastContainer toasts={toasts} onClose={removeToast} />

              <form onSubmit={handleLogin}>
                <div className="mt-5 space-y-3">
                  {/* EMAIL */}
                  <div className={AUTH_INPUT_WRAPPER_CLASS}>
                    <FaUser className={AUTH_INPUT_ICON_CLASS} />

                    <input
                      type="email"
                      placeholder="Email Address"
                      value={email}
                      onChange={(e) =>
                        setEmail(
                          e.target.value
                        )
                      }
                      required
                      className={AUTH_INPUT_CLASS}
                    />
                  </div>

                  {/* PASSWORD */}
                  <div className={AUTH_INPUT_WRAPPER_CLASS}>
                    <FaLock className={AUTH_INPUT_ICON_CLASS} />

                    <input
                      type={
                        showPassword
                          ? "text"
                          : "password"
                      }
                      placeholder="Password"
                      value={password}
                      onChange={(e) =>
                        setPassword(
                          e.target.value
                        )
                      }
                      required
                      className={AUTH_INPUT_CLASS}
                    />

                    {showPassword ? (
                      <FaEyeSlash
                        onClick={() =>
                          setShowPassword(
                            false
                          )
                        }
                        className={`cursor-pointer ${AUTH_INPUT_ICON_CLASS} mr-0`}
                      />
                    ) : (
                      <FaEye
                        onClick={() =>
                          setShowPassword(
                            true
                          )
                        }
                        className={`cursor-pointer ${AUTH_INPUT_ICON_CLASS} mr-0`}
                      />
                    )}
                  </div>
                </div>

                {/* OPTIONS */}
                <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <label className={AUTH_REMEMBER_LABEL_CLASS}>
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) =>
                        setRememberMe(
                          e.target.checked
                        )
                      }
                      className="cursor-pointer accent-primary"
                    />

                    Remember me
                  </label>

                  <Link
                    href={ROUTES.forgotPassword}
                    className={AUTH_LINK_CLASS}
                  >
                    Forgot Password?
                  </Link>
                </div>

                {/* LOGIN */}
                <button
                  type="submit"
                  disabled={loading}
                  className={AUTH_SUBMIT_BTN_CLASS}
                >
                  {loading ? "LOGGING IN..." : "LOGIN"}
                </button>
              </form>

              {/* DIVIDER */}
              <div className="my-5 flex items-center">
                <div className={AUTH_DIVIDER_LINE_CLASS} />

                <span className={AUTH_DIVIDER_TEXT_CLASS}>
                  OR
                </span>

                <div className={AUTH_DIVIDER_LINE_CLASS} />
              </div>

              {/* REGISTER */}
              <Link
                href={ROUTES.register}
                className={AUTH_SECONDARY_BTN_CLASS}
              >
                <HiOutlineUserGroup className="text-lg text-primary" />

                <span>Register</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}