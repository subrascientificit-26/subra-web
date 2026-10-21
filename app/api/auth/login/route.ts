import { prisma } from "@/lib/prisma";
import { validateEmail } from "@/lib/validators";
import { API_ERRORS, API_MESSAGES } from "@/lib/constants";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

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

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json(
        { error: API_ERRORS.USER_NOT_FOUND },
        { status: 401 }
      );
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: API_ERRORS.PASSWORD_INVALID },
        { status: 401 }
      );
    }

    if (!process.env.JWT_SECRET) {
      return NextResponse.json(
        { error: API_ERRORS.JWT_SECRET_MISSING },
        { status: 500 }
      );
    }

    // EMAIL VERIFICATION CHECK
if (!user.emailVerified) {
  return NextResponse.json(
    {
      error: "Please verify your email first",
    },
    { status: 401 }
  );
}

    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );

    const response = NextResponse.json(
      {
        message: API_MESSAGES.LOGIN_SUCCESS,
        token: token,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          name: user.name,
          profile: user.profile,
          emailVerified: user.emailVerified,
        },
      },
      { status: 200 }
    );

    response.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: API_ERRORS.SERVER_ERROR },
      { status: 500 }
    );
  }
}