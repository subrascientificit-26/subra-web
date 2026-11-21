import { resolveSocialLinks, type SocialLink } from "@/lib/socialLinks";
import {
  DEFAULT_HERO_CARDS,
  DEFAULT_SERVICE_CARDS,
  resolveWidgetCards,
  type WidgetCard,
} from "@/lib/widgetCards";

export const SETTING_KEYS = {
  razorpayKeyId: "payment.razorpay_key_id",
  razorpayKeySecret: "payment.razorpay_key_secret",
  razorpayEnabled: "payment.razorpay_enabled",
  smtpHost: "smtp.host",
  smtpPort: "smtp.port",
  smtpUser: "smtp.user",
  smtpPass: "smtp.pass",
  smtpFrom: "smtp.from",
  smtpSecure: "smtp.secure",
  smtpEnabled: "smtp.enabled",
  smtpAdminEmail: "smtp.admin_email",
  siteName: "general.site_name",
  siteTagline: "general.site_tagline",
  siteLogo: "general.site_logo",
  favicon: "general.favicon",
  contactEmail: "general.contact_email",
  contactPhone: "general.contact_phone",
  companyAddress: "general.company_address",
  businessHours: "general.business_hours",
  themeMode: "general.theme_mode",
  themePrimaryColor: "general.theme_primary_color",
  themeAccentColor: "general.theme_accent_color",
  widgetShowHero: "widget.show_hero",
  widgetShowCategories: "widget.show_categories",
  widgetShowServices: "widget.show_services",
  widgetShowEnquiry: "widget.show_enquiry",
  widgetHeroCards: "widget.hero_cards",
  widgetServiceCards: "widget.service_cards",
  socialLinks: "social.links",
  socialLinkedin: "social.linkedin_url",
  socialFacebook: "social.facebook_url",
  socialTwitter: "social.twitter_url",
  socialYoutube: "social.youtube_url",
} as const;

export type SettingKey = (typeof SETTING_KEYS)[keyof typeof SETTING_KEYS];

export type SettingsTab = "general" | "profile" | "payment" | "smtp" | "widget" | "social";

export const PAYMENT_SETTING_KEYS = [
  SETTING_KEYS.razorpayKeyId,
  SETTING_KEYS.razorpayKeySecret,
  SETTING_KEYS.razorpayEnabled,
] as const;

export const SMTP_SETTING_KEYS = [
  SETTING_KEYS.smtpHost,
  SETTING_KEYS.smtpPort,
  SETTING_KEYS.smtpUser,
  SETTING_KEYS.smtpPass,
  SETTING_KEYS.smtpFrom,
  SETTING_KEYS.smtpSecure,
  SETTING_KEYS.smtpEnabled,
  SETTING_KEYS.smtpAdminEmail,
] as const;

export const GENERAL_SETTING_KEYS = [
  SETTING_KEYS.siteName,
  SETTING_KEYS.siteTagline,
  SETTING_KEYS.siteLogo,
  SETTING_KEYS.favicon,
  SETTING_KEYS.contactEmail,
  SETTING_KEYS.contactPhone,
  SETTING_KEYS.companyAddress,
  SETTING_KEYS.businessHours,
  SETTING_KEYS.themeMode,
  SETTING_KEYS.themePrimaryColor,
  SETTING_KEYS.themeAccentColor,
] as const;

export const LEGACY_SOCIAL_SETTING_KEYS = [
  SETTING_KEYS.socialLinkedin,
  SETTING_KEYS.socialFacebook,
  SETTING_KEYS.socialTwitter,
  SETTING_KEYS.socialYoutube,
] as const;

export const SOCIAL_SETTING_KEYS = [SETTING_KEYS.socialLinks] as const;

export const PUBLIC_SETTING_KEYS = [
  SETTING_KEYS.siteName,
  SETTING_KEYS.siteTagline,
  SETTING_KEYS.siteLogo,
  SETTING_KEYS.favicon,
  SETTING_KEYS.contactEmail,
  SETTING_KEYS.contactPhone,
  SETTING_KEYS.companyAddress,
  SETTING_KEYS.businessHours,
  SETTING_KEYS.themeMode,
  SETTING_KEYS.themePrimaryColor,
  SETTING_KEYS.themeAccentColor,
  SETTING_KEYS.widgetHeroCards,
  SETTING_KEYS.widgetServiceCards,
  SETTING_KEYS.socialLinks,
  ...LEGACY_SOCIAL_SETTING_KEYS,
] as const;

export const WIDGET_SETTING_KEYS = [
  SETTING_KEYS.widgetShowHero,
  SETTING_KEYS.widgetShowCategories,
  SETTING_KEYS.widgetShowServices,
  SETTING_KEYS.widgetShowEnquiry,
  SETTING_KEYS.widgetHeroCards,
  SETTING_KEYS.widgetServiceCards,
] as const;

export const ALL_SETTING_KEYS = [
  ...PAYMENT_SETTING_KEYS,
  ...GENERAL_SETTING_KEYS,
  ...SMTP_SETTING_KEYS,
  ...WIDGET_SETTING_KEYS,
  ...SOCIAL_SETTING_KEYS,
] as const;

export type PublicSiteSettings = {
  siteName: string;
  siteTagline: string;
  siteLogo: string;
  favicon: string;
  contactEmail: string;
  contactPhone: string;
  companyAddress: string;
  themeMode: "dark" | "light";
  themePrimaryColor: string;
  themeAccentColor: string;
  socialLinks: SocialLink[];
  heroCards: WidgetCard[];
  serviceCards: WidgetCard[];
};

/** Empty shape used before DB data loads — not site-specific defaults. */
export const EMPTY_PUBLIC_SETTINGS: PublicSiteSettings = {
  siteName: "",
  siteTagline: "",
  siteLogo: "",
  favicon: "",
  contactEmail: "",
  contactPhone: "",
  companyAddress: "",
  themeMode: "dark",
  themePrimaryColor: "",
  themeAccentColor: "",
  socialLinks: [],
  heroCards: [],
  serviceCards: [],
};

export function settingsRecordToMap(
  rows: { key: string; value: string }[]
): Record<string, string> {
  return Object.fromEntries(rows.map((row) => [row.key, row.value]));
}

export function pickSettings(
  map: Record<string, string>,
  keys: readonly string[]
): Record<string, string> {
  return Object.fromEntries(keys.map((key) => [key, map[key] ?? ""]));
}

export function createEmptySettingsMap(
  keys: readonly string[]
): Record<string, string> {
  return Object.fromEntries(keys.map((key) => [key, ""]));
}

export function mapToPublicSettings(
  map: Record<string, string>
): PublicSiteSettings {
  const themeMode = map[SETTING_KEYS.themeMode] === "light" ? "light" : "dark";

  return {
    siteName: map[SETTING_KEYS.siteName]?.trim() ?? "",
    siteTagline: map[SETTING_KEYS.siteTagline]?.trim() ?? "",
    siteLogo: map[SETTING_KEYS.siteLogo]?.trim() ?? "",
    favicon: map[SETTING_KEYS.favicon]?.trim() ?? "",
    contactEmail: map[SETTING_KEYS.contactEmail]?.trim() ?? "",
    contactPhone: map[SETTING_KEYS.contactPhone]?.trim() ?? "",
    companyAddress: map[SETTING_KEYS.companyAddress]?.trim() ?? "",
    themeMode,
    themePrimaryColor: map[SETTING_KEYS.themePrimaryColor]?.trim() ?? "",
    themeAccentColor: map[SETTING_KEYS.themeAccentColor]?.trim() ?? "",
    socialLinks: resolveSocialLinks(map),
    heroCards: resolveWidgetCards(
      map[SETTING_KEYS.widgetHeroCards],
      DEFAULT_HERO_CARDS
    ),
    serviceCards: resolveWidgetCards(
      map[SETTING_KEYS.widgetServiceCards],
      DEFAULT_SERVICE_CARDS
    ),
  };
}
