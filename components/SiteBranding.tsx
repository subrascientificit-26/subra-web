"use client";

import Link from "next/link";
import { useState } from "react";
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
  titleClassName = "text-lg sm:text-2xl md:text-3xl font-bold truncate",
  taglineClassName = "text-[10px] sm:text-xs md:text-sm tracking-wide text-muted truncate",
  logoClassName = "h-8 w-8 sm:h-10 sm:w-10 object-contain shrink-0",
  showLogo = true,
  showTagline = false,
}: SiteBrandingProps) {
  const { settings } = useSiteSettings();
  const [failedLogo, setFailedLogo] = useState<string | null>(null);
  const logoVisible = Boolean(
    showLogo && settings.siteLogo && failedLogo !== settings.siteLogo
  );

  const content = (
    <div className="flex items-center gap-2 sm:gap-3 min-w-0">
      {logoVisible ? (
        <img
          src={settings.siteLogo}
          alt={settings.siteName}
          onError={() => setFailedLogo(settings.siteLogo || null)}
          className={logoClassName}
        />
      ) : null}
      <div className="flex flex-col leading-none min-w-0">
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
      <Link href={href} className="inline-flex min-w-0 flex-shrink cursor-pointer">
        {content}
      </Link>
    );
  }

  return content;
}
