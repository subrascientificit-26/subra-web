"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Inter } from "next/font/google";
import { toast } from "sonner";
import {
  FaUser,
  FaLock,
  FaEye,
  FaEyeSlash,
  FaFlask,
  FaHeadset,
  FaShieldAlt,
} from "react-icons/fa";
import { ToastContainer } from "@/components/Toast";
import { useToast } from "@/lib/useToast";
import AuthPageBranding from "@/components/AuthPageBranding";
import CaptchaField from "@/components/CaptchaField";
import { ROUTES } from "@/lib/routes";
import ThemeToggle from "@/components/ThemeToggle";
import {
  AUTH_ACCENT_LINE_CLASS,
  AUTH_CARD_ACCENT_LINE_CLASS,
  AUTH_CARD_CLASS,
  AUTH_CARD_ICON_WRAPPER_CLASS,
  AUTH_CARD_SUBTITLE_CLASS,
  AUTH_CARD_TITLE_CLASS,
  AUTH_FEATURE_ICON_CLASS,
  AUTH_FEATURE_ICON_WRAPPER_CLASS,
  AUTH_FEATURE_LABEL_CLASS,
  AUTH_FOOTER_TEXT_CLASS,
  AUTH_INPUT_CLASS,
  AUTH_INPUT_ICON_CLASS,
  AUTH_INPUT_WRAPPER_CLASS,
  AUTH_LEFT_PANEL_CLASS,
  AUTH_LINK_CLASS,
  AUTH_OVERLAY_CLASS,
  AUTH_SUBMIT_BTN_CLASS,
  AUTH_SUBTITLE_CLASS,
} from "@/lib/authPageStyles";


const inter = Inter({
  subsets: ["latin"],
});

export default function RegisterPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [captchaToken, setCaptchaToken] = useState("");
  const [captchaAnswer, setCaptchaAnswer] = useState("");
  const [captchaError, setCaptchaError] = useState("");
  const [captchaRefreshKey, setCaptchaRefreshKey] = useState(0);
  const { toasts, removeToast, showError } = useToast();
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const passwordRules = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
  };

  const isPasswordValid =
    passwordRules.length &&
    passwordRules.uppercase &&
    passwordRules.lowercase &&
    passwordRules.number &&
    passwordRules.special;

  const validate = () => {
    if (!email || !password || !confirmPassword) {
      showError("All fields are required");
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showError("Enter a valid email address");
      return false;
    }

    if (!isPasswordValid) {
      showError(
        "Password must be 8+ chars with uppercase, lowercase, number & special character"
      );
      return false;
    }

    if (password !== confirmPassword) {
      showError("Passwords do not match");
      return false;
    }

    if (!captchaAnswer.trim()) {
      const msg = "Please enter the CAPTCHA code.";
      setCaptchaError(msg);
      showError(msg);
      return false;
    }

    return true;
  };

  const handleRegister = async () => {
    setFormError("");
    setCaptchaError("");
    if (!validate()) return;

    try {
      setLoading(true);
      const normalizedEmail = email.trim().toLowerCase();

      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: normalizedEmail,
          password,
          captchaToken,
          captchaAnswer: captchaAnswer.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        const message = data.error || "Registration failed";
        if (data.code === "CAPTCHA_INVALID") {
          setCaptchaError(message);
        }
        setCaptchaAnswer("");
        setCaptchaRefreshKey((prev) => prev + 1);
        setFormError(message);
        showError(message);
        return;
      }

      toast.success(
        data.message ||
          "Registration successful! Please check your inbox and spam folder to verify your email."
      );
      setEmail("");
      setPassword("");
      setConfirmPassword("");
      setCaptchaAnswer("");
      setCaptchaRefreshKey((prev) => prev + 1);
      router.push(
        `${ROUTES.login}?registered=true&email=${encodeURIComponent(normalizedEmail)}`
      );
    } catch {
      const message = "Server error. Please try again";
      setCaptchaAnswer("");
      setCaptchaRefreshKey((prev) => prev + 1);
      setFormError(message);
      showError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`${inter.className} relative min-h-screen bg-cover bg-center`}
      style={{
        backgroundImage: "url('/Lab-test.jpg')",
      }}
    >
      <div className={AUTH_OVERLAY_CLASS} />

      <div className="absolute right-4 top-4 z-20">
        <ThemeToggle />
      </div>

      <div className="relative z-10 flex min-h-screen flex-col">
        <div className="flex flex-1 flex-col lg:flex-row">

          {/* LEFT SIDE (UNCHANGED) */}
          <div className="flex w-full items-center justify-start px-4 pt-14 pb-6 sm:px-6 sm:pt-16 md:px-10 lg:w-1/2 lg:px-0 lg:pt-6 lg:pl-16 lg:pr-[15%]">
            <div className={AUTH_LEFT_PANEL_CLASS}>

              <AuthPageBranding />

              <h2 className="text-[24px] font-semibold leading-tight sm:text-[30px] lg:text-[40px]">
                Your Trusted Partner in Scientific Solutions
              </h2>

              <div className={AUTH_ACCENT_LINE_CLASS} />

              <p className={AUTH_SUBTITLE_CLASS}>
                Explore our extensive range of high-quality specialty chemicals, laboratory reagents, instruments and lab consumables.
              </p>

              {/* FEATURES (UNCHANGED) */}
              <div className="mt-8 flex flex-col gap-6 sm:grid sm:grid-cols-3 sm:gap-5">

                <div className="flex flex-col items-center text-center">
                  <div className={AUTH_FEATURE_ICON_WRAPPER_CLASS}>
                    <FaShieldAlt className={AUTH_FEATURE_ICON_CLASS} />
                  </div>
                  <p className={AUTH_FEATURE_LABEL_CLASS}>Quality Assured</p>
                </div>

                <div className="flex flex-col items-center text-center">
                  <div className={AUTH_FEATURE_ICON_WRAPPER_CLASS}>
                    <FaFlask className={AUTH_FEATURE_ICON_CLASS} />
                  </div>
                  <p className={AUTH_FEATURE_LABEL_CLASS}>Wide Range</p>
                </div>

                <div className="flex flex-col items-center text-center">
                  <div className={AUTH_FEATURE_ICON_WRAPPER_CLASS}>
                    <FaHeadset className={AUTH_FEATURE_ICON_CLASS} />
                  </div>
                  <p className={AUTH_FEATURE_LABEL_CLASS}>Reliable Support</p>
                </div>

              </div>
            </div>
          </div>

          {/* RIGHT SIDE */}
          <div className="flex w-full items-center justify-center px-4 py-6 lg:w-1/2 lg:px-8">
            <div className={AUTH_CARD_CLASS}>

              <div className="mb-4 flex justify-center">
                <div className={AUTH_CARD_ICON_WRAPPER_CLASS}>
                  <FaUser className="text-2xl text-primary" />
                </div>
              </div>

              <h2 className={AUTH_CARD_TITLE_CLASS}>
                Create Account
              </h2>

              <p className={AUTH_CARD_SUBTITLE_CLASS}>
                Register to get started
              </p>

              <div className={AUTH_CARD_ACCENT_LINE_CLASS} />

              {formError && (
                <div className="mt-4 rounded-lg border border-red-600/40 bg-red-500/15 px-4 py-3 text-sm text-red-800 theme-dark:border-red-500/50 theme-dark:bg-red-500/20 theme-dark:text-red-300">
                  {formError}
                </div>
              )}

              <ToastContainer toasts={toasts} onClose={removeToast} />

              <div className="mt-5 space-y-3">

                {/* EMAIL */}
                <div className={AUTH_INPUT_WRAPPER_CLASS}>
                  <FaUser className={AUTH_INPUT_ICON_CLASS} />
                  <input
                    type="email"
                    placeholder="Email Address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={AUTH_INPUT_CLASS}
                  />
                </div>

                {/* PASSWORD */}
                <div className={AUTH_INPUT_WRAPPER_CLASS}>
                  <FaLock className={AUTH_INPUT_ICON_CLASS} />
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={AUTH_INPUT_CLASS}
                  />

                  {showPassword ? (
                    <FaEyeSlash
                      onClick={() => setShowPassword(false)}
                      className={`cursor-pointer ${AUTH_INPUT_ICON_CLASS} mr-0`}
                    />
                  ) : (
                    <FaEye
                      onClick={() => setShowPassword(true)}
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
                    <span key={i} className={`
                        mr-2
                        ${[
                        passwordRules.length,
                        passwordRules.uppercase,
                        passwordRules.lowercase,
                        passwordRules.number,
                        passwordRules.special,
                      ][i] ? "text-green-700 font-medium theme-dark:text-green-400" : ""}
                      `}>
                      • {text}
                    </span>
                  ))}
                </div>

                {/* CONFIRM PASSWORD */}
                <div className={AUTH_INPUT_WRAPPER_CLASS}>
                  <FaLock className={AUTH_INPUT_ICON_CLASS} />
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm Password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={AUTH_INPUT_CLASS}
                  />

                  {showConfirmPassword ? (
                    <FaEyeSlash
                      onClick={() => setShowConfirmPassword(false)}
                      className={`cursor-pointer ${AUTH_INPUT_ICON_CLASS} mr-0`}
                    />
                  ) : (
                    <FaEye
                      onClick={() => setShowConfirmPassword(true)}
                      className={`cursor-pointer ${AUTH_INPUT_ICON_CLASS} mr-0`}
                    />
                  )}
                </div>

                {/* CAPTCHA */}
                <CaptchaField
                  value={captchaAnswer}
                  onChange={(val) => {
                    setCaptchaAnswer(val);
                    if (captchaError) setCaptchaError("");
                  }}
                  onTokenChange={setCaptchaToken}
                  refreshTrigger={captchaRefreshKey}
                  error={captchaError}
                  compact
                  disabled={loading}
                />

              </div>

              {/* BUTTON */}
              <button
                onClick={handleRegister}
                disabled={loading || !isPasswordValid}
                className={`${AUTH_SUBMIT_BTN_CLASS} mt-5`}
              >
                {loading ? "REGISTERING..." : "REGISTER"}
              </button>

              <p className={AUTH_FOOTER_TEXT_CLASS}>
                Already have an account?{" "}
                <Link href="/login" className={AUTH_LINK_CLASS}>
                  Login
                </Link>
              </p>

            </div>
          </div>

        </div>
      </div>
    </div>
  );
}