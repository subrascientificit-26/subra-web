import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export type AuthUser = {
  id: number;
  email: string;
  role: "admin" | "user";
  name: string | null;
  profile: string | null;
  emailVerified: boolean;
};

type JwtPayload = {
  userId: number;
  email: string;
  role?: "admin" | "user";
};

function getTokenFromRequest(req: Request): string | null {
  const authHeader = req.headers.get("Authorization");
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.slice(7);
  }

  const cookieHeader = req.headers.get("cookie");
  if (!cookieHeader) return null;

  const match = cookieHeader.match(/(?:^|;\s*)token=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

export async function getAuthUser(req: Request): Promise<AuthUser | null> {
  const token = getTokenFromRequest(req);
  if (!token || !process.env.JWT_SECRET) return null;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET) as JwtPayload;

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        role: true,
        name: true,
        profile: true,
        emailVerified: true,
      },
    });

    return user;
  } catch {
    return null;
  }
}

export function unauthorizedResponse(message = "Unauthorized") {
  return NextResponse.json({ error: message }, { status: 401 });
}

export function forbiddenResponse(message = "Forbidden") {
  return NextResponse.json({ error: message }, { status: 403 });
}

export async function requireAuth(
  req: Request
): Promise<{ user: AuthUser } | NextResponse> {
  const user = await getAuthUser(req);
  if (!user) return unauthorizedResponse();
  return { user };
}

export async function requireAdmin(
  req: Request
): Promise<{ user: AuthUser } | NextResponse> {
  const result = await requireAuth(req);
  if (result instanceof NextResponse) return result;
  if (result.user.role !== "admin") {
    return forbiddenResponse("Admin access required");
  }
  return result;
}

export function verifyToken(token: string): JwtPayload | null {
  if (!process.env.JWT_SECRET) return null;

  try {
    return jwt.verify(token, process.env.JWT_SECRET) as JwtPayload;
  } catch {
    return null;
  }
}
