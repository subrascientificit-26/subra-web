import { prisma } from "@/lib/prisma";
import { emitRealtimeUpdate } from "@/lib/realtime";
import { NextResponse } from "next/server";

function parseBoolean(value: unknown, fallback = false) {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (["true", "yes", "y", "1"].includes(normalized)) return true;
    if (["false", "no", "n", "0"].includes(normalized)) return false;
  }
  return fallback;
}

export const dynamic = 'force-dynamic';

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params;
    const id = Number(idParam);

    if (!id || Number.isNaN(id)) {
      return NextResponse.json({ error: "Invalid product ID" }, { status: 400 });
    }

    const body = await req.json().catch(() => ({}));
    const isFavorite = parseBoolean(body?.isFavorite, false);

    const product = await prisma.product.findUnique({ where: { id } });
    if (!product || product.isDeleted) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const updated = await prisma.product.update({
      where: { id },
      data: { isFavorite },
      select: { id: true, isFavorite: true },
    });

    emitRealtimeUpdate(["products"], "product-favorite");

    return NextResponse.json(updated);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to update favorite";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
