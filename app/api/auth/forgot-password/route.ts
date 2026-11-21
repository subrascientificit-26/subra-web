import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import { NextResponse } from "next/server";
import { sendResetPasswordEmail } from "@/lib/mail";
import { getSmtpStatus, resolveAppBaseUrl } from "@/lib/smtp";
import { validateEmail } from "@/lib/validators";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const normalizedEmail =
      typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";

    // VALIDATION
    if (!normalizedEmail) {
      return NextResponse.json(
        {
          error: "Email required",
        },
        { status: 400 }
      );
    }

    if (!validateEmail(normalizedEmail)) {
      return NextResponse.json(
        {
          error: "Enter a valid email address",
        },
        { status: 400 }
      );
    }

    // FIND USER
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      return NextResponse.json(
        {
          error: "User not found",
        },
        { status: 404 }
      );
    }

    const smtpStatus = await getSmtpStatus();
    if (!smtpStatus.configured) {
      return NextResponse.json(
        { error: smtpStatus.reason },
        { status: 503 }
      );
    }

    // TOKEN
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExpiry = new Date(Date.now() + 3600000);

    // SAVE TOKEN
    await prisma.user.update({
      where: { email: normalizedEmail },
      data: {
        resetToken,
        resetTokenExpiry,
      },
    });

    // SEND MAIL
    try {
      await sendResetPasswordEmail(
        normalizedEmail,
        resetToken,
        resolveAppBaseUrl(req)
      );
    } catch (mailError) {
      await prisma.user
        .update({
          where: { email: normalizedEmail },
          data: {
            resetToken: null,
            resetTokenExpiry: null,
          },
        })
        .catch((rollbackErr) =>
          console.error("Failed to rollback reset token:", rollbackErr)
        );

      const message =
        mailError instanceof Error ? mailError.message : "Failed to send reset email";
      return NextResponse.json(
        { error: `Could not send reset email: ${message}` },
        { status: 502 }
      );
    }

    return NextResponse.json(
      {
        message: "Reset password email sent",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Forgot password error:", error);

    return NextResponse.json(
      {
        error: "Server error",
      },
      { status: 500 }
    );
  }
}
