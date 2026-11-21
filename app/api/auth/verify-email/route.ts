import { prisma } from "@/lib/prisma";
import { resolveAppBaseUrl } from "@/lib/smtp";
import { emitRealtimeUpdate } from "@/lib/realtime";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const baseUrl = resolveAppBaseUrl(req);
  try {
    const { searchParams } = new URL(req.url);

    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.redirect(`${baseUrl}/login?error=invalid-token`);
    }

    const user = await prisma.user.findFirst({
      where: {
        verificationToken: token,
      },
    });

    if (!user) {
      return NextResponse.redirect(`${baseUrl}/login?error=invalid-token`);
    }

    // CHECK EXPIRY
    if (
      user.verificationExpiry &&
      user.verificationExpiry < new Date()
    ) {
      return NextResponse.redirect(`${baseUrl}/login?error=token-expired`);
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

    emitRealtimeUpdate(["users", "dashboard"], "user-verified");

    // REDIRECT TO LOGIN
    return NextResponse.redirect(`${baseUrl}/login?verified=true`);
  } catch (error) {
    console.error(error);

    return NextResponse.redirect(`${baseUrl}/login?error=server-error`);
  }
}