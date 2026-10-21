import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import {
  DUPLICATE_ERRORS,
  findDuplicateCategory,
} from "@/lib/duplicateNames";
import { DELETE_MESSAGES } from "@/lib/messages";

// GET ALL
export async function GET() {
  const data = await prisma.category.findMany({
    include: {
      subcategories: {
        include: {
          _count: {
            select: { products: { where: { isDeleted: false } } },
          },
        },
      },
    },
    orderBy: { id: "desc" },
  });

  const enriched = data.map((category) => ({
    ...category,
    productCount: category.subcategories.reduce(
      (sum, sub) => sum + sub._count.products,
      0
    ),
  }));

  return Response.json(enriched);
}

// CREATE
export async function POST(req: Request) {
  const auth = await requireAdmin(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const formData = await req.formData();

    const name = formData.get("name")?.toString();
    const description = formData.get("description")?.toString();
    const image = formData.get("image");

    if (!name) {
      return Response.json({ error: "Name required" }, { status: 400 });
    }

    const duplicate = await findDuplicateCategory(name);
    if (duplicate) {
      return Response.json({ error: DUPLICATE_ERRORS.category }, { status: 409 });
    }

    const uploadDir = path.join(process.cwd(), "public/uploads");
    await mkdir(uploadDir, { recursive: true });

    let imagePath = null;

    if (image instanceof File && image.size > 0) {
      const bytes = await image.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const fileName = `${Date.now()}-${image.name.replace(/\s/g, "-")}`;
      const filePath = path.join(uploadDir, fileName);

      await writeFile(filePath, buffer);

      imagePath = `/uploads/${fileName}`;
    }

    const category = await prisma.category.create({
      data: { name, description, image: imagePath }
    });

    return Response.json(category);
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

// UPDATE
export async function PUT(req: Request) {
  const auth = await requireAdmin(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const formData = await req.formData();

    const id = Number(formData.get("id"));
    const name = formData.get("name")?.toString();
    const description = formData.get("description")?.toString();
    const image = formData.get("image");

    if (!id || !name) {
      return Response.json(
        { error: "ID and Name required" },
        { status: 400 }
      );
    }

    const duplicate = await findDuplicateCategory(name, id);
    if (duplicate) {
      return Response.json({ error: DUPLICATE_ERRORS.category }, { status: 409 });
    }

    const uploadDir = path.join(process.cwd(), "public/uploads");
    await mkdir(uploadDir, { recursive: true });

    let imagePath = null;

    if (image instanceof File && image.size > 0) {
      const bytes = await image.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const fileName = `${Date.now()}-${image.name.replace(/\s/g, "-")}`;
      const filePath = path.join(uploadDir, fileName);

      await writeFile(filePath, buffer);

      imagePath = `/uploads/${fileName}`;
    }

    const updated = await prisma.category.update({
      where: { id },
      data: {
        name,
        description,
        ...(imagePath && { image: imagePath })
      }
    });

    return Response.json(updated);
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

// DELETE (SAFE)
export async function DELETE(req: Request) {
  const auth = await requireAdmin(req);
  if (auth instanceof NextResponse) return auth;

  const { searchParams } = new URL(req.url);
  const id = Number(searchParams.get("id"));

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

  await prisma.category.delete({ where: { id } });

  return Response.json({ message: "Deleted" });
}