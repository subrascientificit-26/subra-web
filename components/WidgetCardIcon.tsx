import { getWidgetCardIcon } from "@/lib/widgetCards";

type WidgetCardIconProps = {
  icon: string;
  size?: number;
  className?: string;
  strokeWidth?: number;
};

export default function WidgetCardIcon({
  icon,
  size = 24,
  className = "text-blue-500",
  strokeWidth = 1.8,
}: WidgetCardIconProps) {
  const Icon = getWidgetCardIcon(icon);

  return <Icon size={size} className={className} strokeWidth={strokeWidth} />;
}
