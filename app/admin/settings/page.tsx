"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { CreditCard, LayoutGrid, Mail, Moon, Palette, Settings, Share2, Sun, User } from "lucide-react";
import AdminListLayout from "@/components/admin/AdminListLayout";
import ProfileImageCrop from "@/components/admin/ProfileImageCrop";
import SimpleImageUpload from "@/components/admin/SimpleImageUpload";
import {
  AdminCheckbox,
  AdminFormActions,
  AdminInput,
  AdminTextarea,
} from "@/components/admin/AdminFields";
import { ToastContainer } from "@/components/Toast";
import { useToast } from "@/lib/useToast";
import {
  createEmptySettingsMap,
  GENERAL_SETTING_KEYS,
  PAYMENT_SETTING_KEYS,
  pickSettings,
  SETTING_KEYS,
  SMTP_SETTING_KEYS,
  WIDGET_SETTING_KEYS,
  type SettingsTab,
} from "@/lib/settings";
import { invalidateSiteSettingsCache } from "@/lib/hooks/useSiteSettings";
import { setStoredTheme, type ThemeMode } from "@/lib/theme";
import { persistThemeSetting } from "@/lib/persistThemeSetting";
import {
  type FieldErrors,
  validateGeneralSettings,
  validatePaymentSettings,
  validateProfileForm,
  validateSmtpSettings,
  validateSocialSettings,
  validateWidgetSettings,
  buildWidgetSettingsPayload,
  buildSocialSettingsPayload,
  parseSocialSettingsState,
  parseWidgetSettingsState,
} from "@/lib/profileValidation";
import WidgetCardEditor from "@/components/admin/WidgetCardEditor";
import SocialLinkEditor from "@/components/admin/SocialLinkEditor";
import type { WidgetCard } from "@/lib/widgetCards";
import type { SocialLink } from "@/lib/socialLinks";
import { validateEmail } from "@/lib/validators";
import {
  DEFAULT_HERO_CARDS,
  DEFAULT_SERVICE_CARDS,
} from "@/lib/widgetCards";

const TABS: { id: SettingsTab; label: string; icon: typeof User }[] = [
  { id: "general", label: "General", icon: Settings },
  { id: "profile", label: "Profile", icon: User },
  { id: "smtp", label: "SMTP", icon: Mail },
  { id: "payment", label: "Payment", icon: CreditCard },
  { id: "widget", label: "Widget", icon: LayoutGrid },
  { id: "social", label: "Social Media", icon: Share2 },
];

const emptyProfile = {
  name: "",
  email: "",
  role: "",
  profile: "",
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
};

const emptyPayment = createEmptySettingsMap(PAYMENT_SETTING_KEYS);
const emptySmtp = createEmptySettingsMap(SMTP_SETTING_KEYS);
const emptyWidget = createEmptySettingsMap(WIDGET_SETTING_KEYS);
const emptyGeneral = createEmptySettingsMap(GENERAL_SETTING_KEYS);

function applyApiErrors(data: { errors?: FieldErrors }, fallback = "Save failed") {
  if (data.errors && Object.keys(data.errors).length > 0) {
    return data.errors;
  }
  throw new Error(fallback);
}

function AdminThemeToggle({
  value,
  error,
  onChange,
}: {
  value: ThemeMode;
  error?: string;
  onChange: (value: ThemeMode) => void;
}) {
  const isDark = value === "dark";

  return (
    <div>
      <p className="mb-2 block text-xs font-semibold uppercase tracking-wider text-muted">
        Theme Mode
      </p>
      <div
        className="inline-flex h-11 items-center rounded-xl border border-border bg-surface-elevated p-1"
        role="group"
        aria-label="Theme mode"
      >
        <button
          type="button"
          onClick={() => onChange("light")}
          className={`flex h-9 items-center gap-2 rounded-lg px-4 text-sm font-medium transition ${!isDark
              ? "bg-primary text-white"
              : "text-muted hover:text-foreground"
            }`}
        >
          <Sun size={16} />
          Light
        </button>
        <button
          type="button"
          onClick={() => onChange("dark")}
          className={`flex h-9 items-center gap-2 rounded-lg px-4 text-sm font-medium transition ${isDark
              ? "bg-primary text-white"
              : "text-muted hover:text-foreground"
            }`}
        >
          <Moon size={16} />
          Dark
        </button>
      </div>
      {error ? <p className="mt-1.5 text-[11px] font-medium text-red-600 theme-dark:text-red-400">{error}</p> : null}
    </div>
  );
}

function AdminColorInput({
  label,
  value,
  error,
  onChange,
}: {
  label: string;
  value: string;
  error?: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <p className="mb-2 block text-xs font-semibold uppercase tracking-wider text-muted">
        {label}
      </p>
      <div className="flex items-center gap-3">
        <input
          type="color"
          value={value || "#000000"}
          onChange={(event) => onChange(event.target.value)}
          className="h-10 w-14 cursor-pointer rounded-lg border border-border bg-surface-elevated p-1"
        />
        <input
          type="text"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="#0b5cff"
          className={`min-w-0 flex-1 rounded-xl border border-border bg-surface-elevated px-3 py-2.5 text-sm text-foreground outline-none transition focus:border-primary ${error ? "border-red-500 focus:border-red-500" : ""
            }`}
        />
      </div>
      {error ? <p className="mt-1.5 text-[11px] font-medium text-red-600 theme-dark:text-red-400">{error}</p> : null}
    </div>
  );
}

const emptySubscribe = () => () => {};

export default function AdminSettingsPage() {
  const urlSearch = useSyncExternalStore(
    emptySubscribe,
    () => window.location.search,
    () => ""
  );
  const [selectedTab, setSelectedTab] = useState<SettingsTab | null>(null);
  const tabParam = new URLSearchParams(urlSearch).get("tab");
  const urlTab: SettingsTab =
    tabParam === "profile" ||
    tabParam === "payment" ||
    tabParam === "general" ||
    tabParam === "smtp" ||
    tabParam === "widget" ||
    tabParam === "social"
      ? tabParam
      : "general";
  const activeTab = selectedTab ?? urlTab;
  const setActiveTab = setSelectedTab;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testingSmtp, setTestingSmtp] = useState(false);
  const [smtpTestEmail, setSmtpTestEmail] = useState("");
  const [smtpTestStatus, setSmtpTestStatus] = useState<{
    type: "success" | "error";
    text: string;
    detail?: string;
  } | null>(null);
  const [smtpExplicitlyDisabled, setSmtpExplicitlyDisabled] = useState(false);
  const [profile, setProfile] = useState(emptyProfile);
  const [payment, setPayment] = useState(emptyPayment);
  const [smtp, setSmtp] = useState(emptySmtp);
  const [widget, setWidget] = useState(emptyWidget);
  const [heroCards, setHeroCards] = useState<WidgetCard[]>(DEFAULT_HERO_CARDS);
  const [serviceCards, setServiceCards] = useState<WidgetCard[]>(
    DEFAULT_SERVICE_CARDS
  );
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);
  const [general, setGeneral] = useState(emptyGeneral);
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [profileImagePreview, setProfileImagePreview] = useState("");
  const [removeProfileImage, setRemoveProfileImage] = useState(false);
  const [siteLogoFile, setSiteLogoFile] = useState<File | null>(null);
  const [siteLogoPreview, setSiteLogoPreview] = useState("");
  const [removeSiteLogo, setRemoveSiteLogo] = useState(false);
  const [faviconFile, setFaviconFile] = useState<File | null>(null);
  const [faviconPreview, setFaviconPreview] = useState("");
  const [removeFavicon, setRemoveFavicon] = useState(false);
  const [profileErrors, setProfileErrors] = useState<FieldErrors>({});
  const [paymentErrors, setPaymentErrors] = useState<FieldErrors>({});
  const [smtpErrors, setSmtpErrors] = useState<FieldErrors>({});
  const [widgetErrors, setWidgetErrors] = useState<FieldErrors>({});
  const [socialErrors, setSocialErrors] = useState<FieldErrors>({});
  const [generalErrors, setGeneralErrors] = useState<FieldErrors>({});
  const { toasts, removeToast, showError, showSuccess } = useToast();

  const DAYS = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];

  const [businessHours, setBusinessHours] = useState(
    DAYS.map(day => ({
      day,
      open: "",
      close: "",
    }))
  );

  const updateBusinessHour = (
    index: number,
    field: "open" | "close",
    value: string
  ) => {
    const updated = [...businessHours];

    updated[index] = {
      ...updated[index],
      [field]: value,
    };

    setBusinessHours(updated);

    updateGeneral(
      SETTING_KEYS.businessHours,
      JSON.stringify(updated)
    );
  };

  useEffect(() => {
    const handleThemeChange = (event: Event) => {
      const detail = (event as CustomEvent<ThemeMode>).detail;
      if (detail === "light" || detail === "dark") {
        setGeneral((prev) => ({
          ...prev,
          [SETTING_KEYS.themeMode]: detail,
        }));
      }
    };

    window.addEventListener("theme-change", handleThemeChange);
    return () => window.removeEventListener("theme-change", handleThemeChange);
  }, []);

  useEffect(() => {
    return () => {
      if (profileImagePreview.startsWith("blob:")) {
        URL.revokeObjectURL(profileImagePreview);
      }
      if (siteLogoPreview.startsWith("blob:")) {
        URL.revokeObjectURL(siteLogoPreview);
      }
      if (faviconPreview.startsWith("blob:")) {
        URL.revokeObjectURL(faviconPreview);
      }
    };
  }, [profileImagePreview, siteLogoPreview, faviconPreview]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [profileRes, settingsRes] = await Promise.all([
          fetch("/api/user/profile", { credentials: "include" }),
          fetch("/api/admin/settings", { credentials: "include" }),
        ]);

        const profileData = await profileRes.json();
        const settingsData = await settingsRes.json();

        if (!profileRes.ok) {
          throw new Error(profileData.error || "Failed to load profile");
        }

        if (!settingsRes.ok) {
          throw new Error(settingsData.error || "Failed to load settings");
        }

        setProfile((prev) => ({
          ...prev,
          name: profileData.name ?? "",
          email: profileData.email ?? "",
          role: profileData.role ?? "",
          profile: profileData.profile ?? "",
        }));
        setSmtpTestEmail((prev) => prev || profileData.email || "");

        setPayment({
          ...emptyPayment,
          ...pickSettings(settingsData, PAYMENT_SETTING_KEYS),
          [SETTING_KEYS.razorpayEnabled]:
            settingsData[SETTING_KEYS.razorpayEnabled] === "true" ? "true" : "false",
        });

        const hasSavedSmtpCreds = Boolean(
          settingsData[SETTING_KEYS.smtpHost]?.trim() ||
            settingsData[SETTING_KEYS.smtpUser]?.trim() ||
            settingsData[SETTING_KEYS.smtpPass]?.trim()
        );
        const loadedSmtpEnabled = settingsData[SETTING_KEYS.smtpEnabled] === "true";
        setSmtpExplicitlyDisabled(!loadedSmtpEnabled && hasSavedSmtpCreds);

        setSmtp({
          ...emptySmtp,
          ...pickSettings(settingsData, SMTP_SETTING_KEYS),
          [SETTING_KEYS.smtpSecure]:
            settingsData[SETTING_KEYS.smtpSecure] === "true" ? "true" : "false",
          [SETTING_KEYS.smtpEnabled]: loadedSmtpEnabled ? "true" : "false",
        });

        setWidget({
          ...emptyWidget,
          ...pickSettings(settingsData, WIDGET_SETTING_KEYS),
          [SETTING_KEYS.widgetShowHero]:
            settingsData[SETTING_KEYS.widgetShowHero] !== "false" ? "true" : "false",
          [SETTING_KEYS.widgetShowCategories]:
            settingsData[SETTING_KEYS.widgetShowCategories] !== "false" ? "true" : "false",
          [SETTING_KEYS.widgetShowServices]:
            settingsData[SETTING_KEYS.widgetShowServices] !== "false" ? "true" : "false",
          [SETTING_KEYS.widgetShowEnquiry]:
            settingsData[SETTING_KEYS.widgetShowEnquiry] !== "false" ? "true" : "false",
        });

        const widgetCards = parseWidgetSettingsState(settingsData);
        setHeroCards(widgetCards.heroCards);
        setServiceCards(widgetCards.serviceCards);

        setSocialLinks(parseSocialSettingsState(settingsData));

        setGeneral({
          ...emptyGeneral,
          ...pickSettings(settingsData, GENERAL_SETTING_KEYS),
          [SETTING_KEYS.themeMode]:
            settingsData[SETTING_KEYS.themeMode] === "light" ? "light" : "dark",
        });

        if (settingsData[SETTING_KEYS.businessHours]) {
          try {
            const parsedHours = JSON.parse(settingsData[SETTING_KEYS.businessHours]);
            if (Array.isArray(parsedHours)) {
              setBusinessHours(
                DAYS.map((day) => {
                  const found = parsedHours.find(
                    (entry: { day?: string; open?: string; close?: string }) =>
                      entry?.day === day
                  );
                  return {
                    day,
                    open: typeof found?.open === "string" ? found.open : "",
                    close: typeof found?.close === "string" ? found.close : "",
                  };
                })
              );
            }
          } catch {
            // Keep default empty business hours if stored JSON is invalid
          }
        }

        const serverTheme =
          settingsData[SETTING_KEYS.themeMode] === "light" ? "light" : "dark";
        setStoredTheme(serverTheme);
      } catch (error) {
        showError(error instanceof Error ? error.message : "Failed to load settings");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const handleProfileImageCropped = (file: File) => {
    if (profileImagePreview.startsWith("blob:")) {
      URL.revokeObjectURL(profileImagePreview);
    }
    setProfileImageFile(file);
    setProfileImagePreview(URL.createObjectURL(file));
    setRemoveProfileImage(false);
    setProfileErrors((prev) => {
      const next = { ...prev };
      delete next.profileImage;
      return next;
    });
  };

  const handleRemoveProfileImage = () => {
    if (profileImagePreview.startsWith("blob:")) {
      URL.revokeObjectURL(profileImagePreview);
    }
    setProfileImageFile(null);
    setProfileImagePreview("");
    setRemoveProfileImage(true);
  };

  const handleSiteLogoChange = (file: File | null) => {
    if (siteLogoPreview.startsWith("blob:")) {
      URL.revokeObjectURL(siteLogoPreview);
    }
    if (file) {
      setSiteLogoFile(file);
      setSiteLogoPreview(URL.createObjectURL(file));
      setRemoveSiteLogo(false);
    } else {
      setSiteLogoFile(null);
      setSiteLogoPreview("");
    }
  };

  const handleRemoveSiteLogo = () => {
    if (siteLogoPreview.startsWith("blob:")) {
      URL.revokeObjectURL(siteLogoPreview);
    }
    setSiteLogoFile(null);
    setSiteLogoPreview("");
    setRemoveSiteLogo(true);
  };

  const handleFaviconChange = (file: File | null) => {
    if (faviconPreview.startsWith("blob:")) {
      URL.revokeObjectURL(faviconPreview);
    }
    if (file) {
      setFaviconFile(file);
      setFaviconPreview(URL.createObjectURL(file));
      setRemoveFavicon(false);
    } else {
      setFaviconFile(null);
      setFaviconPreview("");
    }
  };

  const handleRemoveFavicon = () => {
    if (faviconPreview.startsWith("blob:")) {
      URL.revokeObjectURL(faviconPreview);
    }
    setFaviconFile(null);
    setFaviconPreview("");
    setRemoveFavicon(true);
  };

  const siteLogoDisplay = removeSiteLogo
    ? siteLogoPreview
    : siteLogoPreview || general[SETTING_KEYS.siteLogo];
  const faviconDisplay = removeFavicon
    ? faviconPreview
    : faviconPreview || general[SETTING_KEYS.favicon];

  const saveProfile = async (event: React.FormEvent) => {
    event.preventDefault();
    setProfileErrors({});

    const validation = validateProfileForm(profile);
    if (!validation.valid) {
      setProfileErrors(validation.errors);
      showError("Please fix the highlighted profile fields");
      return;
    }

    setSaving(true);
    try {
      const formData = new FormData();
      formData.append("name", profile.name.trim());
      if (profile.currentPassword) {
        formData.append("currentPassword", profile.currentPassword);
      }
      if (profile.newPassword) {
        formData.append("newPassword", profile.newPassword);
      }
      if (profileImageFile) {
        formData.append("profileImage", profileImageFile);
      }
      if (removeProfileImage) {
        formData.append("removeProfile", "true");
      }

      const res = await fetch("/api/user/profile", {
        method: "PUT",
        credentials: "include",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        const errors = applyApiErrors(data, data.error || "Failed to update profile");
        setProfileErrors(errors);
        showError(data.error || "Please fix the highlighted profile fields");
        return;
      }

      if (profileImagePreview.startsWith("blob:")) {
        URL.revokeObjectURL(profileImagePreview);
      }

      setProfile((prev) => ({
        ...prev,
        name: data.name ?? prev.name,
        profile: data.profile ?? "",
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      }));
      setProfileImageFile(null);
      setProfileImagePreview("");
      setRemoveProfileImage(false);
      window.dispatchEvent(new CustomEvent("profile-updated"));
      showSuccess("Profile updated successfully");
    } catch (error) {
      showError(error instanceof Error ? error.message : "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const saveGeneral = async (event: React.FormEvent) => {
    event.preventDefault();
    setGeneralErrors({});

    const validation = validateGeneralSettings(general);
    if (!validation.valid) {
      setGeneralErrors(validation.errors);
      showError("Please fix the highlighted general fields");
      return;
    }

    setSaving(true);
    try {
      const formData = new FormData();
      formData.append("settings", JSON.stringify(general));

      if (siteLogoFile) {
        formData.append("siteLogo", siteLogoFile);
      }
      if (removeSiteLogo) {
        formData.append("removeSiteLogo", "true");
      }
      if (faviconFile) {
        formData.append("favicon", faviconFile);
      }
      if (removeFavicon) {
        formData.append("removeFavicon", "true");
      }

      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        credentials: "include",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        const errors = applyApiErrors(data, data.error || "Failed to save settings");
        setGeneralErrors(errors);
        showError(data.error || "Please fix the highlighted fields");
        return;
      }

      if (siteLogoPreview.startsWith("blob:")) {
        URL.revokeObjectURL(siteLogoPreview);
      }
      if (faviconPreview.startsWith("blob:")) {
        URL.revokeObjectURL(faviconPreview);
      }

      setGeneral((prev) => ({
        ...prev,
        [SETTING_KEYS.siteLogo]: data[SETTING_KEYS.siteLogo] ?? "",
        [SETTING_KEYS.favicon]: data[SETTING_KEYS.favicon] ?? "",
      }));
      setSiteLogoFile(null);
      setSiteLogoPreview("");
      setRemoveSiteLogo(false);
      setFaviconFile(null);
      setFaviconPreview("");
      setRemoveFavicon(false);
      invalidateSiteSettingsCache();
      setStoredTheme(
        general[SETTING_KEYS.themeMode] === "light" ? "light" : "dark"
      );
      showSuccess("Settings saved successfully");
    } catch (error) {
      showError(error instanceof Error ? error.message : "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const savePayment = async (event: React.FormEvent) => {
    event.preventDefault();
    setPaymentErrors({});

    const validation = validatePaymentSettings(payment);
    if (!validation.valid) {
      setPaymentErrors(validation.errors);
      showError("Please fix the highlighted payment fields");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings: payment }),
      });

      const data = await res.json();
      if (!res.ok) {
        const errors = applyApiErrors(data, data.error || "Failed to save settings");
        setPaymentErrors(errors);
        showError(data.error || "Please fix the highlighted fields");
        return;
      }

      showSuccess("Settings saved successfully");
    } catch (error) {
      showError(error instanceof Error ? error.message : "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const saveSmtp = async (event: React.FormEvent) => {
    event.preventDefault();
    setSmtpErrors({});

    const validation = validateSmtpSettings(smtp);
    if (!validation.valid) {
      setSmtpErrors(validation.errors);
      showError("Please fix the highlighted SMTP fields");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings: smtp }),
      });

      const data = await res.json();
      if (!res.ok) {
        const errors = applyApiErrors(data, data.error || "Failed to save settings");
        setSmtpErrors(errors);
        showError(data.error || "Please fix the highlighted fields");
        return;
      }

      showSuccess("SMTP settings saved successfully");
    } catch (error) {
      showError(error instanceof Error ? error.message : "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const updateSmtpField = (key: string, value: string) => {
    setSmtp((prev) => {
      const next = { ...prev, [key]: value };
      if (
        !smtpExplicitlyDisabled &&
        prev[SETTING_KEYS.smtpEnabled] !== "true" &&
        value.trim()
      ) {
        next[SETTING_KEYS.smtpEnabled] = "true";
      }
      return next;
    });
    if (smtpErrors[key]) {
      setSmtpErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };

  const handleSendTestEmail = async () => {
    setSmtpErrors({});
    setSmtpTestStatus(null);

    const validation = validateSmtpSettings({
      ...smtp,
      [SETTING_KEYS.smtpEnabled]: "true",
    });
    if (!validation.valid) {
      setSmtpErrors(validation.errors);
      showError("Please complete the highlighted SMTP fields before testing");
      return;
    }

    setTestingSmtp(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          toEmail: smtpTestEmail.trim(),
          settings: smtp,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (data.errors && Object.keys(data.errors).length > 0) {
          setSmtpErrors(data.errors);
        }
        const message = data.error || "Failed to send test email";
        setSmtpTestStatus({ type: "error", text: message });
        showError(message);
        return;
      }

      const message = data.message || "Test email sent successfully";
      setSmtpTestStatus({
        type: "success",
        text: message,
        detail: data.smtpResponse,
      });
      showSuccess(message);
      if (data.warning) {
        showError(data.warning);
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to send test email";
      setSmtpTestStatus({ type: "error", text: message });
      showError(message);
    } finally {
      setTestingSmtp(false);
    }
  };

  const saveWidget = async (event: React.FormEvent) => {
    event.preventDefault();
    setWidgetErrors({});

    const payload = buildWidgetSettingsPayload({
      showHero: widget[SETTING_KEYS.widgetShowHero],
      showCategories: widget[SETTING_KEYS.widgetShowCategories],
      showServices: widget[SETTING_KEYS.widgetShowServices],
      showEnquiry: widget[SETTING_KEYS.widgetShowEnquiry],
      heroCards,
      serviceCards,
    });

    const validation = validateWidgetSettings(payload);
    if (!validation.valid) {
      setWidgetErrors(validation.errors);
      showError("Please fix the highlighted widget fields");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings: payload }),
      });

      const data = await res.json();
      if (!res.ok) {
        const errors = applyApiErrors(data, data.error || "Failed to save settings");
        setWidgetErrors(errors);
        showError(data.error || "Please fix the highlighted fields");
        return;
      }

      setWidget((prev) => ({ ...prev, ...pickSettings(data, WIDGET_SETTING_KEYS) }));
      const savedCards = parseWidgetSettingsState(data);
      setHeroCards(savedCards.heroCards);
      setServiceCards(savedCards.serviceCards);
      invalidateSiteSettingsCache();
      showSuccess("Widget settings saved successfully");
    } catch (error) {
      showError(error instanceof Error ? error.message : "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const saveSocial = async (event: React.FormEvent) => {
    event.preventDefault();
    setSocialErrors({});

    const payload = buildSocialSettingsPayload(socialLinks);
    const validation = validateSocialSettings(payload);
    if (!validation.valid) {
      setSocialErrors(validation.errors);
      showError("Please fix the highlighted social media fields");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings: payload }),
      });

      const data = await res.json();
      if (!res.ok) {
        const errors = applyApiErrors(data, data.error || "Failed to save settings");
        setSocialErrors(errors);
        showError(data.error || "Please fix the highlighted fields");
        return;
      }

      invalidateSiteSettingsCache();
      showSuccess("Social media settings saved successfully");
    } catch (error) {
      showError(error instanceof Error ? error.message : "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const updateGeneral = (key: string, value: string) => {
    setGeneral({ ...general, [key]: value });
    if (generalErrors[key]) {
      setGeneralErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };

  return (
    <AdminListLayout
      title="Settings"
      description="Manage site branding, theme, SMTP email, profile, and payment gateways."
    >
      <ToastContainer toasts={toasts} onClose={removeToast} />

      <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
        <aside className="rounded-2xl border border-border bg-surface p-2 h-fit shadow-sm min-w-0">
          <nav className="flex flex-row gap-1 overflow-x-auto scrollbar-none lg:flex-col lg:gap-0 lg:space-y-1 lg:overflow-visible">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex shrink-0 items-center gap-2.5 whitespace-nowrap rounded-xl px-3.5 py-2.5 text-sm font-medium transition lg:w-full lg:gap-3 lg:px-4 lg:py-3 ${active
                      ? "bg-primary text-white"
                      : "text-muted hover:bg-surface-elevated hover:text-foreground"
                    }`}
                >
                  <Icon size={16} />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </aside>

        <section className="min-w-0 rounded-2xl border border-border bg-surface p-4 sm:p-6 shadow-sm">
          {loading ? (
            <p className="text-sm text-muted">Loading settings...</p>
          ) : activeTab === "general" ? (
            <form onSubmit={saveGeneral} className="space-y-6 w-full">
              <div>
                <h2 className="text-lg font-semibold text-foreground">General</h2>
                <p className="mt-1 text-sm text-muted">
                  Site branding, contact details, and appearance.
                </p>
              </div>

              <div className="space-y-4 border-b border-border pb-6">
                <h3 className="text-sm font-semibold text-foreground">Branding</h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <SimpleImageUpload
                    label="Site Logo"
                    previewUrl={siteLogoDisplay || null}
                    onChange={handleSiteLogoChange}
                    onRemove={siteLogoDisplay ? handleRemoveSiteLogo : undefined}
                    hint="Upload site logo"
                    className="h-28"
                  />
                  <SimpleImageUpload
                    label="Favicon"
                    previewUrl={faviconDisplay || null}
                    onChange={handleFaviconChange}
                    onRemove={faviconDisplay ? handleRemoveFavicon : undefined}
                    hint="Upload favicon (.ico, .png)"
                    accept="image/jpeg,image/png,image/webp,image/svg+xml,image/x-icon,.ico"
                    className="h-28"
                  />
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <AdminInput
                    label="Site Name"
                    required
                    value={general[SETTING_KEYS.siteName]}
                    error={generalErrors[SETTING_KEYS.siteName]}
                    onChange={(event) =>
                      updateGeneral(SETTING_KEYS.siteName, event.target.value)
                    }
                    placeholder="Site name"
                  />
                  <AdminInput
                    label="Site Tagline"
                    value={general[SETTING_KEYS.siteTagline]}
                    error={generalErrors[SETTING_KEYS.siteTagline]}
                    onChange={(event) =>
                      updateGeneral(SETTING_KEYS.siteTagline, event.target.value)
                    }
                    placeholder="Site tagline"
                  />
                </div>
              </div>

              <div className="space-y-4 border-b border-border pb-6">
                <h3 className="text-sm font-semibold text-foreground">Contact Details</h3>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <AdminInput
                    label="Contact Email"
                    type="email"
                    required
                    value={general[SETTING_KEYS.contactEmail]}
                    error={generalErrors[SETTING_KEYS.contactEmail]}
                    onChange={(event) =>
                      updateGeneral(SETTING_KEYS.contactEmail, event.target.value)
                    }
                    placeholder="info@example.com"
                  />
                  <AdminInput
                    label="Contact Phone"
                    required
                    value={general[SETTING_KEYS.contactPhone]}
                    error={generalErrors[SETTING_KEYS.contactPhone]}
                    onChange={(event) =>
                      updateGeneral(SETTING_KEYS.contactPhone, event.target.value)
                    }
                    placeholder="+91 98765 43210"
                  />
                </div>
                <AdminTextarea
                  label="Company Address"
                  rows={4}
                  required
                  value={general[SETTING_KEYS.companyAddress]}
                  error={generalErrors[SETTING_KEYS.companyAddress]}
                  onChange={(event) =>
                    updateGeneral(SETTING_KEYS.companyAddress, event.target.value)
                  }
                  placeholder="Company address"
                />
              </div>

              <div className="space-y-4 mt-6">
                <h3 className="text-sm font-semibold text-foreground">
                  Business Hours
                </h3>

                {businessHours.map((item, index) => (
                  <div
                    key={item.day}
                    className="grid grid-cols-1 gap-2 sm:grid-cols-3 sm:gap-4 sm:items-center"
                  >
                    <p className="text-sm font-medium">{item.day}</p>

                    <AdminInput
                      type="time"
                      aria-label={`${item.day} opening time`}
                      value={item.open}
                      onChange={(e) => updateBusinessHour(index, "open", e.target.value)}
                      label=""
                    />

                    <AdminInput
                      type="time"
                      aria-label={`${item.day} closing time`}
                      value={item.close}
                      onChange={(e) => updateBusinessHour(index, "close", e.target.value)}
                      label=""
                    />
                  </div>
                ))}
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Palette size={16} className="text-muted" />
                  <h3 className="text-sm font-semibold text-foreground">Theme & Colors</h3>
                </div>
                <AdminThemeToggle
                  value={
                    general[SETTING_KEYS.themeMode] === "light" ? "light" : "dark"
                  }
                  error={generalErrors[SETTING_KEYS.themeMode]}
                  onChange={(mode) => {
                    setStoredTheme(mode);
                    updateGeneral(SETTING_KEYS.themeMode, mode);
                    void persistThemeSetting(mode);
                  }}
                />
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <AdminColorInput
                    label="Primary Color"
                    value={general[SETTING_KEYS.themePrimaryColor]}
                    error={generalErrors[SETTING_KEYS.themePrimaryColor]}
                    onChange={(value) =>
                      updateGeneral(SETTING_KEYS.themePrimaryColor, value)
                    }
                  />
                  <AdminColorInput
                    label="Accent Color"
                    value={general[SETTING_KEYS.themeAccentColor]}
                    error={generalErrors[SETTING_KEYS.themeAccentColor]}
                    onChange={(value) =>
                      updateGeneral(SETTING_KEYS.themeAccentColor, value)
                    }
                  />
                </div>
              </div>

              <AdminFormActions submitLabel="Save General Settings" saving={saving} />
            </form>
          ) : activeTab === "profile" ? (
            <form onSubmit={saveProfile} className="space-y-4 w-full max-w-3xl">
              <div>
                <h2 className="text-lg font-semibold text-foreground">Profile</h2>
                <p className="mt-1 text-sm text-muted">
                  Update your admin account details, profile photo, and password.
                </p>
              </div>

              <ProfileImageCrop
                currentImage={removeProfileImage ? "" : profile.profile}
                previewUrl={profileImagePreview}
                onCropped={handleProfileImageCropped}
                onRemove={
                  profile.profile || profileImagePreview ? handleRemoveProfileImage : undefined
                }
                error={profileErrors.profileImage}
              />

              <AdminInput
                label="Name"
                required
                value={profile.name}
                error={profileErrors.name}
                onChange={(event) => {
                  setProfile({ ...profile, name: event.target.value });
                  if (profileErrors.name) {
                    setProfileErrors((prev) => {
                      const next = { ...prev };
                      delete next.name;
                      return next;
                    });
                  }
                }}
              />
              <AdminInput label="Email" value={profile.email} disabled />
              <AdminInput label="Role" value={profile.role} disabled />

              <div className="border-t border-border pt-4">
                <h3 className="mb-4 text-sm font-semibold text-foreground">Change Password</h3>
                <div className="space-y-4">
                  <AdminInput
                    label="Current Password"
                    type="password"
                    value={profile.currentPassword}
                    error={profileErrors.currentPassword}
                    onChange={(event) =>
                      setProfile({ ...profile, currentPassword: event.target.value })
                    }
                    placeholder="Required only when changing password"
                  />
                  <AdminInput
                    label="New Password"
                    type="password"
                    value={profile.newPassword}
                    error={profileErrors.newPassword}
                    onChange={(event) =>
                      setProfile({ ...profile, newPassword: event.target.value })
                    }
                  />
                  <AdminInput
                    label="Confirm New Password"
                    type="password"
                    value={profile.confirmPassword}
                    error={profileErrors.confirmPassword}
                    onChange={(event) =>
                      setProfile({ ...profile, confirmPassword: event.target.value })
                    }
                  />
                </div>
              </div>

              <AdminFormActions submitLabel="Save Profile" saving={saving} />
            </form>
          ) : activeTab === "smtp" ? (
            <form onSubmit={saveSmtp} className="space-y-5 w-full">
              <div>
                <h2 className="text-lg font-semibold text-foreground">SMTP Email</h2>
                <p className="mt-1 text-sm text-muted">
                  Configure outgoing email for registration verification, password reset, and enquiry notifications.
                </p>
              </div>

              <AdminCheckbox
                label="Enable SMTP email"
                checked={smtp[SETTING_KEYS.smtpEnabled] === "true"}
                onChange={(checked) => {
                  setSmtpExplicitlyDisabled(!checked);
                  setSmtp({
                    ...smtp,
                    [SETTING_KEYS.smtpEnabled]: checked ? "true" : "false",
                  });
                }}
              />

              {smtp[SETTING_KEYS.smtpEnabled] !== "true" &&
                (smtp[SETTING_KEYS.smtpHost]?.trim() ||
                  smtp[SETTING_KEYS.smtpUser]?.trim() ||
                  smtp[SETTING_KEYS.smtpPass]?.trim()) && (
                  <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-800 theme-dark:text-amber-300">
                    SMTP email is currently disabled. Turn on <strong>Enable SMTP email</strong> and save settings so user registration and password reset emails use your credentials.
                  </div>
                )}

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <AdminInput
                  label="SMTP Host"
                  required={smtp[SETTING_KEYS.smtpEnabled] === "true"}
                  value={smtp[SETTING_KEYS.smtpHost]}
                  error={smtpErrors[SETTING_KEYS.smtpHost]}
                  onChange={(event) =>
                    updateSmtpField(SETTING_KEYS.smtpHost, event.target.value)
                  }
                  placeholder="smtp.gmail.com"
                />
                <div>
                  <AdminInput
                    label="SMTP Port"
                    required={smtp[SETTING_KEYS.smtpEnabled] === "true"}
                    value={smtp[SETTING_KEYS.smtpPort]}
                    error={smtpErrors[SETTING_KEYS.smtpPort]}
                    onChange={(event) =>
                      updateSmtpField(SETTING_KEYS.smtpPort, event.target.value)
                    }
                    placeholder="587"
                  />
                  <p className="mt-1 text-[11px] text-muted">
                    Use 587 for STARTTLS or 465 for SSL/TLS.
                  </p>
                </div>
                <AdminInput
                  label="SMTP Username"
                  required={smtp[SETTING_KEYS.smtpEnabled] === "true"}
                  value={smtp[SETTING_KEYS.smtpUser]}
                  error={smtpErrors[SETTING_KEYS.smtpUser]}
                  onChange={(event) =>
                    updateSmtpField(SETTING_KEYS.smtpUser, event.target.value)
                  }
                  placeholder="your-email@example.com"
                />
                <AdminInput
                  label="SMTP Password"
                  type="password"
                  required={smtp[SETTING_KEYS.smtpEnabled] === "true"}
                  value={smtp[SETTING_KEYS.smtpPass]}
                  error={smtpErrors[SETTING_KEYS.smtpPass]}
                  onChange={(event) =>
                    updateSmtpField(SETTING_KEYS.smtpPass, event.target.value)
                  }
                  placeholder="App password or SMTP password"
                />
                <div>
                  <AdminInput
                    label="From Email"
                    type="email"
                    required={
                      smtp[SETTING_KEYS.smtpEnabled] === "true" &&
                      !validateEmail(smtp[SETTING_KEYS.smtpUser]?.trim() || "")
                    }
                    value={smtp[SETTING_KEYS.smtpFrom]}
                    error={smtpErrors[SETTING_KEYS.smtpFrom]}
                    onChange={(event) =>
                      updateSmtpField(SETTING_KEYS.smtpFrom, event.target.value)
                    }
                    placeholder="noreply@example.com (optional if username is email)"
                  />
                  <p className="mt-1 text-[11px] text-muted">
                    Leave blank to use SMTP Username if it is an email address.
                  </p>
                </div>
                <AdminInput
                  label="Admin Notification Email"
                  type="email"
                  value={smtp[SETTING_KEYS.smtpAdminEmail]}
                  error={smtpErrors[SETTING_KEYS.smtpAdminEmail]}
                  onChange={(event) =>
                    updateSmtpField(SETTING_KEYS.smtpAdminEmail, event.target.value)
                  }
                  placeholder="admin@example.com"
                />
              </div>

              <AdminCheckbox
                label="Use secure connection (SSL/TLS)"
                checked={smtp[SETTING_KEYS.smtpSecure] === "true"}
                onChange={(checked) =>
                  setSmtp({
                    ...smtp,
                    [SETTING_KEYS.smtpSecure]: checked ? "true" : "false",
                  })
                }
              />

              <AdminFormActions submitLabel="Save SMTP Settings" saving={saving} />

              <div className="rounded-2xl border border-border bg-surface-elevated p-4 sm:p-5">
                <h3 className="text-sm font-semibold text-foreground">
                  Test SMTP Connection
                </h3>
                <p className="mt-1 text-xs text-muted">
                  Send a test email using these credentials to verify delivery before users register.
                </p>
                <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end">
                  <div className="min-w-0 flex-1">
                    <AdminInput
                      label="Send Test Email To"
                      type="email"
                      value={smtpTestEmail}
                      onChange={(event) => setSmtpTestEmail(event.target.value)}
                      placeholder="recipient@example.com"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleSendTestEmail}
                    disabled={testingSmtp || saving}
                    className="h-11 shrink-0 rounded-xl border border-primary bg-primary/10 px-5 text-sm font-semibold text-primary transition hover:bg-primary hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {testingSmtp ? "Sending Test..." : "Send Test Email"}
                  </button>
                </div>
                {smtpTestStatus && (
                  <div
                    className={`mt-3 rounded-xl border px-3.5 py-2.5 text-xs ${
                      smtpTestStatus.type === "success"
                        ? "border-green-600/40 bg-green-500/10 text-green-800 theme-dark:text-green-300"
                        : "border-red-600/40 bg-red-500/10 text-red-800 theme-dark:text-red-300"
                    }`}
                  >
                    <p className="font-medium">{smtpTestStatus.text}</p>
                    {smtpTestStatus.detail ? (
                      <p className="mt-1 opacity-80 break-all">
                        SMTP Response: {smtpTestStatus.detail}
                      </p>
                    ) : null}
                  </div>
                )}
              </div>
            </form>
          ) : activeTab === "widget" ? (
            <form onSubmit={saveWidget} className="space-y-4 w-full">

              <WidgetCardEditor
                label="Hero feature cards"
                description="Cards shown below the hero banner on the home page."
                cards={heroCards}
                errors={widgetErrors}
                errorPrefix={SETTING_KEYS.widgetHeroCards}
                showCount
                onChange={setHeroCards}
              />

              <WidgetCardEditor
                label="Services cards"
                description="Cards shown in the services strip on the home page."
                cards={serviceCards}
                errors={widgetErrors}
                errorPrefix={SETTING_KEYS.widgetServiceCards}
                onChange={setServiceCards}
              />

              <AdminFormActions submitLabel="Save Widget Settings" saving={saving} />
            </form>
          ) : activeTab === "social" ? (
            <form onSubmit={saveSocial} className="space-y-4 w-full">
              <div>
                <h2 className="text-lg font-semibold text-foreground">Social Media</h2>
                <p className="mt-1 text-sm text-muted">
                  Add links to your social profiles with optional custom icon images. They appear in the website footer.
                </p>
              </div>

              <SocialLinkEditor
                links={socialLinks}
                errors={socialErrors}
                errorPrefix={SETTING_KEYS.socialLinks}
                onChange={setSocialLinks}
              />

              <AdminFormActions submitLabel="Save Social Media Settings" saving={saving} />
            </form>
          ) : (
            <form onSubmit={savePayment} className="space-y-4 w-full">
              <div>
                <h2 className="text-lg font-semibold text-foreground">Razorpay</h2>
                <p className="mt-1 text-sm text-muted">
                  Configure Razorpay payment gateway credentials.
                </p>
              </div>

              <AdminCheckbox
                label="Enable Razorpay payments"
                checked={payment[SETTING_KEYS.razorpayEnabled] === "true"}
                onChange={(checked) =>
                  setPayment({
                    ...payment,
                    [SETTING_KEYS.razorpayEnabled]: checked ? "true" : "false",
                  })
                }
              />

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <AdminInput
                  label="Razorpay Key ID"
                  required={payment[SETTING_KEYS.razorpayEnabled] === "true"}
                  value={payment[SETTING_KEYS.razorpayKeyId]}
                  error={paymentErrors[SETTING_KEYS.razorpayKeyId]}
                  onChange={(event) =>
                    setPayment({
                      ...payment,
                      [SETTING_KEYS.razorpayKeyId]: event.target.value,
                    })
                  }
                  placeholder="rzp_test_xxxxxxxx"
                />
                <AdminInput
                  label="Razorpay Key Secret"
                  type="password"
                  required={payment[SETTING_KEYS.razorpayEnabled] === "true"}
                  value={payment[SETTING_KEYS.razorpayKeySecret]}
                  error={paymentErrors[SETTING_KEYS.razorpayKeySecret]}
                  onChange={(event) =>
                    setPayment({
                      ...payment,
                      [SETTING_KEYS.razorpayKeySecret]: event.target.value,
                    })
                  }
                  placeholder="Enter secret key"
                />
              </div>

              <AdminFormActions submitLabel="Save Payment Settings" saving={saving} />
            </form>
          )}
        </section>
      </div>
    </AdminListLayout>
  );
}
