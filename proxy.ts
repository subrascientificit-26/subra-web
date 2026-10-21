import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ROUTES } from "@/lib/routes";
import { verifyToken } from "@/lib/auth";

export default function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isAdminRoute =
    pathname === "/admin" || pathname.startsWith("/admin/");
  const isDashboardRoute =
    pathname === "/dashboard" || pathname.startsWith("/dashboard/");

  if (!isAdminRoute && !isDashboardRoute) {
    return NextResponse.next();
  }

  const token = req.cookies.get("token")?.value;

  if (!token) {
    return NextResponse.redirect(new URL(ROUTES.login, req.url));
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return NextResponse.redirect(new URL(ROUTES.login, req.url));
  }

  if (isAdminRoute && decoded.role !== "admin") {
    return NextResponse.redirect(new URL(ROUTES.dashboard, req.url));
  }

  if (isDashboardRoute && decoded.role === "admin") {
    return NextResponse.redirect(new URL(ROUTES.admin.dashboard, req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard", "/dashboard/:path*", "/admin", "/admin/:path*"],
};
