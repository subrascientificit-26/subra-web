import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const { id: rawId } = await params;
    const id = Number(rawId);
    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json({ error: "Invalid external product ID" }, { status: 400 });
    }

    const item = await prisma.externalProduct.findUnique({
      where: { id },
    });

    if (!item) {
      return NextResponse.json({ error: "External product not found" }, { status: 404 });
    }

    return NextResponse.json(item);
  } catch (error) {
    console.error("External product GET by ID error:", error);
    return NextResponse.json(
      { error: "Failed to load external product" },
      { status: 500 }
    );
  }
}

