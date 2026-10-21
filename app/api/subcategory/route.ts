import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import {
  DUPLICATE_ERRORS,
  findDuplicateSubCategory,
} from "@/lib/duplicateNames";
import { DELETE_MESSAGES } from "@/lib/messages";

// GET
export async function GET() {
  const data = await prisma.subCategory.findMany({
    include: {
      category: true,
      _count: {
        select: { products: { where: { isDeleted: false } } },
      },
    },
    orderBy: { id: "desc" },
  });

  return Response.json(data);
}

// CREATE
export async function POST(req: Request) {
  const auth = await requireAdmin(req);
  if (auth instanceof NextResponse) return auth;

  const formData = await req.formData();

  const name = formData.get("name")?.toString() ?? "";
  const description = formData.get("description")?.toString();
  const categoryId = Number(formData.get("categoryId"));
  const image = formData.get("image");

  if (!name) {
    return Response.json(
      { error: "Name is required" },
      { status: 400 }
    );
  }

  if (!categoryId) {
    return Response.json({ error: "Category is required" }, { status: 400 });
  }

  const duplicate = await findDuplicateSubCategory(name, categoryId);
  if (duplicate) {
    return Response.json({ error: DUPLICATE_ERRORS.subcategory }, { status: 409 });
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

  const sub = await prisma.subCategory.create({
    data: {
      name,
      description,
      image: imagePath,
      categoryId
    }
  });

  return Response.json(sub);
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
    const categoryId = Number(formData.get("categoryId"));
    const image = formData.get("image");

    if (!id || !name) {
      return Response.json(
        { error: "ID and Name required" },
        { status: 400 }
      );
    }

    const existing = await prisma.subCategory.findUnique({
      where: { id },
      select: { categoryId: true },
    });
    const targetCategoryId = categoryId || existing?.categoryId;

    if (!targetCategoryId) {
      return Response.json({ error: "Category is required" }, { status: 400 });
    }

    const duplicate = await findDuplicateSubCategory(name, targetCategoryId, id);
    if (duplicate) {
      return Response.json({ error: DUPLICATE_ERRORS.subcategory }, { status: 409 });
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

    const updated = await prisma.subCategory.update({
      where: { id },
      data: {
        name,
        description,
        categoryId: categoryId || undefined,
        ...(imagePath && { image: imagePath })
      },
      include: { category: true }
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

  const sub = await prisma.subCategory.findUnique({
    where: { id },
    include: {
      products: {
        where: { isDeleted: false },
        select: { id: true, name: true },
      },
    },
  });

  if (!sub) {
    return Response.json({ error: "Subcategory not found" }, { status: 404 });
  }

  if (sub.products.length > 0) {
    const productNames = sub.products.map((product) => product.name);
    return Response.json(
      {
        error: DELETE_MESSAGES.subcategoryHasProducts(
          sub.products.length,
          productNames
        ),
      },
      { status: 400 }
    );
  }

  await prisma.subCategory.delete({ where: { id } });

  return Response.json({ message: "Deleted" });
}