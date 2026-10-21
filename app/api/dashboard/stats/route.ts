import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const auth = await requireAuth(req);
    if (auth instanceof NextResponse) return auth;

    const { user } = auth;

    const [enquiries, customRequirements] = await Promise.all([
      prisma.enquiry.findMany({
        where: { email: user.email },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          subject: true,
          createdAt: true,
        },
      }),
      prisma.customRequirement.count(),
    ]);

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const enquiriesThisMonth = enquiries.filter(
      (enquiry) => new Date(enquiry.createdAt) >= startOfMonth
    ).length;

    return NextResponse.json({
      stats: {
        totalOrders: 0,
        pendingOrders: 0,
        totalEnquiries: enquiries.length,
        enquiriesThisMonth,
        customRequirements,
      },
      recentEnquiries: enquiries.slice(0, 3).map((enquiry) => ({
        id: `ENQ-${String(enquiry.id).padStart(5, "0")}`,
        title: enquiry.subject || "Enquiry",
        date: new Date(enquiry.createdAt).toLocaleDateString("en-IN"),
      })),
    });
  } catch (error) {
    console.error("User dashboard stats error:", error);
    return NextResponse.json({ error: "Failed to load dashboard stats" }, { status: 500 });
  }
}
