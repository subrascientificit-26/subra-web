import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, requireAuth } from "@/lib/auth";
import { validateExternalProductInput } from "@/lib/externalProducts";
import { emitRealtimeUpdate } from "@/lib/realtime";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const items = await prisma.externalProduct.findMany({
      orderBy: { id: "desc" },
    });
    return NextResponse.json(items);
  } catch (error) {
    console.error("External products GET error:", error);
    return NextResponse.json(
      { error: "Failed to load external products" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  const auth = await requireAdmin(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await req.json();
    const validation = validateExternalProductInput(body ?? {});
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.errors[0], errors: validation.errors },
        { status: 400 }
      );
    }

    const existing = await prisma.externalProduct.findUnique({
      where: { productCode: validation.data.productCode },
      select: { id: true },
    });

    if (existing) {
      return NextResponse.json(
        { error: `Product Code "${validation.data.productCode}" already exists.` },
        { status: 409 }
      );
    }

    const created = await prisma.externalProduct.create({
      data: validation.data,
    });

    emitRealtimeUpdate(["external-products"], "external-product-created");

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error("External product POST error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create external product" },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  const auth = await requireAdmin(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await req.json();
    const id = Number(body?.id);
    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json(
        { error: "Valid external product ID is required" },
        { status: 400 }
      );
    }

    const validation = validateExternalProductInput(body ?? {});
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.errors[0], errors: validation.errors },
        { status: 400 }
      );
    }

    const existing = await prisma.externalProduct.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!existing) {
      return NextResponse.json(
        { error: "External product not found" },
        { status: 404 }
      );
    }

    const duplicate = await prisma.externalProduct.findFirst({
      where: {
        productCode: validation.data.productCode,
        NOT: { id },
      },
      select: { id: true },
    });
    if (duplicate) {
      return NextResponse.json(
        { error: `Product Code "${validation.data.productCode}" already exists.` },
        { status: 409 }
      );
    }

    const updated = await prisma.externalProduct.update({
      where: { id },
      data: validation.data,
    });

    emitRealtimeUpdate(["external-products"], "external-product-updated");

    return NextResponse.json(updated);
  } catch (error) {
    console.error("External product PUT error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update external product" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  const auth = await requireAdmin(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const { searchParams } = new URL(req.url);
    const id = Number(searchParams.get("id"));
    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json(
        { error: "Valid external product ID is required" },
        { status: 400 }
      );
    }

    const existing = await prisma.externalProduct.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!existing) {
      return NextResponse.json(
        { error: "External product not found" },
        { status: 404 }
      );
    }

    await prisma.externalProduct.delete({ where: { id } });

    emitRealtimeUpdate(["external-products"], "external-product-deleted");

    return NextResponse.json({
      success: true,
      message: "External product deleted successfully",
    });
  } catch (error) {
    console.error("External product DELETE error:", error);
    return NextResponse.json(
      { error: "Failed to delete external product" },
      { status: 500 }
    );
  }
}

