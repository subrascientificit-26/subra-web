import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ProductDetailClient from "@/components/ProductDetailClient";
import { prisma } from "@/lib/prisma";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function ProductDetailPage({
  params,
}: PageProps) {

  // GET PARAMS
  const { id } = await params;

  const productId = Number(id);

  // INVALID ID
  if (isNaN(productId)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <h1 className="text-2xl font-bold text-foreground">
          Invalid Product ID
        </h1>
      </div>
    );
  }

  // FETCH PRODUCT
  const product = await prisma.product.findUnique({
    where: {
      id: productId,
    },

    include: {
      images: true,

      specifications: true,

      documents: true,

      packSizes: true,

      subCategory: {
        include: {
          category: true,
        },
      },
    },
  });

  // PRODUCT NOT FOUND
  if (!product) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <h1 className="text-2xl font-bold text-foreground">
          Product Not Found
        </h1>
      </div>
    );
  }

  // GET SPEC VALUE
  const getSpecValue = (key: string) =>
    product.specifications.find(
      (spec) =>
        spec.parameter.toLowerCase() ===
        key.toLowerCase()
    )?.value ?? "";

  // EXCLUDED SPECIFICATIONS
  const excludedSpecs = [
    "cas no",
    "cas number",
    "molecular formula",
    "molecular weight",
    "pack size",
    "purity",
    "sku",
    "code",
    "product code",
  ];

  // FORMAT PRODUCT
  const formattedProduct = {
    id: product.id,

    name: product.name,

    description:
      product.shortDescription ?? "",

    longDescription:
      product.description ?? "",

    price: Number(product.price),

    stock: product.stock,

    casNo:
      product.casNumber ||
      getSpecValue("CAS No") ||
      getSpecValue("CAS Number") ||
      "",

    molecularFormula:
      product.molecularFormula ||
      getSpecValue("Molecular Formula") ||
      "",

    molecularWeight:
      product.molecularWeight ||
      getSpecValue("Molecular Weight") ||
      "",

    purity:
      getSpecValue("Purity") || "",

    packSize:
      getSpecValue("Pack Size") || "",

    applications:
      product.applications || "",

    safetyInfo:
      product.safetyInfo || "",

    category:
      product.subCategory?.category?.name || "N/A",

    categoryId: product.subCategory?.category?.id,

    subCategory:
      product.subCategory?.name ?? "",

    subCategoryId: product.subCategory?.id,

    isArGrade: Boolean(product.isArGrade),
    isInStock: Boolean(product.isInStock),
    isBestSeller: Boolean(product.isBestSeller),
    isFavorite: Boolean(product.isFavorite),

    gallery: [...product.images]
      .sort((a, b) => Number(b.isPrimary) - Number(a.isPrimary))
      .map((img) => img.imageUrl),

    specifications:
      product.specifications
        .filter(
          (spec) =>
            !excludedSpecs.includes(
              spec.parameter.toLowerCase()
            )
        )
        .map((spec) => ({
          parameter: spec.parameter,
          specification: spec.value,
        })),

    documents: product.documents.map(
      (doc) => ({
        name: doc.name,
        fileUrl: doc.fileUrl,
        type: doc.type,
      })
    ),

    packSizes: product.packSizes.map(
      (pack) => ({
        size: pack.size,
        price: pack.price,
        stock: pack.stock,
      })
    ),
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navbar />

      <div className="flex-grow">
        <ProductDetailClient
          product={formattedProduct}
        />
      </div>

      <Footer />
    </div>
  );
}