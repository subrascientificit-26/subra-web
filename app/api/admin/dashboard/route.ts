import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { NextResponse } from "next/server";

function getMonthBuckets(count: number) {
  const now = new Date();
  return Array.from({ length: count }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - (count - 1 - index), 1);
    return {
      label: date.toLocaleString("en-IN", { month: "short" }),
      year: date.getFullYear(),
      month: date.getMonth(),
    };
  });
}

export async function GET(req: Request) {
  try {
    const auth = await requireAdmin(req);
    if (auth instanceof NextResponse) return auth;

    const months = getMonthBuckets(12);

    const [
      totalProducts,
      totalCustomers,
      totalEnquiries,
      totalCustomRequirements,
      products,
      enquiries,
      recentEnquiries,
    ] = await Promise.all([
      prisma.product.count({ where: { isDeleted: false } }),
      prisma.user.count({ where: { role: "user" } }),
      prisma.enquiry.count(),
      prisma.customRequirement.count(),
      prisma.product.findMany({
        where: { isDeleted: false },
        select: {
          stock: true,
          isInStock: true,
          isFeatured: true,
          isBestSeller: true,
        },
      }),
      prisma.enquiry.findMany({ select: { createdAt: true } }),
      prisma.enquiry.findMany({
        orderBy: { createdAt: "desc" },
        take: 3,
        select: {
          id: true,
          fullName: true,
          subject: true,
          email: true,
          fileUrl: true,
          createdAt: true,
        },
      }),
    ]);

    const inStock = products.filter((product) => product.stock > 0 && product.isInStock).length;
    const outOfStock = products.filter(
      (product) => product.stock === 0 || !product.isInStock
    ).length;
    const lowStock = products.filter(
      (product) => product.stock > 0 && product.stock <= 10
    ).length;

    const enquiryTrend = months.map(({ label, year, month }) => ({
      label,
      count: enquiries.filter((enquiry) => {
        const created = new Date(enquiry.createdAt);
        return created.getFullYear() === year && created.getMonth() === month;
      }).length,
    }));

    const currentMonth = months[months.length - 1];
    const previousMonth = months[months.length - 2];

    const enquiriesThisMonth = enquiryTrend[enquiryTrend.length - 1]?.count ?? 0;
    const enquiriesLastMonth = enquiryTrend[enquiryTrend.length - 2]?.count ?? 0;

    return NextResponse.json({
      stats: {
        totalProducts,
        totalCustomers,
        totalEnquiries,
        totalCustomRequirements,
        enquiriesThisMonth,
        enquiriesLastMonth,
      },
      enquiryTrend,
      productStatus: {
        inStock,
        outOfStock,
        lowStock,
      },
      productDetails: {
        total: totalProducts,
        featured: products.filter((product) => product.isFeatured).length,
        bestSeller: products.filter((product) => product.isBestSeller).length,
        inStock,
        outOfStock,
        lowStock,
      },
      recentEnquiries: recentEnquiries.map((enquiry) => ({
        id: `ENQ-${String(enquiry.id).padStart(5, "0")}`,
        title: enquiry.subject || "Enquiry",
        name: enquiry.fullName,
        email: enquiry.email,
        fileUrl: enquiry.fileUrl,
        date: new Date(enquiry.createdAt).toLocaleDateString("en-IN"),
      })),
      monthLabels: {
        current: currentMonth?.label ?? "",
        previous: previousMonth?.label ?? "",
      },
    });
  } catch (error) {
    console.error("Admin dashboard stats error:", error);
    return NextResponse.json({ error: "Failed to load dashboard stats" }, { status: 500 });
  }
}
