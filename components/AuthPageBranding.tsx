"use client";

import { Montserrat } from "next/font/google";
import { useSiteSettings } from "@/lib/hooks/useSiteSettings";

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["800"],
});

export default function AuthPageBranding() {
  const { settings } = useSiteSettings();

  if (!settings.siteName && !settings.siteTagline && !settings.siteLogo) {
    return null;
  }

  return (
    <div className="mb-6">
      {settings.siteLogo ? (
        <img
          src={settings.siteLogo}
          alt={settings.siteName}
          className="mx-auto mb-4 h-16 w-auto object-contain lg:mx-0"
        />
      ) : null}

      {settings.siteName ? (
        <h1
          className={`${montserrat.className} text-[42px] font-extrabold leading-none tracking-tight sm:text-[52px] lg:text-[68px]`}
          style={{ color: settings.themeAccentColor || "#ff2b2b" }}
        >
          {settings.siteName}
        </h1>
      ) : null}

      {settings.contactEmail ? (
        <p className="mt-2 text-sm tracking-widest theme-dark:text-gray-300 theme-light:text-muted">
          {settings.contactEmail}
        </p>
      ) : null}
    </div>
  );
}
