import { prisma } from "@/lib/prisma";

import bcrypt from "bcrypt";

import { NextResponse } from "next/server";

export async function POST(req: Request) {

  try {

    const body = await req.json();

    const {
      token,
      password,
    } = body;

    console.log("TOKEN:", token);

    // VALIDATION
    if (!token || !password) {

      return NextResponse.json(
        {
          error:
            "Token and password required",
        },
        { status: 400 }
      );
    }

    // FIND USER
    const user =
      await prisma.user.findFirst({
        where: {
          resetToken: token,
        },
      });

    console.log("USER:", user);

    if (!user) {

      return NextResponse.json(
        {
          error:
            "Invalid reset token",
        },
        { status: 400 }
      );
    }

    // CHECK EXPIRY
    if (
      !user.resetTokenExpiry ||
      user.resetTokenExpiry <
      new Date()
    ) {

      return NextResponse.json(
        {
          error:
            "Reset token expired",
        },
        { status: 400 }
      );
    }

    // HASH PASSWORD
    const hashedPassword =
      await bcrypt.hash(password, 10);

    // UPDATE PASSWORD
    await prisma.user.update({
      where: {
        id: user.id,
      },

      data: {
        password: hashedPassword,

        resetToken: null,

        resetTokenExpiry: null,
      },
    });

    return NextResponse.json(
      {
        message:
          "Password reset successful",
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