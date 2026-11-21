import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { NextResponse } from "next/server";
import { DELETE_MESSAGES } from "@/lib/messages";
import { emitRealtimeUpdate } from "@/lib/realtime";

function parseIdFromReq(req: Request, context: any) {
  const paramId = context?.params?.id;

  if (paramId) {
    const n = Number(paramId);
    if (!Number.isNaN(n)) return n;
  }

  try {
    const url = new URL(req.url);
    const parts = url.pathname.split("/").filter(Boolean);
    const last = parts[parts.length - 1];
    const n = Number(last);
    if (!Number.isNaN(n)) return n;
  } catch (e) {
    // ignore
  }

  return null;
}

export async function GET(req: Request, context: any) {
  const id = parseIdFromReq(req, context);

  if (!id) {
    return Response.json({ error: "Invalid ID" }, { status: 400 });
  }

  const category = await prisma.category.findUnique({
    where: { id },
    include: { subcategories: true },
  });

  if (!category) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  return Response.json(category);
}

// DELETE CATEGORY (BLOCK if subcategories exist)
export async function DELETE(req: Request, context: any) {
  const auth = await requireAdmin(req);
  if (auth instanceof NextResponse) return auth;

  const id = parseIdFromReq(req, context);

  if (!id) return Response.json({ error: "Invalid ID" }, { status: 400 });

  const category = await prisma.category.findUnique({
    where: { id },
    include: {
      subcategories: {
        include: {
          products: {
            where: { isDeleted: false },
            select: { id: true },
          },
        },
      },
    },
  });

  if (!category) {
    return Response.json({ error: "Category not found" }, { status: 404 });
  }

  if (category.subcategories.length > 0) {
    const subNames = category.subcategories.map((sub) => sub.name);
    const productCount = category.subcategories.reduce(
      (sum, sub) => sum + sub.products.length,
      0
    );

    if (productCount > 0) {
      return Response.json(
        { error: DELETE_MESSAGES.categoryHasProducts(productCount) },
        { status: 400 }
      );
    }

    return Response.json(
      {
        error: DELETE_MESSAGES.categoryHasSubcategories(
          category.subcategories.length,
          subNames
        ),
      },
      { status: 400 }
    );
  }

  await prisma.category.delete({
    where: { id },
  });

  emitRealtimeUpdate(["categories", "subcategories", "products", "dashboard"], "category-deleted");

  return Response.json({ message: "Category deleted" });
}