import bcrypt from "bcrypt";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { validateEmail, validatePassword } from "@/lib/validators";
import { sendUserAccountUpdateEmail } from "@/lib/mail";

const userSelect = {
  id: true,
  email: true,
  name: true,
  role: true,
  profile: true,
  emailVerified: true,
  createdAt: true,
} as const;

export async function GET(req: Request) {
  const auth = await requireAdmin(req);
  if (auth instanceof NextResponse) return auth;

  const users = await prisma.user.findMany({
    select: userSelect,
    orderBy: { id: "asc" },
  });

  return NextResponse.json(users);
}

export async function POST(req: Request) {
  const auth = await requireAdmin(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await req.json();
    const email = String(body.email ?? "").trim().toLowerCase();
    const password = String(body.password ?? "");
    const name = body.name ? String(body.name).trim() : null;
    const role = body.role === "admin" ? "admin" : "user";
    const emailVerified = body.emailVerified === true;

    if (!email || !validateEmail(email)) {
      return NextResponse.json({ error: "Valid email is required" }, { status: 400 });
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return NextResponse.json({ error: passwordValidation.error }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "Email already exists" }, { status: 409 });
    }

    const user = await prisma.user.create({
      data: {
        email,
        password: await bcrypt.hash(password, 10),
        name,
        role,
        emailVerified,
      },
      select: userSelect,
    });

    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create user" },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  const auth = await requireAdmin(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await req.json();
    const id = Number(body.id);
    const email = body.email ? String(body.email).trim().toLowerCase() : undefined;
    const name = body.name !== undefined ? String(body.name).trim() || null : undefined;
    const role = body.role === "admin" || body.role === "user" ? body.role : undefined;
    const emailVerified =
      body.emailVerified !== undefined ? Boolean(body.emailVerified) : undefined;
    const password = body.password ? String(body.password) : "";

    if (!id) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    if (email && !validateEmail(email)) {
      return NextResponse.json({ error: "Valid email is required" }, { status: 400 });
    }

    if (password) {
      const passwordValidation = validatePassword(password);
      if (!passwordValidation.valid) {
        return NextResponse.json({ error: passwordValidation.error }, { status: 400 });
      }
    }

    if (email) {
      const duplicate = await prisma.user.findFirst({
        where: { email, NOT: { id } },
      });
      if (duplicate) {
        return NextResponse.json({ error: "Email already exists" }, { status: 409 });
      }
    }

    const existing = await prisma.user.findUnique({
      where: { id },
      select: { email: true, role: true, name: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const user = await prisma.user.update({
      where: { id },
      data: {
        ...(email !== undefined ? { email } : {}),
        ...(name !== undefined ? { name } : {}),
        ...(role !== undefined ? { role } : {}),
        ...(emailVerified !== undefined ? { emailVerified } : {}),
        ...(password ? { password: await bcrypt.hash(password, 10) } : {}),
      },
      select: userSelect,
    });

    const emailChanged = email !== undefined && email !== existing.email;
    const roleChanged = role !== undefined && role !== existing.role;

    if (emailChanged || roleChanged) {
      try {
        await sendUserAccountUpdateEmail({
          email: user.email,
          name: user.name,
          role: user.role as "admin" | "user",
          changes: {
            emailChanged,
            roleChanged,
            previousEmail: existing.email,
            previousRole: existing.role as "admin" | "user",
          },
        });
      } catch (mailError) {
        console.error("Failed to send user update email:", mailError);
      }
    }

    return NextResponse.json(user);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update user" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  const auth = await requireAdmin(req);
  if (auth instanceof NextResponse) return auth;

  const { searchParams } = new URL(req.url);
  const id = Number(searchParams.get("id"));

  if (!id) {
    return NextResponse.json({ error: "User ID is required" }, { status: 400 });
  }

  if (auth.user.id === id) {
    return NextResponse.json({ error: "You cannot delete your own account" }, { status: 400 });
  }

  await prisma.user.delete({ where: { id } });

  return NextResponse.json({ message: "User deleted" });
}
