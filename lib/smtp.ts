import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";
import { prisma } from "@/lib/prisma";
import {
  SETTING_KEYS,
  SMTP_SETTING_KEYS,
  settingsRecordToMap,
} from "@/lib/settings";

export type SmtpConfig = {
  host: string;
  port: number;
  user: string;
  pass: string;
  from: string;
  secure: boolean;
  adminEmail: string;
};

async function loadSmtpSettings(): Promise<Record<string, string>> {
  const rows = await prisma.siteSetting.findMany({
    where: { key: { in: [...SMTP_SETTING_KEYS] } },
  });
  return settingsRecordToMap(rows);
}

export async function getSmtpConfig(): Promise<SmtpConfig | null> {
  const settings = await loadSmtpSettings();
  const enabled = settings[SETTING_KEYS.smtpEnabled] === "true";

  if (enabled) {
    const host = settings[SETTING_KEYS.smtpHost]?.trim();
    const port = Number.parseInt(settings[SETTING_KEYS.smtpPort] ?? "", 10);
    const user = settings[SETTING_KEYS.smtpUser]?.trim();
    const pass = settings[SETTING_KEYS.smtpPass]?.trim();
    const from = settings[SETTING_KEYS.smtpFrom]?.trim();

    if (host && port && user && pass && from) {
      return {
        host,
        port,
        user,
        pass,
        from,
        secure: settings[SETTING_KEYS.smtpSecure] === "true",
        adminEmail:
          settings[SETTING_KEYS.smtpAdminEmail]?.trim() ||
          process.env.ADMIN_EMAIL ||
          from,
      };
    }
  }

  const envUser = process.env.EMAIL_USER?.trim();
  const envPass = process.env.EMAIL_PASS?.trim();

  if (envUser && envPass) {
    return {
      host: "smtp.gmail.com",
      port: 465,
      user: envUser,
      pass: envPass,
      from: envUser,
      secure: true,
      adminEmail: process.env.ADMIN_EMAIL?.trim() || envUser,
    };
  }

  return null;
}

export async function createMailTransporter(): Promise<Transporter | null> {
  const config = await getSmtpConfig();
  if (!config) return null;

  return nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: {
      user: config.user,
      pass: config.pass,
    },
  });
}

export async function getMailFromAddress(): Promise<string | undefined> {
  const config = await getSmtpConfig();
  return config?.from;
}

export async function getAdminNotificationEmail(): Promise<string | undefined> {
  const config = await getSmtpConfig();
  return config?.adminEmail;
}
