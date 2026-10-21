import type { LucideIcon } from "lucide-react";
import {
  CheckCircle,
  FlaskConical,
  Headphones,
  Lock,
  ShieldCheck,
  ShoppingBag,
  Truck,
  Users,
  Zap,
} from "lucide-react";

export type WidgetCard = {
  id: string;
  icon: string;
  count: string;
  title: string;
  description: string;
  sortOrder: number;
};

export const WIDGET_ICON_OPTIONS = [
  { value: "flask-conical", label: "Flask" },
  { value: "shield-check", label: "Shield" },
  { value: "truck", label: "Truck" },
  { value: "headphones", label: "Headphones" },
  { value: "lock", label: "Lock" },
  { value: "shopping-bag", label: "Shopping bag" },
  { value: "users", label: "Users" },
  { value: "zap", label: "Lightning" },
  { value: "check-circle", label: "Check circle" },
] as const;

const WIDGET_ICONS: Record<string, LucideIcon> = {
  "flask-conical": FlaskConical,
  "shield-check": ShieldCheck,
  truck: Truck,
  headphones: Headphones,
  lock: Lock,
  "shopping-bag": ShoppingBag,
  users: Users,
  zap: Zap,
  "check-circle": CheckCircle,
};

export function createWidgetCardId(): string {
  return `card-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function getWidgetCardIcon(name: string): LucideIcon {
  return WIDGET_ICONS[name] ?? CheckCircle;
}

export const DEFAULT_HERO_CARDS: WidgetCard[] = [
  {
    id: "hero-products",
    icon: "flask-conical",
    count: "5000+",
    title: "Products",
    description: "Wide range of quality products",
    sortOrder: 0,
  },
  {
    id: "hero-quality",
    icon: "shield-check",
    count: "100%",
    title: "Quality Assured",
    description: "Premium quality products from trusted brands",
    sortOrder: 1,
  },
  {
    id: "hero-delivery",
    icon: "truck",
    count: "",
    title: "Global Delivery",
    description: "On-time delivery across the globe",
    sortOrder: 2,
  },
  {
    id: "hero-support",
    icon: "headphones",
    count: "",
    title: "Dedicated Support",
    description: "Expert support for all your requirements",
    sortOrder: 3,
  },
];

export const DEFAULT_SERVICE_CARDS: WidgetCard[] = [
  {
    id: "service-secure",
    icon: "lock",
    count: "",
    title: "Secure & Safe",
    description: "Your data and transactions are always secure",
    sortOrder: 0,
  },
  {
    id: "service-ordering",
    icon: "shopping-bag",
    count: "",
    title: "Easy Ordering",
    description: "Simple and quick ordering experience",
    sortOrder: 1,
  },
  {
    id: "service-trusted",
    icon: "users",
    count: "",
    title: "Trusted by Professionals",
    description: "Serving research labs, industries & institutions",
    sortOrder: 2,
  },
  {
    id: "service-pricing",
    icon: "zap",
    count: "",
    title: "Competitive Pricing",
    description: "Best prices with great value",
    sortOrder: 3,
  },
  {
    id: "service-satisfaction",
    icon: "check-circle",
    count: "",
    title: "Satisfaction Guaranteed",
    description: "Committed to quality and service excellence",
    sortOrder: 4,
  },
];

function normalizeWidgetCard(
  item: Partial<WidgetCard>,
  fallbackSortOrder: number
): WidgetCard | null {
  const title = item.title?.trim() ?? "";
  const description = item.description?.trim() ?? "";
  const icon = item.icon?.trim() ?? "";

  if (!title || !description || !icon) return null;

  return {
    id: item.id?.trim() || createWidgetCardId(),
    icon,
    count: item.count?.trim() ?? "",
    title,
    description,
    sortOrder:
      typeof item.sortOrder === "number" && Number.isFinite(item.sortOrder)
        ? item.sortOrder
        : fallbackSortOrder,
  };
}

export function parseWidgetCards(
  raw: string | undefined | null
): WidgetCard[] | null {
  if (!raw?.trim()) return null;

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return null;

    const cards = parsed
      .map((item, index) =>
        normalizeWidgetCard(item as Partial<WidgetCard>, index)
      )
      .filter((item): item is WidgetCard => item !== null)
      .sort((a, b) => a.sortOrder - b.sortOrder);

    return cards.length > 0 ? cards : null;
  } catch {
    return null;
  }
}

export function serializeWidgetCards(cards: WidgetCard[]): string {
  return JSON.stringify(
    cards
      .map((card, index) => ({
        id: card.id,
        icon: card.icon.trim(),
        count: card.count.trim(),
        title: card.title.trim(),
        description: card.description.trim(),
        sortOrder: index,
      }))
      .filter((card) => card.title && card.description && card.icon)
  );
}

export function resolveWidgetCards(
  raw: string | undefined | null,
  defaults: WidgetCard[]
): WidgetCard[] {
  return parseWidgetCards(raw) ?? defaults;
}
