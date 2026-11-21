import { NextResponse } from "next/server";
import { getPublicSiteSettings } from "@/lib/siteSettings";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return NextResponse.json(await getPublicSiteSettings());  } catch (error) {
    console.error("Public settings GET error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load settings" },
      { status: 500 }
    );
  }
}
