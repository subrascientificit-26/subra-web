import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.redirect(
        new URL("/login?error=invalid-token", req.url)
      );
    }

    const user = await prisma.user.findFirst({
      where: {
        verificationToken: token,
      },
    });

    if (!user) {
      return NextResponse.redirect(
        new URL("/login?error=invalid-token", req.url)
      );
    }

    // CHECK EXPIRY
    if (
      user.verificationExpiry &&
      user.verificationExpiry < new Date()
    ) {
      return NextResponse.redirect(
        new URL("/login?error=token-expired", req.url)
      );
    }

    // VERIFY USER
    await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        emailVerified: true,
        verificationToken: null,
        verificationExpiry: null,
      },
    });

    // REDIRECT TO LOGIN
    return NextResponse.redirect(
      new URL("/login?verified=true", req.url)
    );
  } catch (error) {
    console.error(error);

    return NextResponse.redirect(
      new URL("/login?error=server-error", req.url)
    );
  }
}