import { prisma } from '@/lib/prisma';
import { requireAdmin, requireAuth } from '@/lib/auth';
import { NextResponse } from 'next/server';
import {
  DUPLICATE_ERRORS,
  findDuplicateProduct,
} from '@/lib/duplicateNames';
import {
  saveGalleryProductImages,
  savePrimaryProductImage,
  saveUploadedImages,
} from '@/lib/productImages';
import { parseProductDocumentsFromFormData } from '@/lib/productDocuments';
import { parsePackSizeFromFormData } from '@/lib/productPackSizes';
import { validateCasNumber } from '@/lib/productImportValidation';

const documentTypes = ['COA', 'SDS', 'OTHER'] as const;

type DocumentType = (typeof documentTypes)[number];

function normalizeDocumentType(type: any): DocumentType {
  return documentTypes.includes(type) ? type : 'OTHER';
}

function sanitizeNumber(value: any) {
  if (value === undefined || value === null || value === '') {
    return null;
  }

  const numberValue = Number(value);
  return Number.isNaN(numberValue) ? null : numberValue;
}

function validateString(value: any) {
  return typeof value === 'string' && value.trim().length > 0;
}

function parseBoolean(value: any, fallback = false) {
  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();

    if (['true', 'yes', 'y', '1'].includes(normalized)) {
      return true;
    }

    if (['false', 'no', 'n', '0'].includes(normalized)) {
      return false;
    }
  }

  return fallback;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
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

function sanitizeSpecifications(value: any) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((spec: any) => ({
      parameter: String(spec?.parameter || spec?.test || '').trim(),
      value: String(spec?.value || spec?.result || '').trim(),
    }))
    .filter((spec) => spec.parameter && spec.value);
}

function sanitizeDocuments(value: any) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map((doc: any) => ({
    name: String(doc?.name || '').trim(),
    fileUrl: String(doc?.fileUrl || '').trim(),
    type: normalizeDocumentType(doc?.type),
  }));
}

export async function POST(req: Request) {
  const auth = await requireAdmin(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const contentType = req.headers.get('content-type') || '';

    let name;
    let shortDescription;
    let description;
    let casNumber;
    let molecularFormula;
    let molecularWeight;
    let price;
    let stock;
    let subCategoryId;
    let isInStock;
    let isArGrade;
    let isBestSeller;
    let isFeatured;
    let isFavorite;
    let specifications;
    let documents;
    let applications;
    let safetyInfo;
    let packSizes: ReturnType<typeof parsePackSizeFromFormData> = [];

    let imagePaths: string[] = [];
    let primaryImageFile: FormDataEntryValue | null = null;
    let galleryImageFiles: FormDataEntryValue[] = [];
    let multipartFormData: FormData | null = null;

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      multipartFormData = formData;

      name = formData.get('name')?.toString();
      shortDescription = formData.get('shortDescription')?.toString();
      description = formData.get('description')?.toString();
      casNumber = formData.get('casNumber')?.toString();
      molecularFormula = formData.get('molecularFormula')?.toString();
      molecularWeight = formData.get('molecularWeight')?.toString();
      price = formData.get('price')?.toString();
      stock = formData.get('stock')?.toString();
      subCategoryId = formData.get('subCategoryId')?.toString();
      isInStock = formData.get('inStock')?.toString() ?? formData.get('isInStock')?.toString();
      isArGrade = formData.get('arGrade')?.toString() ?? formData.get('isArGrade')?.toString();
      isBestSeller = formData.get('isBestSeller')?.toString() ?? formData.get('bestSeller')?.toString();
      isFeatured = formData.get('isFeatured')?.toString();
      isFavorite = formData.get('isFavorite')?.toString();
      applications = formData.get('applications')?.toString();
      safetyInfo = formData.get('safetyInfo')?.toString();

      const specs = formData.get('specifications')?.toString();
      specifications = specs ? JSON.parse(specs) : [];

      primaryImageFile = formData.get('primaryImage');
      galleryImageFiles = formData.getAll('galleryImages');
      imagePaths = await saveUploadedImages(formData.getAll('images'));
      documents = await parseProductDocumentsFromFormData(formData);
    } else {
      const body = await req.json();

      ({
        name,
        shortDescription,
        description,
        casNumber,
        molecularFormula,
        molecularWeight,
        price,
        stock,
        subCategoryId,
        isInStock,
        isBestSeller,
        isFeatured,
        isFavorite,
        specifications,
        documents,
        applications,
        safetyInfo,
      } = body);

      if (Array.isArray(body.images)) {
        imagePaths = body.images;
      }
    }

    if (!validateString(name)) {
      return NextResponse.json({ error: 'Product name is required' }, { status: 400 });
    }

    if (!validateString(description)) {
      return NextResponse.json({ error: 'Description is required' }, { status: 400 });
    }

    if (!validateString(casNumber)) {
      return NextResponse.json({ error: 'CAS Number required' }, { status: 400 });
    }

    const casValidationError = validateCasNumber(String(casNumber).trim());
    if (casValidationError && casValidationError !== 'CAS Number is required') {
      return NextResponse.json({ error: casValidationError }, { status: 400 });
    }

    const parsedCategoryId = sanitizeNumber(subCategoryId);
    if (parsedCategoryId === null) {
      return NextResponse.json({ error: 'Subcategory is required' }, { status: 400 });
    }

    const duplicateProduct = await findDuplicateProduct(name.trim());
    if (duplicateProduct) {
      return NextResponse.json({ error: DUPLICATE_ERRORS.product }, { status: 409 });
    }

    const parsedPrice = sanitizeNumber(price) ?? 0;
    const parsedStock = sanitizeNumber(stock) ?? 0;

    if (multipartFormData) {
      packSizes = parsePackSizeFromFormData(multipartFormData, parsedPrice);
    }

    const sanitizedSpecifications = sanitizeSpecifications(specifications);
    const sanitizedDocuments = contentType.includes('multipart/form-data')
      ? documents
      : sanitizeDocuments(documents).filter((doc) => doc.name && doc.fileUrl);

    const slug = await generateUniqueSlug(name.trim());

    const product = await prisma.product.create({
      data: {
        name: name.trim(),
        slug,
        shortDescription: validateString(shortDescription) ? shortDescription : undefined,
        description: description.trim(),
        casNumber: validateString(casNumber) ? casNumber : undefined,
        molecularFormula: validateString(molecularFormula) ? molecularFormula : undefined,
        molecularWeight: sanitizeNumber(molecularWeight),
        price: parsedPrice,
        stock: parsedStock,
        subCategoryId: parsedCategoryId,
        isInStock: parseBoolean(isInStock, true),
        isArGrade: parseBoolean(isArGrade, false),
        isBestSeller: parseBoolean(isBestSeller, false),
        isFeatured: parseBoolean(isFeatured, false),
        isFavorite: parseBoolean(isFavorite, false),
        specifications: sanitizedSpecifications.length
          ? { create: sanitizedSpecifications }
          : undefined,
        documents: sanitizedDocuments.length
          ? { create: sanitizedDocuments }
          : undefined,
        packSizes: packSizes.length
          ? { create: packSizes }
          : undefined,
        images: imagePaths.length
          ? {
              create: imagePaths.map((pathValue, index) => ({
                imageUrl: pathValue,
                isPrimary: index === 0,
              })),
            }
          : undefined,
        applications: validateString(applications) ? applications : undefined,
        safetyInfo: validateString(safetyInfo) ? safetyInfo : undefined,
      },
      include: {
        subCategory: { include: { category: true } },
        specifications: true,
        images: true,
        documents: true,
        packSizes: true,
      },
    });

    if (primaryImageFile instanceof File && primaryImageFile.size > 0) {
      await savePrimaryProductImage(product.id, primaryImageFile);
    }

    if (galleryImageFiles.length > 0) {
      await saveGalleryProductImages(product.id, galleryImageFiles);
    }

    const savedProduct = await prisma.product.findUnique({
      where: { id: product.id },
      include: {
        subCategory: { include: { category: true } },
        specifications: true,
        images: true,
        documents: true,
        packSizes: true,
      },
    });

    return NextResponse.json(savedProduct ?? product);
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  const auth = await requireAdmin(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const contentType = req.headers.get('content-type') || '';

    let id;
    let name;
    let shortDescription;
    let description;
    let casNumber;
    let molecularFormula;
    let molecularWeight;
    let price;
    let stock;
    let subCategoryId;
    let isInStock;
    let isBestSeller;
    let isFeatured;
    let isFavorite;
    let specifications;
    let documents;
    let applications;
    let safetyInfo;

    let imagePaths: string[] = [];

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();

      id = formData.get('id')?.toString();
      name = formData.get('name')?.toString();
      shortDescription = formData.get('shortDescription')?.toString();
      description = formData.get('description')?.toString();
      casNumber = formData.get('casNumber')?.toString();
      molecularFormula = formData.get('molecularFormula')?.toString();
      molecularWeight = formData.get('molecularWeight')?.toString();
      price = formData.get('price')?.toString();
      stock = formData.get('stock')?.toString();
      subCategoryId = formData.get('subCategoryId')?.toString();
      isInStock = formData.get('isInStock')?.toString();
      isBestSeller = formData.get('isBestSeller')?.toString();
      isFeatured = formData.get('isFeatured')?.toString();
      isFavorite = formData.get('isFavorite')?.toString();
      applications = formData.get('applications')?.toString();
      safetyInfo = formData.get('safetyInfo')?.toString();

      const specs = formData.get('specifications')?.toString();
      specifications = specs ? JSON.parse(specs) : [];

      documents = await parseProductDocumentsFromFormData(formData);

      imagePaths = await saveUploadedImages(formData.getAll('images'));
    } else {
      const body = await req.json();

      ({
        id,
        name,
        shortDescription,
        description,
        casNumber,
        molecularFormula,
        molecularWeight,
        price,
        stock,
        subCategoryId,
        isInStock,
        isBestSeller,
        isFeatured,
        isFavorite,
        specifications,
        documents,
        applications,
        safetyInfo,
      } = body);

      if (Array.isArray(body.images)) {
        imagePaths = body.images;
      }
    }

    if (!id || !validateString(name) || !subCategoryId) {
      return NextResponse.json(
        { error: 'Product id, name and subcategory are required' },
        { status: 400 }
      );
    }

    const parsedId = sanitizeNumber(id);
    const parsedPrice = sanitizeNumber(price);
    const parsedStock = sanitizeNumber(stock);
    const parsedCategoryId = sanitizeNumber(subCategoryId);

    if (parsedId === null) {
      return NextResponse.json({ error: 'Invalid product ID' }, { status: 400 });
    }

    const duplicateProduct = await findDuplicateProduct(name.trim(), parsedId);
    if (duplicateProduct) {
      return NextResponse.json({ error: DUPLICATE_ERRORS.product }, { status: 409 });
    }

    if (price !== undefined && parsedPrice === null) {
      return NextResponse.json({ error: 'Please enter a valid price' }, { status: 400 });
    }

    if (stock !== undefined && parsedStock === null) {
      return NextResponse.json({ error: 'Please enter a valid stock quantity' }, { status: 400 });
    }

    if (parsedCategoryId === null) {
      return NextResponse.json(
        { error: 'Please select a valid subcategory' },
        { status: 400 }
      );
    }

    const sanitizedSpecifications = sanitizeSpecifications(specifications);

    if (sanitizedSpecifications.some((spec) => !spec.parameter || !spec.value)) {
      return NextResponse.json(
        { error: 'Every specification requires a parameter and value' },
        { status: 400 }
      );
    }

    const sanitizedDocuments = contentType.includes('multipart/form-data')
      ? documents
      : sanitizeDocuments(documents);

    if (sanitizedDocuments.some((doc) => !doc.name || !doc.fileUrl)) {
      return NextResponse.json(
        { error: 'Every document requires a name and file URL' },
        { status: 400 }
      );
    }

    const slug = await generateUniqueSlug(name.trim(), parsedId);

    await prisma.productSpecification.deleteMany({
      where: { productId: parsedId },
    });

    await prisma.productDocument.deleteMany({
      where: { productId: parsedId },
    });

    const product = await prisma.product.update({
      where: { id: parsedId },
      data: {
        name: name.trim(),
        slug,
        shortDescription: validateString(shortDescription) ? shortDescription : undefined,
        description: validateString(description) ? description : undefined,
        casNumber: validateString(casNumber) ? casNumber : undefined,
        molecularFormula: validateString(molecularFormula) ? molecularFormula : undefined,
        molecularWeight: sanitizeNumber(molecularWeight),
        price: parsedPrice ?? undefined,
        stock: parsedStock ?? undefined,
        subCategoryId: parsedCategoryId,
        isInStock: parseBoolean(isInStock, true),
        isBestSeller: parseBoolean(isBestSeller, false),
        isFeatured: parseBoolean(isFeatured, false),
        isFavorite: parseBoolean(isFavorite, false),
        specifications: {
          create: sanitizedSpecifications,
        },
        documents: {
          create: sanitizedDocuments,
        },
        applications: validateString(applications) ? applications : undefined,
        safetyInfo: validateString(safetyInfo) ? safetyInfo : undefined,
      },
      include: {
        subCategory: { include: { category: true } },
        specifications: true,
        images: true,
        documents: true,
        packSizes: true,
      },
    });

    if (imagePaths.length > 0) {
      await prisma.productImage.createMany({
        data: imagePaths.map((pathValue) => ({
          imageUrl: pathValue,
          productId: parsedId,
        })),
      });
    }

    return NextResponse.json(product);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await req.json();
    const id = sanitizeNumber(body?.id);

    if (id === null) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
    }

    const updatedProduct = await prisma.product.update({
      where: { id },
      data: {
        isFavorite: parseBoolean(body?.isFavorite, false),
      },
      include: {
        subCategory: { include: { category: true } },
        specifications: true,
        images: true,
        documents: true,
        packSizes: true,
      },
    });

    return NextResponse.json(updatedProduct);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const auth = await requireAdmin(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const { searchParams } = new URL(req.url);
    const id = Number(searchParams.get('id'));

    if (!id) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
    }

    const product = await prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    await prisma.product.update({
      where: { id },

      data: {
        isDeleted: true,
        deletedAt: new Date(),
      },
    });

    return NextResponse.json({ message: 'Product deleted successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      where: { isDeleted: false },
      include: {
        subCategory: { include: { category: true } },
        specifications: true,
        images: true,
        documents: true,
        packSizes: true,
      },
      orderBy: { id: 'desc' },
    });

    return NextResponse.json(products);
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
