"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
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

const inter = Inter({
  subsets: ["latin"],
});

export default function LoginPage() {
  const router = useRouter();
  const [verified, setVerified] = useState<string | null>(null);

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
  const { toasts, removeToast, showError, showSuccess } = useToast();
  const [error, setError] =
    useState("");

  // =========================
  // LOAD REMEMBERED EMAIL
  // =========================
  useEffect(() => {
    const savedEmail =
      localStorage.getItem("rememberedEmail");

    const remembered =
      localStorage.getItem("rememberMe");

    // if (
    //   savedEmail &&
    //   remembered === "true"
    // ) {
    //   // setEmail(savedEmail);
    //   // setRememberMe(true);
    // } else {
    //   setRememberMe(false);
    // }

    const params = new URLSearchParams(window.location.search);
    setVerified(params.get("verified"));
  }, []);
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

  // =========================
  // LOGIN
  // =========================
  const handleLogin = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

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
      if (
        data.user?.role === "admin"
      ) {
        window.location.href =
          "/admin/dashboard";
      } else {
        window.location.href =
          "/dashboard";
      }
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
          <div className="flex w-full items-center justify-start px-4 py-6 sm:px-6 md:px-10 lg:w-1/2 lg:pl-16 lg:pr-[15%]">
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
                <div className="mt-4 rounded-lg border border-green-500/50 bg-green-500/20 px-4 py-3 text-sm text-green-300">
                  Email verified successfully. Please login.
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
                      className="cursor-pointer accent-blue-500"
                    />

                    Remember me
                  </label>

                  <button
                    type="button"
                    onClick={() =>
                      router.push(
                        "/forgot"
                      )
                    }
                    className={AUTH_LINK_CLASS}
                  >
                    Forgot Password?
                  </button>
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
              <Link href="/register">
                <button
                  type="button"
                  className={AUTH_SECONDARY_BTN_CLASS}
                >
                  <HiOutlineUserGroup className="text-lg text-primary" />

                  <span>Register</span>
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}