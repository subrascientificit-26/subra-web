import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { getAuthUser, unauthorizedResponse } from "@/lib/auth";
import { saveProfileImage } from "@/lib/profileImage";
import { validateProfileForm } from "@/lib/profileValidation";
import { prisma } from "@/lib/prisma";

function jsonFieldErrors(errors: Record<string, string>, status = 400) {
  return NextResponse.json({ error: "Validation failed", errors }, { status });
}

export async function GET(req: Request) {
  try {
    const user = await getAuthUser(req);

    if (!user) {
      return unauthorizedResponse();
    }

    return NextResponse.json({
      name: user.name || user.email.split("@")[0],
      email: user.email,
      role: user.role,
      profile: user.profile || "",
    });
  } catch (error) {
    console.error("Profile fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch user" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return unauthorizedResponse();
    }

    const contentType = req.headers.get("content-type") || "";
    let name: string | undefined;
    let currentPassword = "";
    let newPassword = "";
    let profileImage: File | null = null;
    let removeProfile = false;

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      name = String(formData.get("name") ?? "").trim();
      currentPassword = String(formData.get("currentPassword") ?? "");
      newPassword = String(formData.get("newPassword") ?? "");
      removeProfile = String(formData.get("removeProfile") ?? "") === "true";
      const imageField = formData.get("profileImage");
      profileImage = imageField instanceof File && imageField.size > 0 ? imageField : null;
    } else {
      const body = await req.json();
      name = body.name !== undefined ? String(body.name).trim() : undefined;
      currentPassword = body.currentPassword ? String(body.currentPassword) : "";
      newPassword = body.newPassword ? String(body.newPassword) : "";
      removeProfile = body.removeProfile === true;
    }

    const validation = validateProfileForm({
      name: name ?? "",
      currentPassword,
      newPassword,
      confirmPassword: newPassword,
    });

    if (!validation.valid) {
      return jsonFieldErrors(validation.errors);
    }

    const data: { name?: string; password?: string; profile?: string | null } = {
      name,
    };

    if (newPassword) {
      const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
      if (!dbUser) {
        return unauthorizedResponse();
      }

      const passwordMatches = await bcrypt.compare(currentPassword, dbUser.password);
      if (!passwordMatches) {
        return jsonFieldErrors({ currentPassword: "Current password is incorrect" });
      }

      data.password = await bcrypt.hash(newPassword, 10);
    }

    if (removeProfile) {
      data.profile = null;
    } else if (profileImage) {
      try {
        data.profile = await saveProfileImage(user.id, profileImage);
      } catch (error) {
        return NextResponse.json(
          {
            error: error instanceof Error ? error.message : "Failed to upload profile image",
            errors: {
              profileImage:
                error instanceof Error ? error.message : "Failed to upload profile image",
            },
          },
          { status: 400 }
        );
      }
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data,
      select: {
        name: true,
        email: true,
        role: true,
        profile: true,
      },
    });

    return NextResponse.json({
      name: updated.name || updated.email.split("@")[0],
      email: updated.email,
      role: updated.role,
      profile: updated.profile || "",
    });
  } catch (error) {
    console.error("Profile update error:", error);
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}
