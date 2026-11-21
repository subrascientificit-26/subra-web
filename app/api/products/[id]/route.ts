import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { NextResponse } from "next/server";
import {
  saveGalleryProductImages,
  savePrimaryProductImage,
  saveUploadedImages,
  validateUploadedImageFiles,
} from "@/lib/productImages";
import { parseProductDocumentsFromFormData } from "@/lib/productDocuments";
import { parsePackSizeFromFormData } from "@/lib/productPackSizes";
import {
  DUPLICATE_ERRORS,
  findDuplicateProduct,
} from "@/lib/duplicateNames";
import { validateCasNumber } from "@/lib/validators";
import { emitRealtimeUpdate } from "@/lib/realtime";

function parseNumber(value: unknown) {
  if (value === undefined || value === null || value === "") return null;
  const numberValue = Number(value);
  return Number.isNaN(numberValue) ? null : numberValue;
}

function validateString(value: unknown) {
  return typeof value === "string" && value.trim().length > 0;
}

function parseBoolean(value: unknown, fallback = false) {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (["true", "yes", "y", "1"].includes(normalized)) return true;
    if (["false", "no", "n", "0"].includes(normalized)) return false;
  }
  return fallback;
}

function sanitizeSpecifications(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value
    .map((spec: Record<string, unknown>) => ({
      parameter: String(spec?.parameter || spec?.test || "").trim(),
      value: String(spec?.value || spec?.result || "").trim(),
    }))
    .filter((spec) => spec.parameter && spec.value);
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function generateUniqueSlug(name: string, currentId?: number) {
  const base = slugify(name) || `product-${Date.now()}`;
  let slug = base;
  let suffix = 2;

  while (true) {
    const existing = await prisma.product.findFirst({
      where: {
        slug,
        ...(currentId ? { NOT: { id: currentId } } : {}),
      },
    });

    if (!existing) {
      return slug;
    }

    slug = `${base}-${suffix}`;
    suffix += 1;
  }
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const product = await prisma.product.findUnique({
      where: { id: Number(id) },
      include: {
        subCategory: { include: { category: true } },
        specifications: true,
        images: true,
        documents: true,
        packSizes: true,
      },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json(product);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load product";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const { id: idParam } = await params;
    const id = Number(idParam);

    const contentType = req.headers.get("content-type") || "";
    let body: Record<string, unknown> = {};

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      body = {
        name: formData.get("name")?.toString(),
        shortDescription: formData.get("shortDescription")?.toString(),
        description: formData.get("description")?.toString(),
        casNumber: formData.get("casNumber")?.toString(),
        molecularFormula: formData.get("molecularFormula")?.toString(),
        molecularWeight: formData.get("molecularWeight")?.toString(),
        price: formData.get("price")?.toString(),
        stock: formData.get("stock")?.toString(),
        subCategoryId: formData.get("subCategoryId")?.toString(),
        isInStock: formData.get("inStock")?.toString() ?? formData.get("isInStock")?.toString(),
        isArGrade: formData.get("arGrade")?.toString() ?? formData.get("isArGrade")?.toString(),
        isBestSeller:
          formData.get("isBestSeller")?.toString() ?? formData.get("bestSeller")?.toString(),
        isFeatured: formData.get("isFeatured")?.toString(),
        applications: formData.get("applications")?.toString(),
        safetyInfo: formData.get("safetyInfo")?.toString(),
        specifications: JSON.parse(formData.get("specifications")?.toString() || "[]"),
      };

      const primaryImageFile = formData.get("primaryImage");
      const galleryImageFiles = formData.getAll("galleryImages");
      const legacyImages = formData.getAll("images");
      const removePrimaryImage =
        formData.get("removePrimaryImage")?.toString() === "true";
      const hasKeptGalleryIds = formData.has("keptGalleryImageIds");
      let keptGalleryImageIds: number[] = [];

      if (hasKeptGalleryIds) {
        try {
          const parsedIds = JSON.parse(
            formData.get("keptGalleryImageIds")?.toString() || "[]"
          );
          if (Array.isArray(parsedIds)) {
            keptGalleryImageIds = parsedIds
              .map((value) => Number(value))
              .filter((value) => Number.isInteger(value) && value > 0);
          }
        } catch {
          keptGalleryImageIds = [];
        }
      }

      if (!validateString(body.name)) {
        return NextResponse.json({ error: "Product name is required" }, { status: 400 });
      }

      if (!validateString(body.description)) {
        return NextResponse.json({ error: "Description is required" }, { status: 400 });
      }

      if (!validateString(body.casNumber)) {
        return NextResponse.json({ error: "CAS Number is required." }, { status: 400 });
      }

      const trimmedCasNumber = String(body.casNumber).trim();
      const casValidationError = validateCasNumber(trimmedCasNumber, { required: true });
      if (casValidationError) {
        return NextResponse.json({ error: casValidationError }, { status: 400 });
      }

      const parsedSubCategoryId = parseNumber(body.subCategoryId);
      if (parsedSubCategoryId === null) {
        return NextResponse.json({ error: "Subcategory is required" }, { status: 400 });
      }

      const imageValidationError =
        (primaryImageFile ? validateUploadedImageFiles([primaryImageFile], "Main image") : null) ||
        validateUploadedImageFiles(galleryImageFiles, "Gallery image") ||
        validateUploadedImageFiles(legacyImages, "Image");

      if (imageValidationError) {
        return NextResponse.json({ error: imageValidationError }, { status: 400 });
      }

      const duplicateProduct = await findDuplicateProduct(String(body.name).trim(), id);
      if (duplicateProduct) {
        return NextResponse.json({ error: DUPLICATE_ERRORS.product }, { status: 409 });
      }

      const sanitizedSpecifications = sanitizeSpecifications(body.specifications);
      const sanitizedDocuments = await parseProductDocumentsFromFormData(formData);
      const parsedPrice = parseNumber(body.price) ?? 0;
      const packSizes = parsePackSizeFromFormData(formData, parsedPrice);
      const slug = await generateUniqueSlug(String(body.name).trim(), id);

      await prisma.productSpecification.deleteMany({ where: { productId: id } });
      await prisma.productDocument.deleteMany({ where: { productId: id } });
      await prisma.productPackSize.deleteMany({ where: { productId: id } });

      await prisma.product.update({
        where: { id },
        data: {
          name: String(body.name).trim(),
          slug,
          shortDescription: validateString(body.shortDescription)
            ? String(body.shortDescription)
            : null,
          description: String(body.description).trim(),
          casNumber: trimmedCasNumber,
          molecularFormula: validateString(body.molecularFormula)
            ? String(body.molecularFormula)
            : null,
          molecularWeight: parseNumber(body.molecularWeight),
          price: parseNumber(body.price) ?? 0,
          stock: parseNumber(body.stock) ?? 0,
          subCategoryId: parsedSubCategoryId,
          isInStock: parseBoolean(body.isInStock, true),
          isArGrade: parseBoolean(body.isArGrade, false),
          isBestSeller: parseBoolean(body.isBestSeller, false),
          isFeatured: parseBoolean(body.isFeatured, false),
          applications: validateString(body.applications) ? String(body.applications) : null,
          safetyInfo: validateString(body.safetyInfo) ? String(body.safetyInfo) : null,
        },
      });

      if (sanitizedSpecifications.length) {
        await prisma.productSpecification.createMany({
          data: sanitizedSpecifications.map((spec) => ({
            ...spec,
            productId: id,
          })),
        });
      }

      if (sanitizedDocuments.length) {
        await prisma.productDocument.createMany({
          data: sanitizedDocuments.map((doc) => ({
            ...doc,
            productId: id,
          })),
        });
      }

      if (packSizes.length) {
        await prisma.productPackSize.createMany({
          data: packSizes.map((pack) => ({
            ...pack,
            productId: id,
          })),
        });
      }

      if (hasKeptGalleryIds) {
        await prisma.productImage.deleteMany({
          where: {
            productId: id,
            isPrimary: false,
            ...(keptGalleryImageIds.length > 0
              ? { id: { notIn: keptGalleryImageIds } }
              : {}),
          },
        });
      }

      if (primaryImageFile instanceof File && primaryImageFile.size > 0) {
        await savePrimaryProductImage(id, primaryImageFile);
      } else if (removePrimaryImage) {
        await prisma.productImage.deleteMany({
          where: { productId: id, isPrimary: true },
        });
      }

      if (galleryImageFiles.length > 0) {
        await saveGalleryProductImages(id, galleryImageFiles);
      }

      if (legacyImages.length > 0) {
        const imagePaths = await saveUploadedImages(legacyImages);
        if (imagePaths.length > 0) {
          await prisma.productImage.createMany({
            data: imagePaths.map((imageUrl) => ({
              imageUrl,
              isPrimary: false,
              productId: id,
            })),
          });
        }
      }
    } else {
      body = await req.json();

      if (!validateString(body.name) || !validateString(body.description)) {
        return NextResponse.json(
          { error: "Product name and description are required" },
          { status: 400 }
        );
      }

      if (body.casNumber !== undefined && String(body.casNumber).trim()) {
        const casValidationError = validateCasNumber(String(body.casNumber).trim());
        if (casValidationError) {
          return NextResponse.json({ error: casValidationError }, { status: 400 });
        }
      }

      const parsedSubCategoryId = parseNumber(body.subCategoryId);
      if (parsedSubCategoryId === null) {
        return NextResponse.json({ error: "Subcategory is required" }, { status: 400 });
      }

      const sanitizedSpecifications = sanitizeSpecifications(body.specifications);
      const slug = await generateUniqueSlug(String(body.name).trim(), id);

      await prisma.productSpecification.deleteMany({ where: { productId: id } });

      await prisma.product.update({
        where: { id },
        data: {
          name: String(body.name).trim(),
          slug,
          description: String(body.description).trim(),
          ...(body.casNumber !== undefined
            ? {
                casNumber: String(body.casNumber).trim() || null,
              }
            : {}),
          subCategoryId: parsedSubCategoryId,
          price: parseNumber(body.price) ?? 0,
          stock: parseNumber(body.stock) ?? 0,
        },
      });

      if (sanitizedSpecifications.length) {
        await prisma.productSpecification.createMany({
          data: sanitizedSpecifications.map((spec) => ({
            ...spec,
            productId: id,
          })),
        });
      }
    }

    const updated = await prisma.product.findUnique({
      where: { id },
      include: {
        subCategory: { include: { category: true } },
        specifications: true,
        images: true,
        documents: true,
        packSizes: true,
      },
    });

    emitRealtimeUpdate(["products", "dashboard"], "product-updated");

    return NextResponse.json(updated);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update product";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const { id } = await params;

    await prisma.product.delete({
      where: { id: Number(id) },
    });

    emitRealtimeUpdate(["products", "dashboard"], "product-deleted");

    return NextResponse.json({ message: "Deleted successfully" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete product";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
