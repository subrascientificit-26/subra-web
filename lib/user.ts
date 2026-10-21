import type { AuthUser } from "@/lib/auth";

export function getDisplayName(user: {
  name?: string | null;
  email: string;
}): string {
  const trimmed = user.name?.trim();
  if (trimmed) return trimmed;
  return user.email.split("@")[0];
}

export function getUserInitials(user: {
  name?: string | null;
  email: string;
}): string {
  const displayName = getDisplayName(user);
  const parts = displayName.split(/\s+/).filter(Boolean);

  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }

  return displayName.slice(0, 2).toUpperCase();
}

export type ProfileUser = Pick<AuthUser, "id" | "email" | "role" | "name" | "profile" | "emailVerified">;
