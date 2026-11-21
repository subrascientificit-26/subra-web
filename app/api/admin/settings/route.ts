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
import {
  buildSmtpConfigFromMap,
  createTransporterFromConfig,
  formatRejectedRecipients,
  formatSmtpFromAddress,
} from "@/lib/smtp";
import { validateEmail } from "@/lib/validators";
import { escapeEmailHtml } from "@/lib/mail";
import { emitRealtimeUpdate } from "@/lib/realtime";



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



  const result = await getSettingsMap(entries.map(([key]) => key));

  emitRealtimeUpdate(["settings"], "settings-updated");

  return result;

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

export async function POST(req: Request) {
  const auth = await requireAdmin(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = (await req.json()) as {
      toEmail?: string;
      settings?: Record<string, string>;
    };

    const saved = await getSettingsMap([...SMTP_SETTING_KEYS, SETTING_KEYS.siteName]);
    const incoming =
      body.settings && typeof body.settings === "object" ? body.settings : {};

    const merged: Record<string, string> = { ...saved };
    for (const key of [...SMTP_SETTING_KEYS, SETTING_KEYS.siteName]) {
      if (typeof incoming[key] === "string") {
        merged[key] = incoming[key];
      }
    }

    const validation = validateSmtpSettings({
      ...merged,
      [SETTING_KEYS.smtpEnabled]: "true",
    });
    if (!validation.valid) {
      return jsonFieldErrors(validation.errors);
    }

    const config = buildSmtpConfigFromMap(merged);
    if (!config) {
      return NextResponse.json(
        { error: "Please complete all required SMTP settings before testing." },
        { status: 400 }
      );
    }

    const recipient = (
      body.toEmail?.trim() ||
      auth.user.email ||
      config.adminEmail ||
      config.from
    ).trim();

    if (!validateEmail(recipient)) {
      return NextResponse.json(
        { error: "Please enter a valid recipient email for the SMTP test." },
        { status: 400 }
      );
    }

    const transporter = createTransporterFromConfig(config);
    await transporter.verify();

    const brandName = config.siteName?.trim() || "Subra Scientific";
    const info = await transporter.sendMail({
      from: formatSmtpFromAddress(config),
      to: recipient,
      subject: `SMTP Test Email - ${brandName}`,
      text: `${brandName} SMTP Test: Your SMTP settings are working correctly. Host: ${config.host}, Port: ${config.port}.`,
      html: `
        <div style="font-family:Segoe UI,Arial,sans-serif;max-width:560px;margin:20px auto;border:1px solid #e5e7eb;border-radius:10px;overflow:hidden;background:#ffffff;color:#111827;">
          <div style="background:linear-gradient(135deg,#1f8dff,#005fe0);color:#ffffff;padding:24px;text-align:center;">
            <h2 style="margin:0;font-size:22px;">${escapeEmailHtml(brandName)}</h2>
            <p style="margin:6px 0 0;font-size:13px;opacity:0.9;">SMTP Configuration Test</p>
          </div>
          <div style="padding:24px;font-size:15px;line-height:1.6;">
            <p style="margin-top:0;">Your SMTP settings are working correctly.</p>
            <p style="margin-bottom:0;color:#4b5563;font-size:13px;">
              Host: <strong>${escapeEmailHtml(config.host)}</strong> &bull; Port: <strong>${config.port}</strong>
            </p>
          </div>
        </div>
      `,
    });

    const rejectedList = formatRejectedRecipients(info.rejected);
    if (rejectedList) {
      return NextResponse.json(
        { error: `SMTP server rejected recipient: ${rejectedList}` },
        { status: 502 }
      );
    }

    const isEnabled = merged[SETTING_KEYS.smtpEnabled] === "true";

    return NextResponse.json({
      message: `Test email sent to ${recipient} (check Inbox and Spam).`,
      smtpResponse: info.response,
      warning: isEnabled
        ? undefined
        : "SMTP connection succeeded, but 'Enable SMTP email' is currently off. Turn it on and click Save Settings to send registration emails.",
    });
  } catch (error) {
    console.error("SMTP test email error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to send test email. Please check your SMTP credentials.",
      },
      { status: 502 }
    );
  }
}

