import { prisma } from "@/lib/prisma";

import { requireAdmin } from "@/lib/auth";

import { NextResponse } from "next/server";

import {

  ALL_SETTING_KEYS,

  GENERAL_SETTING_KEYS,

  PAYMENT_SETTING_KEYS,

  SMTP_SETTING_KEYS,

  WIDGET_SETTING_KEYS,

  SOCIAL_SETTING_KEYS,

  SETTING_KEYS,

} from "@/lib/settings";

import { getSettingsMap } from "@/lib/siteSettings";

import {

  validateGeneralSettings,

  validatePaymentSettings,

  validateSmtpSettings,

  validateWidgetSettings,

  validateSocialSettings,

} from "@/lib/profileValidation";

import { saveSiteImage } from "@/lib/siteImage";



const ALL_KEYS = ALL_SETTING_KEYS;



function jsonFieldErrors(errors: Record<string, string>, status = 400) {

  return NextResponse.json({ error: "Validation failed", errors }, { status });

}



function validateSettingsPayload(

  settings: Record<string, string>

): { valid: boolean; errors: Record<string, string> } {

  const paymentKeys = new Set<string>(PAYMENT_SETTING_KEYS);

  const generalKeys = new Set<string>(GENERAL_SETTING_KEYS);

  const smtpKeys = new Set<string>(SMTP_SETTING_KEYS);

  const widgetKeys = new Set<string>(WIDGET_SETTING_KEYS);

  const socialKeys = new Set<string>(SOCIAL_SETTING_KEYS);



  const hasPayment = Object.keys(settings).some((key) => paymentKeys.has(key));

  const hasGeneral = Object.keys(settings).some((key) => generalKeys.has(key));

  const hasSmtp = Object.keys(settings).some((key) => smtpKeys.has(key));

  const hasWidget = Object.keys(settings).some((key) => widgetKeys.has(key));

  const hasSocial = Object.keys(settings).some((key) => socialKeys.has(key));



  if (hasPayment) {

    const paymentValidation = validatePaymentSettings(settings);

    if (!paymentValidation.valid) {

      return paymentValidation;

    }

  }



  if (hasGeneral) {
    const presentGeneralKeys = Object.keys(settings).filter((key) =>
      generalKeys.has(key)
    );
    const isThemeOnly =
      presentGeneralKeys.length === 1 &&
      presentGeneralKeys[0] === SETTING_KEYS.themeMode;

    if (isThemeOnly) {
      const themeMode = settings[SETTING_KEYS.themeMode];
      if (themeMode !== "dark" && themeMode !== "light") {
        return {
          valid: false,
          errors: { [SETTING_KEYS.themeMode]: "Theme must be dark or light" },
        };
      }
    } else {
      const generalValidation = validateGeneralSettings(settings);

      if (!generalValidation.valid) {
        return generalValidation;
      }
    }
  }



  if (hasSmtp) {

    const smtpValidation = validateSmtpSettings(settings);

    if (!smtpValidation.valid) {

      return smtpValidation;

    }

  }

  if (hasWidget) {
    const widgetValidation = validateWidgetSettings(settings);
    if (!widgetValidation.valid) {
      return widgetValidation;
    }
  }

  if (hasSocial) {
    const socialValidation = validateSocialSettings(settings);
    if (!socialValidation.valid) {
      return socialValidation;
    }
  }



  return { valid: true, errors: {} };

}



function parseGroup(value: string | null) {

  if (value === "payment" || value === "general" || value === "smtp" || value === "widget" || value === "social") return value;

  return "all";

}



async function persistSettings(entries: [string, string][]) {

  await prisma.$transaction(

    entries.map(([key, value]) =>

      prisma.siteSetting.upsert({

        where: { key },

        update: { value: String(value ?? "") },

        create: { key, value: String(value ?? "") },

      })

    )

  );



  return getSettingsMap(entries.map(([key]) => key));

}



export async function GET(req: Request) {

  const auth = await requireAdmin(req);

  if (auth instanceof NextResponse) return auth;



  try {

    const group = parseGroup(new URL(req.url).searchParams.get("group"));

    const keys =

      group === "payment"

        ? PAYMENT_SETTING_KEYS

        : group === "general"

          ? GENERAL_SETTING_KEYS

          : group === "smtp"

            ? SMTP_SETTING_KEYS

            : group === "widget"

              ? WIDGET_SETTING_KEYS

            : group === "social"

              ? SOCIAL_SETTING_KEYS

            : ALL_KEYS;



    return NextResponse.json(await getSettingsMap(keys));

  } catch (error) {

    console.error("Settings GET error:", error);

    return NextResponse.json(

      { error: error instanceof Error ? error.message : "Failed to load settings" },

      { status: 500 }

    );

  }

}



export async function PUT(req: Request) {

  const auth = await requireAdmin(req);

  if (auth instanceof NextResponse) return auth;



  try {

    const contentType = req.headers.get("content-type") ?? "";



    if (contentType.includes("multipart/form-data")) {

      const formData = await req.formData();

      const settingsRaw = formData.get("settings");



      if (!settingsRaw || typeof settingsRaw !== "string") {

        return NextResponse.json({ error: "Settings object is required" }, { status: 400 });

      }



      const settings = JSON.parse(settingsRaw) as Record<string, string>;

      const siteLogoFile = formData.get("siteLogo");

      const faviconFile = formData.get("favicon");



      if (siteLogoFile instanceof File && siteLogoFile.size > 0) {

        settings[SETTING_KEYS.siteLogo] = await saveSiteImage(siteLogoFile, "logo");

      } else if (formData.get("removeSiteLogo") === "true") {

        settings[SETTING_KEYS.siteLogo] = "";

      }



      if (faviconFile instanceof File && faviconFile.size > 0) {

        settings[SETTING_KEYS.favicon] = await saveSiteImage(faviconFile, "favicon");

      } else if (formData.get("removeFavicon") === "true") {

        settings[SETTING_KEYS.favicon] = "";

      }



      const entries = Object.entries(settings).filter(([key]) =>

        ALL_KEYS.includes(key as (typeof ALL_KEYS)[number])

      );



      if (entries.length === 0) {

        return NextResponse.json({ error: "No valid settings provided" }, { status: 400 });

      }



      const payload = Object.fromEntries(entries);

      const validation = validateSettingsPayload(payload);

      if (!validation.valid) {

        return jsonFieldErrors(validation.errors);

      }



      const saved = await persistSettings(entries);

      return NextResponse.json(saved);

    }



    const body = await req.json();

    const settings = body.settings as Record<string, string> | undefined;



    if (!settings || typeof settings !== "object") {

      return NextResponse.json({ error: "Settings object is required" }, { status: 400 });

    }



    const entries = Object.entries(settings).filter(([key]) =>

      ALL_KEYS.includes(key as (typeof ALL_KEYS)[number])

    );



    if (entries.length === 0) {

      return NextResponse.json({ error: "No valid settings provided" }, { status: 400 });

    }



    const payload = Object.fromEntries(entries);

    const validation = validateSettingsPayload(payload);

    if (!validation.valid) {

      return jsonFieldErrors(validation.errors);

    }



    const saved = await persistSettings(entries);

    return NextResponse.json(saved);

  } catch (error) {

    console.error("Settings PUT error:", error);

    return NextResponse.json(

      { error: error instanceof Error ? error.message : "Failed to save settings" },

      { status: 500 }

    );

  }

}

