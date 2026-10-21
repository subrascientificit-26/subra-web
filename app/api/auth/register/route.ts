import { prisma } from "@/lib/prisma";
import { validateEmail, validatePassword } from "@/lib/validators";
import { API_ERRORS, API_MESSAGES } from "@/lib/constants";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { NextResponse } from "next/server";
import { sendVerificationEmail } from "@/lib/mail";
import { getUsernameFromEmail } from "@/lib/messages";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    // VALIDATION
    if (!email) {
      return NextResponse.json(
        { error: API_ERRORS.EMAIL_REQUIRED },
        { status: 400 }
      );
    }

    if (!validateEmail(email)) {
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

    // CHECK USER
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: API_ERRORS.EMAIL_EXISTS },
        { status: 400 }
      );
    }

    // HASH PASSWORD
    const hashedPassword = await bcrypt.hash(password, 10);

    // GENERATE TOKEN
    const verificationToken = crypto.randomBytes(32).toString("hex");

    const verificationExpiry = new Date(
      Date.now() + 60 * 60 * 1000
    );

    // CREATE USER — username taken from email prefix
    const username = getUsernameFromEmail(email);

    await prisma.user.create({
      data: {
        email,
        name: username,
        password: hashedPassword,
        verificationToken,
        verificationExpiry,
      },
    });

    // SEND MAIL
    await sendVerificationEmail(
      email,
      verificationToken
    );

    return NextResponse.json(
      {
        message:
          "Registration successful. Please verify your email.",
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