import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";
import { prisma } from "@/lib/prisma";
import {
  SETTING_KEYS,
  SMTP_SETTING_KEYS,
  settingsRecordToMap,
} from "@/lib/settings";
import { validateEmail } from "@/lib/validators";

export type SmtpConfig = {
  host: string;
  port: number;
  user: string;
  pass: string;
  from: string;
  secure: boolean;
  adminEmail: string;
  siteName?: string;
};

export type SmtpStatus =
  | { configured: true; source: "settings" | "env"; config: SmtpConfig }
  | { configured: false; reason: string };

async function loadSmtpSettings(): Promise<Record<string, string>> {
  const rows = await prisma.siteSetting.findMany({
    where: {
      key: {
        in: [...SMTP_SETTING_KEYS, SETTING_KEYS.siteName],
      },
    },
  });
  return settingsRecordToMap(rows);
}

export function buildSmtpConfigFromMap(
  settings: Record<string, string>
): SmtpConfig | null {
  const host = settings[SETTING_KEYS.smtpHost]?.trim() ?? "";
  const port = Number.parseInt(settings[SETTING_KEYS.smtpPort]?.trim() ?? "", 10);
  const user = settings[SETTING_KEYS.smtpUser]?.trim() ?? "";
  const pass = settings[SETTING_KEYS.smtpPass]?.trim() ?? "";
  const rawFrom = settings[SETTING_KEYS.smtpFrom]?.trim() ?? "";
  const from = rawFrom || (validateEmail(user) ? user : "");
  const siteName = settings[SETTING_KEYS.siteName]?.trim() || undefined;

  if (!host || !Number.isInteger(port) || port <= 0 || port > 65535 || !user || !pass || !from) {
    return null;
  }

  const adminEmailRaw = settings[SETTING_KEYS.smtpAdminEmail]?.trim() ?? "";

  return {
    host,
    port,
    user,
    pass,
    from,
    secure: settings[SETTING_KEYS.smtpSecure] === "true",
    adminEmail: adminEmailRaw || process.env.ADMIN_EMAIL?.trim() || from,
    siteName,
  };
}

export async function getSmtpStatus(): Promise<SmtpStatus> {
  const settings = await loadSmtpSettings();
  const enabledFlag = settings[SETTING_KEYS.smtpEnabled];
  const hasAnySettingsCredentials = Boolean(
    settings[SETTING_KEYS.smtpHost]?.trim() ||
      settings[SETTING_KEYS.smtpUser]?.trim() ||
      settings[SETTING_KEYS.smtpPass]?.trim() ||
      settings[SETTING_KEYS.smtpFrom]?.trim()
  );

  if (enabledFlag === "true") {
    const config = buildSmtpConfigFromMap(settings);
    if (config) {
      return { configured: true, source: "settings", config };
    }

    return {
      configured: false,
      reason:
        "SMTP is enabled in Admin Settings → SMTP, but one or more fields (Host, Port, Username, Password, or From Email) are incomplete.",
    };
  }

  if (enabledFlag === "false" && hasAnySettingsCredentials) {
    return {
      configured: false,
      reason:
        "SMTP email is currently disabled in Admin Settings → SMTP. Please enable 'Enable SMTP email' and save settings.",
    };
  }

  const envUser = process.env.EMAIL_USER?.trim();
  const envPass = process.env.EMAIL_PASS?.trim();

  if (envUser && envPass && enabledFlag !== "false") {
    return {
      configured: true,
      source: "env",
      config: {
        host: process.env.SMTP_HOST?.trim() || "smtp.gmail.com",
        port: Number.parseInt(process.env.SMTP_PORT?.trim() || "465", 10) || 465,
        user: envUser,
        pass: envPass,
        from: process.env.SMTP_FROM?.trim() || envUser,
        secure: process.env.SMTP_SECURE ? process.env.SMTP_SECURE === "true" : true,
        adminEmail: process.env.ADMIN_EMAIL?.trim() || envUser,
        siteName: settings[SETTING_KEYS.siteName]?.trim() || undefined,
      },
    };
  }

  return {
    configured: false,
    reason:
      "Outgoing email is not configured. Please configure and enable SMTP in Admin Settings → SMTP.",
  };
}

export async function getSmtpConfig(): Promise<SmtpConfig | null> {
  const status = await getSmtpStatus();
  return status.configured ? status.config : null;
}

export function createTransporterFromConfig(config: SmtpConfig): Transporter {
  // Port 465 always expects implicit TLS; ports 587/25/2525 expect plain start + STARTTLS.
  const useSecure =
    config.port === 465
      ? true
      : config.port === 587 || config.port === 25 || config.port === 2525
        ? false
        : config.secure;
  const requireTls =
    !useSecure && (config.port === 587 || (config.secure && config.port !== 25));

  return nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: useSecure,
    ...(requireTls ? { requireTLS: true } : {}),
    connectionTimeout: 15000,
    greetingTimeout: 15000,
    socketTimeout: 20000,
    tls: {
      minVersion: "TLSv1.2",
    },
    auth: {
      user: config.user,
      pass: config.pass,
    },
  });
}

export async function createMailTransporter(): Promise<Transporter | null> {
  const config = await getSmtpConfig();
  if (!config) return null;
  return createTransporterFromConfig(config);
}

export function formatRejectedRecipients(rejected: unknown): string {
  if (!Array.isArray(rejected) || rejected.length === 0) {
    return "";
  }
  return rejected
    .map((entry: unknown) => {
      if (typeof entry === "string") return entry;
      if (entry && typeof entry === "object" && "address" in entry) {
        return String((entry as { address?: unknown }).address ?? "");
      }
      return String(entry ?? "");
    })
    .filter(Boolean)
    .join(", ");
}

export function formatSmtpFromAddress(config: SmtpConfig): string {
  const cleanFrom = config.from.trim();
  if (!cleanFrom) return cleanFrom;
  if (cleanFrom.includes("<") && cleanFrom.includes(">")) {
    return cleanFrom;
  }
  const cleanSiteName = config.siteName?.replace(/"/g, "").trim();
  return cleanSiteName ? `"${cleanSiteName}" <${cleanFrom}>` : cleanFrom;
}

export async function getMailFromAddress(): Promise<string | undefined> {
  const config = await getSmtpConfig();
  return config ? formatSmtpFromAddress(config) : undefined;
}

export async function getAdminNotificationEmail(): Promise<string | undefined> {
  const config = await getSmtpConfig();
  return config?.adminEmail;
}

export function resolveAppBaseUrl(req?: Request): string {
  if (req) {
    const forwardedHost = req.headers.get("x-forwarded-host")?.split(",")[0]?.trim();
    const host = forwardedHost || req.headers.get("host")?.trim();
    if (host) {
      const forwardedProto = req.headers.get("x-forwarded-proto")?.split(",")[0]?.trim();
      let protocol = forwardedProto;
      if (!protocol) {
        try {
          protocol = new URL(req.url).protocol.replace(":", "");
        } catch {
          protocol = host.includes("localhost") || host.startsWith("127.") ? "http" : "https";
        }
      }
      return `${protocol}://${host}`.replace(/\/+$/, "");
    }

    try {
      const origin = new URL(req.url).origin;
      if (origin && origin !== "null") {
        return origin.replace(/\/+$/, "");
      }
    } catch {
      // Fall back to environment URL below
    }
  }

  return (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/+$/, "");
}
