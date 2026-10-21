"use client";

import Link from "next/link";
import { useSiteSettings } from "@/lib/hooks/useSiteSettings";

interface SiteBrandingProps {
  href?: string;
  titleClassName?: string;
  taglineClassName?: string;
  logoClassName?: string;
  showLogo?: boolean;
  showTagline?: boolean;
}

export default function SiteBranding({
  href = "/",
  titleClassName = "text-xl sm:text-2xl md:text-3xl font-bold",
  taglineClassName = "text-[10px] sm:text-xs md:text-sm tracking-wide text-muted",
  logoClassName = "h-10 w-10 object-contain",
  showLogo = true,
  showTagline = false,
}: SiteBrandingProps) {
  const { settings } = useSiteSettings();

  const content = (
    <div className="flex items-center gap-3">
      {showLogo && settings.siteLogo ? (
        <img
          src={settings.siteLogo}
          alt={settings.siteName}
          className={logoClassName}
        />
      ) : null}
      <div className="flex flex-col leading-none">
        <div
          className={titleClassName}
          style={{ color: settings.themeAccentColor || "#ff2d2d" }}
        >
          {settings.siteName}
        </div>
        {showTagline && settings.siteTagline ? (
          <span className={taglineClassName}>{settings.siteTagline}</span>
        ) : null}
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="flex-shrink-0">
        {content}
      </Link>
    );
  }

  return content;
}
