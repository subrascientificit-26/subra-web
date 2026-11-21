import { prisma } from "@/lib/prisma";
import { validateEmail, validatePassword } from "@/lib/validators";
import { API_ERRORS } from "@/lib/constants";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { NextResponse } from "next/server";
import { sendVerificationEmail } from "@/lib/mail";
import { getUsernameFromEmail } from "@/lib/messages";
import { getSmtpStatus, resolveAppBaseUrl } from "@/lib/smtp";
import { verifyCaptchaToken } from "@/lib/captcha";
import { emitRealtimeUpdate } from "@/lib/realtime";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const normalizedEmail =
      typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body?.password === "string" ? body.password : "";
    const captchaToken = body?.captchaToken;
    const captchaAnswer = body?.captchaAnswer;

    // VALIDATION
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

    if (!password) {
      return NextResponse.json(
        { error: API_ERRORS.PASSWORD_REQUIRED },
        { status: 400 }
      );
    }

    const passwordValidation = validatePassword(password);

    if (!passwordValidation.valid) {
      return NextResponse.json(
        { error: passwordValidation.error },
        { status: 400 }
      );
    }

    const captchaResult = verifyCaptchaToken(captchaToken, captchaAnswer);
    if (!captchaResult.valid) {
      return NextResponse.json(
        { error: captchaResult.error, code: "CAPTCHA_INVALID" },
        { status: 400 }
      );
    }

    // CHECK USER
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser && existingUser.emailVerified) {
      return NextResponse.json(
        { error: API_ERRORS.EMAIL_EXISTS },
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

    // HASH PASSWORD
    const hashedPassword = await bcrypt.hash(password, 10);

    // GENERATE TOKEN
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const verificationExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const username = getUsernameFromEmail(normalizedEmail);
    const baseUrl = resolveAppBaseUrl(req);

    if (existingUser && !existingUser.emailVerified) {
      const previousState = {
        name: existingUser.name,
        password: existingUser.password,
        verificationToken: existingUser.verificationToken,
        verificationExpiry: existingUser.verificationExpiry,
      };

      await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          name: username,
          password: hashedPassword,
          verificationToken,
          verificationExpiry,
        },
      });

      try {
        await sendVerificationEmail(normalizedEmail, verificationToken, baseUrl);
      } catch (mailError) {
        await prisma.user
          .update({
            where: { id: existingUser.id },
            data: previousState,
          })
          .catch((rollbackErr) =>
            console.error("Failed to rollback unverified user:", rollbackErr)
          );

        const message =
          mailError instanceof Error ? mailError.message : "Failed to send verification email";
        return NextResponse.json(
          { error: `Could not send verification email: ${message}` },
          { status: 502 }
        );
      }

      emitRealtimeUpdate(["users", "dashboard"], "user-registered");

      return NextResponse.json(
        {
          email: normalizedEmail,
          message:
            "Verification email sent. Please check your inbox and spam folder.",
        },
        { status: 200 }
      );
    }

    // CREATE USER — username taken from email prefix
    const createdUser = await prisma.user.create({
      data: {
        email: normalizedEmail,
        name: username,
        password: hashedPassword,
        verificationToken,
        verificationExpiry,
      },
    });

    // SEND MAIL (roll back user if sending fails so the email is not locked out)
    try {
      await sendVerificationEmail(normalizedEmail, verificationToken, baseUrl);
    } catch (mailError) {
      await prisma.user
        .delete({ where: { id: createdUser.id } })
        .catch((cleanupErr) =>
          console.error("Failed to rollback user after email failure:", cleanupErr)
        );

      const message =
        mailError instanceof Error ? mailError.message : "Failed to send verification email";
      return NextResponse.json(
        { error: `Could not send verification email: ${message}` },
        { status: 502 }
      );
    }

    emitRealtimeUpdate(["users", "dashboard"], "user-registered");

    return NextResponse.json(
      {
        email: normalizedEmail,
        message: "Registration successful. Please check your inbox and spam folder to verify your email.",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);

    return NextResponse.json(
      {
        error: API_ERRORS.SERVER_ERROR,
      },
      { status: 500 }
    );
  }
}
