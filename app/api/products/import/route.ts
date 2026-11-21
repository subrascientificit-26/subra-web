import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import * as XLSX from 'xlsx';
import {
  formatImportErrors,
  formatImportAssetWarnings,
  formatImportRowMessage,
  getMissingImportColumns,
  hasImportUpdateChanges,
  isImportRowEmpty,
  isValidImportAssetUrl,
  type ImportRowError,
  type ImportRowResult,
  validateImportRow,
} from '@/lib/productImportValidation';
import { saveImageBuffers, saveImagesFromUrls } from '@/lib/productImages';
import {
  parseImportDocuments,
  resolveImportDocuments,
} from '@/lib/productDocuments';
import { extractRowImagesFromWorkbook } from '@/lib/excelWorkbookImages';
import { emitRealtimeUpdate } from '@/lib/realtime';

function normalizeText(value: unknown) {
  if (value === undefined || value === null) {
    return '';
  }

  return String(value).trim();
}

function parsePackSizeEntry(entry: unknown) {
  if (!entry) {
    return null;
  }

  if (typeof entry === 'object') {
    const item = entry as Record<string, unknown>;

    const size = normalizeText(item.size);
    const price = parseNumber(item.price);
    const stock = parseNumber(item.stock);

    if (!size) {
      return null;
    }

    return {
      size,
      price: price ?? 0,
      stock: stock ?? 0,
    };
  }

  const text = normalizeText(entry);

  if (!text) {
    return null;
  }

  const parts = text
    .split('|')
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length >= 2) {
    return {
      size: parts[0],
      price: parseNumber(parts[1]) ?? 0,
      stock: parseNumber(parts[2]) ?? 0,
    };
  }

  return null;
}

function normalizeRow(row: Record<string, unknown>) {
  const normalized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(row)) {
    normalized[key.trim().toLowerCase()] = value;
  }

  return normalized;
}

function parseBoolean(value: unknown, fallback = false) {
  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value !== 'string') {
    return fallback;
  }

  const normalized = value.trim().toLowerCase();

  if (['true', 'yes', 'y', '1'].includes(normalized)) {
    return true;
  }

  if (['false', 'no', 'n', '0'].includes(normalized)) {
    return false;
  }

  return fallback;
}

function parseNumber(value: unknown) {
  if (value === undefined || value === null || value === '') {
    return null;
  }

  const numeric = Number(value);
  return Number.isNaN(numeric) ? null : numeric;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function generateUniqueSlug(name: string) {
  const base = slugify(name) || `product-${Date.now()}`;
  let slug = base;
  let suffix = 2;

  while (true) {
    const existing = await prisma.product.findUnique({
      where: { slug },
    });

    if (!existing) {
      return slug;
    }

    slug = `${base}-${suffix}`;
    suffix++;
  }
}

async function ensureCategory(name: string) {
  const categoryName = normalizeText(name) || 'General';

  return prisma.category.upsert({
    where: { name: categoryName },
    update: {},
    create: {
      name: categoryName,
    },
  });
}

async function ensureSubCategory(name: string, categoryId: number) {
  const subCategoryName = normalizeText(name) || 'General';

  const existing = await prisma.subCategory.findFirst({
    where: {
      name: subCategoryName,
      categoryId,
    },
  });

  if (existing) {
    return existing;
  }

  return prisma.subCategory.create({
    data: {
      name: subCategoryName,
      categoryId,
    },
  });
}

function getHeaderValue(row: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = row[key.toLowerCase()];

    if (
      value !== undefined &&
      value !== null &&
      normalizeText(value) !== ''
    ) {
      return value;
    }
  }

  return undefined;
}

function parseCollectionValue(value: unknown) {
  if (!value) {
    return [];
  }

  if (Array.isArray(value)) {
    return value
      .map((item) => normalizeText(item))
      .filter(Boolean);
  }

  const text = normalizeText(value);

  if (!text) {
    return [];
  }

  return text
    .split(/[|,\n]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseImageUrls(value: unknown) {
  return parseCollectionValue(value)
    .map((item) => normalizeText(item))
    .filter(Boolean);
}

function parsePackSizes(value: unknown) {
  if (!value) {
    return [];
  }

  if (Array.isArray(value)) {
    return value
      .map((item) => parsePackSizeEntry(item))
      .filter(Boolean) as Array<{
      size: string;
      price: number;
      stock: number;
    }>;
  }

  const text = normalizeText(value);

  if (!text) {
    return [];
  }

  return text
    .split('\n')
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => parsePackSizeEntry(item))
    .filter(Boolean) as Array<{
    size: string;
    price: number;
    stock: number;
  }>;
}

function parseSpecifications(value: unknown) {
  if (!value) {
    return [];
  }

  if (Array.isArray(value)) {
    return value
      .map((item) => ({
        parameter: normalizeText(
          (item as Record<string, unknown>)?.parameter ||
            (item as Record<string, unknown>)?.test
        ),
        value: normalizeText(
          (item as Record<string, unknown>)?.value ||
            (item as Record<string, unknown>)?.result
        ),
      }))
      .filter((item) => item.parameter && item.value);
  }

  const text = normalizeText(value);

  if (!text) {
    return [];
  }

  return text
    .split(/[;\n]+/)
    .map((item) => item.split(':'))
    .filter((parts) => parts.length >= 2)
    .map(([parameter, ...rest]) => ({
      parameter: parameter.trim(),
      value: rest.join(':').trim(),
    }))
    .filter((item) => item.parameter && item.value);
}

function resolveWorksheetHyperlinks(worksheet: XLSX.WorkSheet) {
  for (const address of Object.keys(worksheet)) {
    if (address.startsWith('!')) continue;

    const cell = worksheet[address];
    const target = cell?.l?.Target;

    if (target && isValidImportAssetUrl(String(target))) {
      cell.v = target;
      cell.t = 's';
    }
  }
}

const IMAGE_COLUMN_KEYS = [
  'images',
  'image',
  'image url',
  'image_url',
  'imageurl',
  'image link',
  'image_link',
  'imagelink',
  'photo',
  'photos',
  'picture',
  'pictures',
  'main image',
  'main_image',
  'main image url',
  'main_image_url',
];

const GALLERY_IMAGE_COLUMN_KEYS = [
  'gallery image urls',
  'gallery_image_urls',
  'gallery images',
  'gallery_images',
  'gallery image url',
  'gallery_image_url',
];

const CAS_COLUMN_KEYS = ['casnumber', 'cas no', 'cas number', 'cas_no'];

const SAFETY_INFO_COLUMN_KEYS = ['safetyinfo', 'safety info', 'safety information'];

const AR_GRADE_COLUMN_KEYS = [
  'argrade',
  'ar grade',
  'ar_grade',
  'ar grade (true/false)',
];

const IN_STOCK_COLUMN_KEYS = [
  'isinstock',
  'in stock',
  'in_stock',
  'in stock (true/false)',
];

const BEST_SELLER_COLUMN_KEYS = [
  'isbestseller',
  'best seller',
  'best_seller',
  'best seller (true/false)',
];

const PACK_SIZE_COLUMN_KEYS = ['packsize', 'pack size', 'pack_size'];
const PACK_QUANTITY_COLUMN_KEYS = ['quantity', 'pack quantity', 'pack_quantity'];
const PACK_UNIT_COLUMN_KEYS = ['unit', 'pack unit', 'pack_unit'];

function mapImportedImages(imageUrls: string[]) {
  return imageUrls.map((imageUrl, index) => ({
    imageUrl,
    isPrimary: index === 0,
  }));
}

function hasColumn(headers: Set<string>, keys: string[]) {
  return keys.some((key) => headers.has(key.toLowerCase()));
}

function getAvailableHeaders(rows: Record<string, unknown>[]) {
  const headers = new Set<string>();

  for (const row of rows) {
    for (const key of Object.keys(row ?? {})) {
      headers.add(key.trim().toLowerCase());
    }
  }

  return headers;
}

function getOptionalValue(
  row: Record<string, unknown>,
  headers: Set<string>,
  keys: string[]
) {
  if (!hasColumn(headers, keys)) {
    return undefined;
  }

  return getHeaderValue(row, keys);
}

function parsePackSizeFromColumns(
  row: Record<string, unknown>,
  headers: Set<string>,
  price: number
) {
  const packSize = normalizeText(
    getOptionalValue(row, headers, PACK_SIZE_COLUMN_KEYS) ?? ''
  );
  const unit = normalizeText(
    getOptionalValue(row, headers, PACK_UNIT_COLUMN_KEYS) ?? ''
  );
  const quantityRaw = getOptionalValue(row, headers, PACK_QUANTITY_COLUMN_KEYS);

  if (!packSize && !unit) {
    return [];
  }

  const size = [packSize, unit].filter(Boolean).join(' ').trim();
  if (!size) {
    return [];
  }

  const stock = parseNumber(quantityRaw) ?? 0;

  return [
    {
      size,
      price,
      stock,
    },
  ];
}

async function findExistingProductForImport(name: string, casNumber: string) {
  const normalizedCas = normalizeText(casNumber);
  const include = {
    images: true,
    specifications: true,
    documents: true,
    packSizes: true,
    subCategory: true,
  } as const;

  if (normalizedCas) {
    const byCas = await prisma.product.findFirst({
      where: {
        casNumber: normalizedCas,
        isDeleted: false,
      },
      include,
    });

    if (byCas) {
      return byCas;
    }
  }

  if (!name) {
    return null;
  }

  const byName = await prisma.product.findFirst({
    where: {
      name,
      isDeleted: false,
    },
    include,
  });

  if (!byName) {
    return null;
  }

  const existingCas = normalizeText(byName.casNumber ?? '');

  // Same product name but a different CAS number should create a new product.
  if (existingCas && normalizedCas && existingCas !== normalizedCas) {
    return null;
  }

  return byName;
}

export async function POST(req: Request) {
  const auth = await requireAdmin(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const formData = await req.formData();

    const file = formData.get('file');

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: 'Excel file is required' },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();

    const rowImageMap = await extractRowImagesFromWorkbook(arrayBuffer);

    const workbook = XLSX.read(arrayBuffer, {
      type: 'array',
    });

    const [sheetName] = workbook.SheetNames;

    const worksheet = workbook.Sheets[sheetName];
    resolveWorksheetHyperlinks(worksheet);

    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(
      worksheet,
      {
        defval: '',
      }
    );

    if (!rows.length) {
      return NextResponse.json(
        { error: 'Excel file is empty' },
        { status: 400 }
      );
    }

    const availableHeaders = getAvailableHeaders(rows);
    const missingColumns = getMissingImportColumns(availableHeaders);

    if (missingColumns.length) {
      return NextResponse.json(
        {
          error: `Excel file is missing required columns: ${missingColumns.join(', ')}`,
          missingColumns,
        },
        { status: 400 }
      );
    }

    let imported = 0;
    let updated = 0;
    let created = 0;
    let unchanged = 0;
    const rowErrors: ImportRowError[] = [];
    const rowResults: ImportRowResult[] = [];

    for (let index = 0; index < rows.length; index++) {
      const row = rows[index];
      const rowNumber = index + 2;
      const normalizedRow = normalizeRow(row ?? {});

      if (isImportRowEmpty(row ?? {})) {
        continue;
      }

      const name = normalizeText(
        getHeaderValue(normalizedRow, [
          'name',
          'product name',
          'product_name',
        ])
      );

      const categoryName = normalizeText(
        getHeaderValue(normalizedRow, ['category', 'category_name'])
      );
      const subCategoryName = normalizeText(
        getHeaderValue(normalizedRow, [
          'subcategory',
          'sub category',
          'sub_category',
        ])
      );
      const description = normalizeText(
        getHeaderValue(normalizedRow, ['description'])
      );
      const casNumber = normalizeText(
        getHeaderValue(normalizedRow, CAS_COLUMN_KEYS) ?? ''
      );

      const hasMainImageColumn = hasColumn(availableHeaders, IMAGE_COLUMN_KEYS);
      const hasGalleryImageColumn = hasColumn(availableHeaders, GALLERY_IMAGE_COLUMN_KEYS);
      const hasLegacyImagesColumn =
        hasMainImageColumn &&
        !hasGalleryImageColumn &&
        hasColumn(availableHeaders, ['images', 'image', 'image url', 'image_url']);

      const mainImageUrls = hasMainImageColumn
        ? parseImageUrls(getHeaderValue(normalizedRow, IMAGE_COLUMN_KEYS))
        : [];
      const galleryImageUrls = hasGalleryImageColumn
        ? parseImageUrls(getHeaderValue(normalizedRow, GALLERY_IMAGE_COLUMN_KEYS))
        : [];
      const rawImageUrls = hasLegacyImagesColumn
        ? mainImageUrls
        : [...mainImageUrls, ...galleryImageUrls];

      const hasDocumentsColumn = hasColumn(availableHeaders, [
        'documents',
        'document',
      ]);

      const embeddedRowImages = rowImageMap.get(rowNumber) ?? [];
      const embeddedImageUrls = embeddedRowImages.length
        ? await saveImageBuffers(embeddedRowImages)
        : [];
      const { saved: urlImageUrls, failed: failedImageUrls } = rawImageUrls.length
        ? await saveImagesFromUrls(rawImageUrls)
        : { saved: [], failed: [] };
      const imageUrls = [...embeddedImageUrls, ...urlImageUrls];
      const parsedDocuments = hasDocumentsColumn
        ? parseImportDocuments(
            getHeaderValue(normalizedRow, ['documents', 'document'])
          )
        : [];
      const { documents, failed: failedDocumentUrls } = parsedDocuments.length
        ? await resolveImportDocuments(parsedDocuments)
        : { documents: [], failed: [] };
      const documentUrls = documents.map((document) => document.fileUrl);
      const assetWarnings = formatImportAssetWarnings({
        failedImageUrls,
        failedDocumentUrls,
      });

      const existingProduct = await findExistingProductForImport(name, casNumber);

      const validationError = validateImportRow({
        rowNumber,
        name,
        category: categoryName,
        subCategory: subCategoryName,
        description,
        casNumber,
        imageUrls,
        documentUrls,
        isNewProduct: !existingProduct,
      });

      if (validationError) {
        rowErrors.push(validationError);
        rowResults.push({
          row: rowNumber,
          name: name || `Row ${rowNumber}`,
          status: 'failed',
          message: formatImportRowMessage(
            validationError.action,
            'failure',
            validationError.errors.join('; ')
          ),
        });
        continue;
      }

      const priceValue = getOptionalValue(normalizedRow, availableHeaders, ['price']);
      const stockValue = getOptionalValue(normalizedRow, availableHeaders, ['stock']);
      const parsedPrice = priceValue !== undefined ? parseNumber(priceValue) ?? 0 : 0;

      const category = await ensureCategory(categoryName);
      const subCategory = await ensureSubCategory(
        subCategoryName,
        category.id
      );
      const hasSpecsColumn = hasColumn(availableHeaders, [
        'specifications',
        'specs',
      ]);
      const hasPackSizesColumn = hasColumn(availableHeaders, [
        'packsizes',
        'pack sizes',
        'packsize',
        ...PACK_SIZE_COLUMN_KEYS,
      ]);
      const hasSeparatePackColumns =
        hasColumn(availableHeaders, PACK_SIZE_COLUMN_KEYS) ||
        hasColumn(availableHeaders, PACK_UNIT_COLUMN_KEYS);

      const specifications = hasSpecsColumn
        ? parseSpecifications(
            getHeaderValue(normalizedRow, ['specifications', 'specs'])
          )
        : [];
      const packSizes = hasPackSizesColumn
        ? hasSeparatePackColumns && !hasColumn(availableHeaders, ['packsizes', 'pack sizes'])
          ? parsePackSizeFromColumns(normalizedRow, availableHeaders, parsedPrice)
          : parsePackSizes(
              getHeaderValue(normalizedRow, ['packsizes', 'pack sizes', 'packsize'])
            )
        : hasSeparatePackColumns
          ? parsePackSizeFromColumns(normalizedRow, availableHeaders, parsedPrice)
          : [];

      const hasImagesColumn =
        hasMainImageColumn || hasGalleryImageColumn || embeddedRowImages.length > 0;
      const shouldReplaceImages =
        hasImagesColumn &&
        (imageUrls.length > 0 ||
          (rawImageUrls.length === 0 &&
            embeddedRowImages.length === 0 &&
            failedImageUrls.length === 0));
      const shouldReplaceDocuments =
        hasDocumentsColumn &&
        (documents.length > 0 ||
          (parsedDocuments.length === 0 && failedDocumentUrls.length === 0));

      if (existingProduct) {
        const updateData: Record<string, unknown> = {
          name,
        };

        if (hasColumn(availableHeaders, ['category', 'category_name', 'subcategory', 'sub category', 'sub_category'])) {
          updateData.subCategoryId = subCategory.id;
        }

        if (priceValue !== undefined) {
          updateData.price = parseNumber(priceValue) ?? 0;
        }

        if (stockValue !== undefined) {
          updateData.stock = parseNumber(stockValue) ?? 0;
        }

        const shortDescription = getOptionalValue(normalizedRow, availableHeaders, [
          'shortdescription',
          'short description',
        ]);
        if (shortDescription !== undefined) {
          updateData.shortDescription = normalizeText(shortDescription) || null;
        }

        const description = getOptionalValue(normalizedRow, availableHeaders, [
          'description',
        ]);
        if (description !== undefined) {
          updateData.description = normalizeText(description) || null;
        }

        const casNumberValue = getOptionalValue(normalizedRow, availableHeaders, CAS_COLUMN_KEYS);
        if (casNumberValue !== undefined) {
          updateData.casNumber = normalizeText(casNumberValue) || null;
        }

        const molecularFormula = getOptionalValue(normalizedRow, availableHeaders, [
          'molecularformula',
          'molecular formula',
        ]);
        if (molecularFormula !== undefined) {
          updateData.molecularFormula = normalizeText(molecularFormula) || null;
        }

        const molecularWeight = getOptionalValue(normalizedRow, availableHeaders, [
          'molecularweight',
          'molecular weight',
        ]);
        if (molecularWeight !== undefined) {
          updateData.molecularWeight = parseNumber(molecularWeight);
        }

        const applications = getOptionalValue(normalizedRow, availableHeaders, [
          'applications',
        ]);
        if (applications !== undefined) {
          updateData.applications = normalizeText(applications) || null;
        }

        const safetyInfo = getOptionalValue(normalizedRow, availableHeaders, SAFETY_INFO_COLUMN_KEYS);
        if (safetyInfo !== undefined) {
          updateData.safetyInfo = normalizeText(safetyInfo) || null;
        }

        const isInStock = getOptionalValue(normalizedRow, availableHeaders, IN_STOCK_COLUMN_KEYS);
        if (isInStock !== undefined) {
          updateData.isInStock = parseBoolean(isInStock, true);
        }

        const isArGrade = getOptionalValue(normalizedRow, availableHeaders, AR_GRADE_COLUMN_KEYS);
        if (isArGrade !== undefined) {
          updateData.isArGrade = parseBoolean(isArGrade);
        }

        const isBestSeller = getOptionalValue(normalizedRow, availableHeaders, BEST_SELLER_COLUMN_KEYS);
        if (isBestSeller !== undefined) {
          updateData.isBestSeller = parseBoolean(isBestSeller);
        }

        const isFeatured = getOptionalValue(normalizedRow, availableHeaders, [
          'isfeatured',
        ]);
        if (isFeatured !== undefined) {
          updateData.isFeatured = parseBoolean(isFeatured);
        }

        const isFavorite = getOptionalValue(normalizedRow, availableHeaders, [
          'isfavorite',
        ]);
        if (isFavorite !== undefined) {
          updateData.isFavorite = parseBoolean(isFavorite);
        }

        if (shouldReplaceImages) {
          if (imageUrls.length > 0) {
            updateData.images = {
              create: mapImportedImages(imageUrls),
            };
          }
        }

        if (hasSpecsColumn && specifications.length) {
          updateData.specifications = { create: specifications };
        }

        if (shouldReplaceDocuments && documents.length) {
          updateData.documents = { create: documents };
        }

        if ((hasPackSizesColumn || hasSeparatePackColumns) && packSizes.length) {
          updateData.packSizes = { create: packSizes };
        }

        const hasChanges = hasImportUpdateChanges({
          existing: existingProduct,
          updateData,
          imageUrls: shouldReplaceImages ? imageUrls : [],
          specifications,
          documents: shouldReplaceDocuments ? documents : existingProduct.documents,
          packSizes,
          hasImagesColumn: shouldReplaceImages,
          hasSpecsColumn,
          hasDocumentsColumn: shouldReplaceDocuments,
          hasPackSizesColumn: hasPackSizesColumn || hasSeparatePackColumns,
        });

        if (!hasChanges && assetWarnings.length === 0) {
          unchanged++;
          rowResults.push({
            row: rowNumber,
            name,
            status: 'unchanged',
            message: formatImportRowMessage('update', 'unchanged'),
          });
          continue;
        }

        if (!hasChanges && assetWarnings.length > 0) {
          unchanged++;
          rowResults.push({
            row: rowNumber,
            name,
            status: 'unchanged',
            message: formatImportRowMessage('update', 'unchanged', undefined, assetWarnings),
            warnings: assetWarnings,
          });
          continue;
        }

        if (shouldReplaceImages) {
          await prisma.productImage.deleteMany({
            where: { productId: existingProduct.id },
          });
        }

        if (hasSpecsColumn) {
          await prisma.productSpecification.deleteMany({
            where: { productId: existingProduct.id },
          });
        }

        if (shouldReplaceDocuments) {
          await prisma.productDocument.deleteMany({
            where: { productId: existingProduct.id },
          });
        }

        if (hasPackSizesColumn || hasSeparatePackColumns) {
          await prisma.productPackSize.deleteMany({
            where: { productId: existingProduct.id },
          });
        }

        await prisma.product.update({
          where: { id: existingProduct.id },
          data: updateData,
        });

        updated++;
        rowResults.push({
          row: rowNumber,
          name,
          status: 'updated',
          message: formatImportRowMessage('update', 'success', undefined, assetWarnings),
          warnings: assetWarnings.length ? assetWarnings : undefined,
        });
      } else {
        const slug = await generateUniqueSlug(name);

        await prisma.product.create({
          data: {
            name,
            slug,
            price: priceValue !== undefined ? parseNumber(priceValue) ?? 0 : 0,
            stock: stockValue !== undefined ? parseNumber(stockValue) ?? 0 : 0,
            subCategoryId: subCategory.id,
            shortDescription:
              getOptionalValue(normalizedRow, availableHeaders, [
                'shortdescription',
                'short description',
              ]) !== undefined
                ? normalizeText(
                    getHeaderValue(normalizedRow, [
                      'shortdescription',
                      'short description',
                    ])
                  ) || undefined
                : undefined,
            description,
            casNumber,
            molecularFormula:
              getOptionalValue(normalizedRow, availableHeaders, [
                'molecularformula',
                'molecular formula',
              ]) !== undefined
                ? normalizeText(
                    getHeaderValue(normalizedRow, [
                      'molecularformula',
                      'molecular formula',
                    ])
                  ) || undefined
                : undefined,
            molecularWeight:
              getOptionalValue(normalizedRow, availableHeaders, [
                'molecularweight',
                'molecular weight',
              ]) !== undefined
                ? parseNumber(
                    getHeaderValue(normalizedRow, [
                      'molecularweight',
                      'molecular weight',
                    ])
                  ) ?? undefined
                : undefined,
            applications:
              getOptionalValue(normalizedRow, availableHeaders, [
                'applications',
              ]) !== undefined
                ? normalizeText(
                    getHeaderValue(normalizedRow, ['applications'])
                  ) || undefined
                : undefined,
            safetyInfo:
              getOptionalValue(normalizedRow, availableHeaders, SAFETY_INFO_COLUMN_KEYS) !==
              undefined
                ? normalizeText(
                    getHeaderValue(normalizedRow, SAFETY_INFO_COLUMN_KEYS)
                  ) || undefined
                : undefined,
            isInStock:
              getOptionalValue(normalizedRow, availableHeaders, IN_STOCK_COLUMN_KEYS) !==
              undefined
                ? parseBoolean(
                    getHeaderValue(normalizedRow, IN_STOCK_COLUMN_KEYS),
                    true
                  )
                : true,
            isArGrade:
              getOptionalValue(normalizedRow, availableHeaders, AR_GRADE_COLUMN_KEYS) !==
              undefined
                ? parseBoolean(getHeaderValue(normalizedRow, AR_GRADE_COLUMN_KEYS))
                : false,
            isBestSeller:
              getOptionalValue(normalizedRow, availableHeaders, BEST_SELLER_COLUMN_KEYS) !==
              undefined
                ? parseBoolean(getHeaderValue(normalizedRow, BEST_SELLER_COLUMN_KEYS))
                : false,
            isFeatured:
              getOptionalValue(normalizedRow, availableHeaders, ['isfeatured']) !==
              undefined
                ? parseBoolean(getHeaderValue(normalizedRow, ['isfeatured']))
                : false,
            isFavorite:
              getOptionalValue(normalizedRow, availableHeaders, ['isfavorite']) !==
              undefined
                ? parseBoolean(getHeaderValue(normalizedRow, ['isfavorite']))
                : false,
            images: imageUrls.length
              ? { create: mapImportedImages(imageUrls) }
              : undefined,
            specifications: specifications.length
              ? { create: specifications }
              : undefined,
            documents: documents.length
              ? { create: documents }
              : undefined,
            packSizes: packSizes.length
              ? { create: packSizes }
              : undefined,
          },
        });

        created++;
        rowResults.push({
          row: rowNumber,
          name,
          status: 'created',
          message: formatImportRowMessage('create', 'success', undefined, assetWarnings),
          warnings: assetWarnings.length ? assetWarnings : undefined,
        });
      }

      imported++;
    }

    const formattedErrors = formatImportErrors(rowErrors);

    if (imported === 0 && formattedErrors.length) {
      return NextResponse.json(
        {
          error: 'Import failed. Fix the issues below and try again.',
          failed: formattedErrors.length,
          errors: formattedErrors,
        },
        { status: 400 }
      );
    }

    const messageParts: string[] = [];

    if (created > 0) {
      messageParts.push(`${created} product(s) created`);
    }

    if (updated > 0) {
      messageParts.push(`${updated} product(s) updated`);
    }

    if (unchanged > 0) {
      messageParts.push(`${unchanged} product(s) unchanged (no field changes)`);
    }

    if (formattedErrors.length) {
      messageParts.push(`${formattedErrors.length} row(s) failed validation`);
    }

    const warningCount = rowResults.reduce(
      (count, result) => count + (result.warnings?.length ?? 0),
      0
    );

    if (warningCount > 0) {
      messageParts.push(`${warningCount} asset warning(s) — check row details`);
    }

    if (imported > 0) {
      emitRealtimeUpdate(
        ['products', 'categories', 'subcategories', 'dashboard'],
        'products-imported'
      );
    }

    return NextResponse.json({
      success: true,
      message: messageParts.length
        ? `${messageParts.join('; ')}.`
        : 'Import completed.',
      imported,
      created,
      updated,
      unchanged,
      failed: formattedErrors.length,
      errors: formattedErrors,
      rowResults,
    });
  } catch (error: unknown) {
    console.error(error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Import failed',
      },
      {
        status: 500,
      }
    );
  }
}