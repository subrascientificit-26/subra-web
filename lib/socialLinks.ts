export const SOCIAL_ICON_OPTIONS = [
  { value: "linkedin", label: "LinkedIn" },
  { value: "facebook", label: "Facebook" },
  { value: "twitter", label: "Twitter / X" },
  { value: "youtube", label: "YouTube" },
  { value: "instagram", label: "Instagram" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "custom", label: "Custom icon URL" },
] as const;

export const SOCIAL_PLATFORM_ICONS = SOCIAL_ICON_OPTIONS
  .filter((option) => option.value !== "custom")
  .map((option) => option.value);

export function isSocialPlatformIcon(icon: string): boolean {
  const value = icon.trim().toLowerCase();
  if (!value) return false;
  return SOCIAL_PLATFORM_ICONS.includes(value as (typeof SOCIAL_PLATFORM_ICONS)[number]);
}

export function normalizeSocialIcon(icon: string): string {
  const value = icon.trim();
  if (!value) return "";
  if (isSocialPlatformIcon(value)) {
    return value.toLowerCase();
  }
  return value;
}

export function isCustomSocialIcon(icon: string): boolean {
  const value = icon.trim();
  if (!value) return false;
  if (isSocialPlatformIcon(value)) return false;
  if (
    value.startsWith("http://") ||
    value.startsWith("https://") ||
    value.startsWith("/")
  ) {
    return true;
  }
  return true;
}

export function getSocialIconSelectValue(icon: string): string {
  const value = icon.trim().toLowerCase();
  if (!value) return "";
  if (SOCIAL_PLATFORM_ICONS.includes(value as (typeof SOCIAL_PLATFORM_ICONS)[number])) {
    return value;
  }
  return "custom";
}

const SOCIAL_LINKS_KEY = "social.links";

export type SocialLink = {
  id: string;
  label: string;
  link: string;
  icon: string;
};

export function createSocialLinkId(): string {
  return `social-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function normalizeSocialLinkUrl(link: string): string {
  const trimmed = link.trim();
  if (!trimmed) return "";

  try {
    const url = new URL(trimmed);
    if (url.protocol === "http:" || url.protocol === "https:" || url.protocol === "tel:") {
      return trimmed;
    }
  } catch {
    // Fall through to phone-number normalization.
  }

  const digits = trimmed.replace(/\D/g, "");
  if (digits.length >= 7 && digits.length <= 15 && /^\+?[\d\s().-]+$/.test(trimmed)) {
    return `https://wa.me/${digits}`;
  }

  return trimmed;
}

export function parseSocialLinks(raw: string | undefined | null): SocialLink[] {
  if (!raw?.trim()) return [];

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];

    return parsed
      .map((item) => {
        if (!item || typeof item !== "object") return null;
        const entry = item as Partial<SocialLink>;
        const link = normalizeSocialLinkUrl(entry.link?.trim() ?? "");
        const icon = normalizeSocialIcon(entry.icon?.trim() ?? "");
        const label = entry.label?.trim() ?? "";
        const id = entry.id?.trim() ?? createSocialLinkId();

        if (!link) return null;

        return { id, label: label || "Social link", link, icon };
      })
      .filter((item): item is SocialLink => item !== null);
  } catch {
    return [];
  }
}

export function serializeSocialLinks(links: SocialLink[]): string {
  return JSON.stringify(
    links
      .map((link) => ({
        id: link.id,
        label: link.label.trim(),
        link: normalizeSocialLinkUrl(link.link),
        icon: normalizeSocialIcon(link.icon),
      }))
      .filter((link) => link.link)
  );
}

const LEGACY_SOCIAL_ENTRIES = [
  { key: "social.linkedin_url", label: "LinkedIn", icon: "linkedin" },
  { key: "social.facebook_url", label: "Facebook", icon: "facebook" },
  { key: "social.twitter_url", label: "Twitter", icon: "twitter" },
  { key: "social.youtube_url", label: "YouTube", icon: "youtube" },
] as const;

export function resolveSocialLinks(map: Record<string, string>): SocialLink[] {
  const stored = parseSocialLinks(map[SOCIAL_LINKS_KEY]);
  if (stored.length > 0) return stored;

  return LEGACY_SOCIAL_ENTRIES.flatMap((entry) => {
    const link = map[entry.key]?.trim() ?? "";
    if (!link) return [];

    return [
      {
        id: entry.icon,
        label: entry.label,
        link,
        icon: entry.icon,
      },
    ];
  });
}
