import { NextResponse } from "next/server";
import { createCaptchaChallenge } from "@/lib/captcha";

export const dynamic = "force-dynamic";

export async function GET() {
  const challenge = createCaptchaChallenge();
  return NextResponse.json(challenge, {
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate",
    },
  });
}

