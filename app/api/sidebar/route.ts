import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { NextResponse } from "next/server";
import {
  DUPLICATE_ERRORS,
  findDuplicateSidebarItem,
} from "@/lib/duplicateNames";

type SidebarSection =
  | "navbar"
  | "footer"
  | "footer_service"
  | "products_sidebar"
  | "admin";

function parseSection(value: string | null): SidebarSection | null {
  if (
    value === "navbar" ||
    value === "footer" ||
    value === "footer_service" ||
    value === "products_sidebar" ||
    value === "admin"
  ) {
    return value;
  }
  return null;
}

function buildTree<T extends { id: number; parentId: number | null; children?: T[] }>(
  items: T[]
) {
  const map = new Map<number, T & { children: T[] }>();
  const roots: (T & { children: T[] })[] = [];

  items.forEach((item) => {
    map.set(item.id, { ...item, children: [] });
  });

  map.forEach((item) => {
    if (item.parentId && map.has(item.parentId)) {
      map.get(item.parentId)!.children.push(item);
    } else {
      roots.push(item);
    }
  });

  return roots;
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const section = parseSection(searchParams.get("section"));
    const includeInactive = searchParams.get("includeInactive") === "true";

    const items = await prisma.sidebarItem.findMany({
      where: {
        ...(section ? { section } : {}),
        ...(!includeInactive ? { isActive: true } : {}),
      },
      orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
    });

    if (searchParams.get("tree") === "true") {
      return NextResponse.json(buildTree(items));
    }

    return NextResponse.json(items);
  } catch (error) {
    console.error("Sidebar GET error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to load sidebar items. Run: npx prisma generate",
      },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  const auth = await requireAdmin(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await req.json();
    const label = String(body.label ?? "").trim();
    const href = String(body.href ?? "").trim();
    const section = parseSection(String(body.section ?? "navbar")) ?? "navbar";
    const parentId = body.parentId ? Number(body.parentId) : null;
    const sortOrder = Number(body.sortOrder ?? 0);
    const isActive = body.isActive !== false;

    if (!label || !href) {
      return NextResponse.json(
        { error: "Label and href are required" },
        { status: 400 }
      );
    }

    const duplicate = await findDuplicateSidebarItem(label, section, parentId);
    if (duplicate) {
      return NextResponse.json({ error: DUPLICATE_ERRORS.sidebar }, { status: 409 });
    }

    const item = await prisma.sidebarItem.create({
      data: {
        label,
        href,
        section,
        parentId,
        sortOrder: Number.isFinite(sortOrder) ? sortOrder : 0,
        isActive,
      },
    });

    return NextResponse.json(item);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create sidebar item" },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  const auth = await requireAdmin(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await req.json();
    const id = Number(body.id);
    const label = String(body.label ?? "").trim();
    const href = String(body.href ?? "").trim();
    const section = parseSection(String(body.section ?? "navbar")) ?? "navbar";
    const parentId = body.parentId ? Number(body.parentId) : null;
    const sortOrder = Number(body.sortOrder ?? 0);
    const isActive = body.isActive !== false;

    if (!id || !label || !href) {
      return NextResponse.json(
        { error: "ID, label and href are required" },
        { status: 400 }
      );
    }

    if (parentId === id) {
      return NextResponse.json(
        { error: "An item cannot be its own parent" },
        { status: 400 }
      );
    }

    const duplicate = await findDuplicateSidebarItem(label, section, parentId, id);
    if (duplicate) {
      return NextResponse.json({ error: DUPLICATE_ERRORS.sidebar }, { status: 409 });
    }

    const item = await prisma.sidebarItem.update({
      where: { id },
      data: {
        label,
        href,
        section,
        parentId,
        sortOrder: Number.isFinite(sortOrder) ? sortOrder : 0,
        isActive,
      },
    });

    return NextResponse.json(item);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update sidebar item" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  const auth = await requireAdmin(req);
  if (auth instanceof NextResponse) return auth;

  const { searchParams } = new URL(req.url);
  const id = Number(searchParams.get("id"));

  if (!id) {
    return NextResponse.json({ error: "ID is required" }, { status: 400 });
  }

  await prisma.sidebarItem.delete({ where: { id } });

  return NextResponse.json({ message: "Deleted" });
}
