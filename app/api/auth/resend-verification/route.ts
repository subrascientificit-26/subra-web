import crypto from "crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateEmail } from "@/lib/validators";
import { API_ERRORS } from "@/lib/constants";
import { sendVerificationEmail } from "@/lib/mail";
import { getSmtpStatus, resolveAppBaseUrl } from "@/lib/smtp";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const normalizedEmail =
      typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";

    if (!normalizedEmail) {
      return NextResponse.json(
        { error: API_ERRORS.EMAIL_REQUIRED },
        { status: 400 }
      );
    }

    if (!validateEmail(normalizedEmail)) {
      return NextResponse.json(
        { error: API_ERRORS.EMAIL_INVALID },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      return NextResponse.json(
        { error: "No account found for this email. Please register first." },
        { status: 404 }
      );
    }

    if (user.emailVerified) {
      return NextResponse.json(
        { error: "This email is already verified. You can log in directly." },
        { status: 400 }
      );
    }

    const smtpStatus = await getSmtpStatus();
    if (!smtpStatus.configured) {
      return NextResponse.json(
        { error: smtpStatus.reason },
        { status: 503 }
      );
    }

    const previousToken = user.verificationToken;
    const previousExpiry = user.verificationExpiry;
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const verificationExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        verificationToken,
        verificationExpiry,
      },
    });

    try {
      await sendVerificationEmail(
        normalizedEmail,
        verificationToken,
        resolveAppBaseUrl(req)
      );
    } catch (mailError) {
      await prisma.user
        .update({
          where: { id: user.id },
          data: {
            verificationToken: previousToken,
            verificationExpiry: previousExpiry,
          },
        })
        .catch((rollbackErr) =>
          console.error("Failed to rollback resend verification token:", rollbackErr)
        );

      const message =
        mailError instanceof Error
          ? mailError.message
          : "Failed to send verification email";
      return NextResponse.json(
        { error: `Could not send verification email: ${message}` },
        { status: 502 }
      );
    }

    return NextResponse.json(
      {
        message: `Verification email resent to ${normalizedEmail}. Please check your Inbox and Spam folder.`,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Resend verification error:", error);
    return NextResponse.json(
      { error: API_ERRORS.SERVER_ERROR },
      { status: 500 }
    );
  }
}

