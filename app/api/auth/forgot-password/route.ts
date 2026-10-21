import { prisma } from "@/lib/prisma";

import crypto from "crypto";

import { NextResponse } from "next/server";

import { sendResetPasswordEmail } from "@/lib/mail";

export async function POST(req: Request) {

  try {

    const { email } = await req.json();

    // VALIDATION
    if (!email) {
      return NextResponse.json(
        {
          error: "Email required",
        },
        { status: 400 }
      );
    }

    // FIND USER
    const user =
      await prisma.user.findUnique({
        where: { email },
      });

    if (!user) {
      return NextResponse.json(
        {
          error: "User not found",
        },
        { status: 404 }
      );
    }

    // TOKEN
    const resetToken =
      crypto.randomBytes(32).toString("hex");

    // EXPIRY
    const resetTokenExpiry =
      new Date(Date.now() + 3600000);

    // SAVE TOKEN
    await prisma.user.update({
      where: { email },

      data: {
        resetToken,
        resetTokenExpiry,
      },
    });

    // SEND MAIL
    await sendResetPasswordEmail(
      email,
      resetToken
    );

    return NextResponse.json(
      {
        message:
          "Reset password email sent",
      },
      { status: 200 }
    );

  } catch (error) {

    console.log(error);

    return NextResponse.json(
      {
        error: "Server error",
      },
      { status: 500 }
    );
  }
}