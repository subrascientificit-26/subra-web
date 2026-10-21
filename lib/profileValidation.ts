import { validateEmail, validatePassword } from "@/lib/validators";

import {
  DEFAULT_HERO_CARDS,
  DEFAULT_SERVICE_CARDS,
  parseWidgetCards,
  serializeWidgetCards,
  type WidgetCard,
} from "@/lib/widgetCards";
import {
  isCustomSocialIcon,
  normalizeSocialIcon,
  parseSocialLinks,
  resolveSocialLinks,
  serializeSocialLinks,
  type SocialLink,
} from "@/lib/socialLinks";
import { SETTING_KEYS } from "@/lib/settings";

export type FieldErrors = Record<string, string>;

const HEX_COLOR = /^#([0-9A-Fa-f]{6})$/;

export function validateProfileForm(data: {
  name: string;
  currentPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
}): { valid: boolean; errors: FieldErrors } {
  const errors: FieldErrors = {};

  if (!data.name.trim()) {
    errors.name = "Name is required";
  }

  if (data.newPassword) {
    if (!data.currentPassword?.trim()) {
      errors.currentPassword = "Current password is required to set a new password";
    }

    const passwordCheck = validatePassword(data.newPassword);
    if (!passwordCheck.valid && passwordCheck.error) {
      errors.newPassword = passwordCheck.error;
    }

    if (data.newPassword !== data.confirmPassword) {
      errors.confirmPassword = "New password and confirm password do not match";
    }
  }

  return { valid: Object.keys(errors).length === 0, errors };
}

export function validatePaymentSettings(
  settings: Record<string, string>
): { valid: boolean; errors: FieldErrors } {
  const errors: FieldErrors = {};
  const enabled = settings[SETTING_KEYS.razorpayEnabled] === "true";

  if (enabled) {
    if (!settings[SETTING_KEYS.razorpayKeyId]?.trim()) {
      errors[SETTING_KEYS.razorpayKeyId] = "Razorpay Key ID is required when payments are enabled";
    }
    if (!settings[SETTING_KEYS.razorpayKeySecret]?.trim()) {
      errors[SETTING_KEYS.razorpayKeySecret] =
        "Razorpay Key Secret is required when payments are enabled";
    }
  }

  return { valid: Object.keys(errors).length === 0, errors };
}

export function validateGeneralSettings(
  settings: Record<string, string>
): { valid: boolean; errors: FieldErrors } {
  const errors: FieldErrors = {};

  if (!settings[SETTING_KEYS.siteName]?.trim()) {
    errors[SETTING_KEYS.siteName] = "Site name is required";
  }

  if (!settings[SETTING_KEYS.contactEmail]?.trim()) {
    errors[SETTING_KEYS.contactEmail] = "Contact email is required";
  } else if (!validateEmail(settings[SETTING_KEYS.contactEmail].trim())) {
    errors[SETTING_KEYS.contactEmail] = "Enter a valid contact email";
  }

  if (!settings[SETTING_KEYS.contactPhone]?.trim()) {
    errors[SETTING_KEYS.contactPhone] = "Contact phone is required";
  }

  if (!settings[SETTING_KEYS.companyAddress]?.trim()) {
    errors[SETTING_KEYS.companyAddress] = "Company address is required";
  }

  const themeMode = settings[SETTING_KEYS.themeMode];
  if (themeMode && themeMode !== "dark" && themeMode !== "light") {
    errors[SETTING_KEYS.themeMode] = "Theme must be dark or light";
  }

  for (const key of [SETTING_KEYS.themePrimaryColor, SETTING_KEYS.themeAccentColor] as const) {
    const value = settings[key]?.trim();
    if (value && !HEX_COLOR.test(value)) {
      errors[key] = "Enter a valid hex color like #0b5cff";
    }
  }

  return { valid: Object.keys(errors).length === 0, errors };
}

export function validateSmtpSettings(
  settings: Record<string, string>
): { valid: boolean; errors: FieldErrors } {
  const errors: FieldErrors = {};
  const enabled = settings[SETTING_KEYS.smtpEnabled] === "true";

  if (enabled) {
    if (!settings[SETTING_KEYS.smtpHost]?.trim()) {
      errors[SETTING_KEYS.smtpHost] = "SMTP host is required when email is enabled";
    }
    if (!settings[SETTING_KEYS.smtpPort]?.trim()) {
      errors[SETTING_KEYS.smtpPort] = "SMTP port is required when email is enabled";
    } else if (!/^\d+$/.test(settings[SETTING_KEYS.smtpPort].trim())) {
      errors[SETTING_KEYS.smtpPort] = "SMTP port must be a number";
    }
    if (!settings[SETTING_KEYS.smtpUser]?.trim()) {
      errors[SETTING_KEYS.smtpUser] = "SMTP username is required when email is enabled";
    }
    if (!settings[SETTING_KEYS.smtpPass]?.trim()) {
      errors[SETTING_KEYS.smtpPass] = "SMTP password is required when email is enabled";
    }
    if (!settings[SETTING_KEYS.smtpFrom]?.trim()) {
      errors[SETTING_KEYS.smtpFrom] = "From email is required when email is enabled";
    } else if (!validateEmail(settings[SETTING_KEYS.smtpFrom].trim())) {
      errors[SETTING_KEYS.smtpFrom] = "Enter a valid from email";
    }
    if (
      settings[SETTING_KEYS.smtpAdminEmail]?.trim() &&
      !validateEmail(settings[SETTING_KEYS.smtpAdminEmail].trim())
    ) {
      errors[SETTING_KEYS.smtpAdminEmail] = "Enter a valid admin notification email";
    }
  }

  return { valid: Object.keys(errors).length === 0, errors };
}

export function validateWidgetSettings(
  settings: Record<string, string>
): { valid: boolean; errors: FieldErrors } {
  const errors: FieldErrors = {};

  const heroCards = parseWidgetCards(settings[SETTING_KEYS.widgetHeroCards]);
  const serviceCards = parseWidgetCards(
    settings[SETTING_KEYS.widgetServiceCards]
  );

  if (
    settings[SETTING_KEYS.widgetHeroCards]?.trim() &&
    (!heroCards || heroCards.length === 0)
  ) {
    errors[SETTING_KEYS.widgetHeroCards] =
      "Hero cards must include a title, description, and icon";
  }

  if (
    settings[SETTING_KEYS.widgetServiceCards]?.trim() &&
    (!serviceCards || serviceCards.length === 0)
  ) {
    errors[SETTING_KEYS.widgetServiceCards] =
      "Service cards must include a title, description, and icon";
  }

  const validateCards = (
    cards: WidgetCard[] | null | undefined,
    key: string,
    label: string
  ) => {
    if (!cards) return;

    cards.forEach((card, index) => {
      if (!card.title.trim()) {
        errors[`${key}.${index}.title`] = `${label} card ${index + 1}: title is required`;
      }
      if (!card.description.trim()) {
        errors[`${key}.${index}.description`] =
          `${label} card ${index + 1}: description is required`;
      }
      if (!card.icon.trim()) {
        errors[`${key}.${index}.icon`] = `${label} card ${index + 1}: icon is required`;
      }
    });
  };

  validateCards(heroCards, SETTING_KEYS.widgetHeroCards, "Hero");
  validateCards(serviceCards, SETTING_KEYS.widgetServiceCards, "Service");

  return { valid: Object.keys(errors).length === 0, errors };
}

export function buildWidgetSettingsPayload(input: {
  showHero: string;
  showCategories: string;
  showServices: string;
  showEnquiry: string;
  heroCards: WidgetCard[];
  serviceCards: WidgetCard[];
}): Record<string, string> {
  return {
    [SETTING_KEYS.widgetShowHero]: input.showHero,
    [SETTING_KEYS.widgetShowCategories]: input.showCategories,
    [SETTING_KEYS.widgetShowServices]: input.showServices,
    [SETTING_KEYS.widgetShowEnquiry]: input.showEnquiry,
    [SETTING_KEYS.widgetHeroCards]: serializeWidgetCards(input.heroCards),
    [SETTING_KEYS.widgetServiceCards]: serializeWidgetCards(input.serviceCards),
  };
}

export function parseWidgetSettingsState(
  settings: Record<string, string>
): {
  heroCards: WidgetCard[];
  serviceCards: WidgetCard[];
} {
  return {
    heroCards:
      parseWidgetCards(settings[SETTING_KEYS.widgetHeroCards]) ??
      DEFAULT_HERO_CARDS,
    serviceCards:
      parseWidgetCards(settings[SETTING_KEYS.widgetServiceCards]) ??
      DEFAULT_SERVICE_CARDS,
  };
}

function isValidOptionalUrl(value: string): boolean {
  if (!value.trim()) return true;
  try {
    const url = new URL(value.trim());
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function isValidSocialLinkUrl(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return false;
  if (isValidOptionalUrl(trimmed)) return true;
  if (/^tel:\+?[\d\s().-]+$/i.test(trimmed)) return true;

  const digits = trimmed.replace(/\D/g, "");
  if (digits.length >= 7 && digits.length <= 15 && /^\+?[\d\s().-]+$/.test(trimmed)) {
    return true;
  }

  return false;
}

export function validateSocialSettings(
  settings: Record<string, string>
): { valid: boolean; errors: FieldErrors } {
  const errors: FieldErrors = {};
  const links = parseSocialLinks(settings[SETTING_KEYS.socialLinks]);

  links.forEach((link, index) => {
    const linkValue = link.link.trim();
    const label = link.label.trim() || `Link ${index + 1}`;

    if (!linkValue) {
      errors[`${SETTING_KEYS.socialLinks}.${index}.link`] = `${label} URL is required`;
    } else if (!isValidSocialLinkUrl(linkValue)) {
      errors[`${SETTING_KEYS.socialLinks}.${index}.link`] = `Enter a valid URL for ${label}`;
    }

    const iconValue = normalizeSocialIcon(link.icon);
    if (
      iconValue &&
      isCustomSocialIcon(iconValue) &&
      !isValidOptionalUrl(iconValue) &&
      !iconValue.startsWith("/")
    ) {
      errors[`${SETTING_KEYS.socialLinks}.${index}.icon`] =
        `Enter a valid icon URL for ${label}`;
    }
  });

  return { valid: Object.keys(errors).length === 0, errors };
}

export function parseSocialSettingsState(
  settings: Record<string, string>
): SocialLink[] {
  return resolveSocialLinks(settings);
}

export function buildSocialSettingsPayload(links: SocialLink[]): Record<string, string> {
  return {
    [SETTING_KEYS.socialLinks]: serializeSocialLinks(links),
  };
}
