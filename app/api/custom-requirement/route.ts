import { prisma } from "@/lib/prisma";
import { mkdir, writeFile } from "fs/promises";
import path from "path";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();

    const productName = formData
      .get("productName")
      ?.toString();

    const casNo = formData
      .get("casNo")
      ?.toString();

    const molecularFormula = formData
      .get("molecularFormula")
      ?.toString();

    const purity = formData
      .get("purity")
      ?.toString();

    const quantity = formData
      .get("quantity")
      ?.toString();

    const quantityUnit = formData
      .get("quantityUnit")
      ?.toString();

    const packSize = formData
      .get("packSize")
      ?.toString();

    const application = formData
      .get("application")
      ?.toString();

    const deliveryLocation = formData
      .get("deliveryLocation")
      ?.toString();

    const detailedRequirement = formData
      .get("detailedRequirement")
      ?.toString();

    const attachment =
      formData.get("attachment");

    // VALIDATION

    if (!productName) {
      return Response.json(
        {
          error:
            "Product name is required",
        },
        { status: 400 }
      );
    }

    if (!purity) {
      return Response.json(
        {
          error:
            "Purity is required",
        },
        { status: 400 }
      );
    }

    if (!quantity) {
      return Response.json(
        {
          error:
            "Quantity is required",
        },
        { status: 400 }
      );
    }

    if (!application) {
      return Response.json(
        {
          error:
            "Application is required",
        },
        { status: 400 }
      );
    }

    if (!deliveryLocation) {
      return Response.json(
        {
          error:
            "Delivery location is required",
        },
        { status: 400 }
      );
    }

    if (!detailedRequirement) {
      return Response.json(
        {
          error:
            "Specification is required",
        },
        { status: 400 }
      );
    }

    // FILE UPLOAD

    let filePath: string | null =
      null;

    if (
      attachment instanceof File &&
      attachment.size > 0
    ) {
      const uploadDir = path.join(
        process.cwd(),
        "public/uploads"
      );

      await mkdir(uploadDir, {
        recursive: true,
      });

      const bytes =
        await attachment.arrayBuffer();

      const buffer = Buffer.from(bytes);

      const fileName = `${Date.now()}-${attachment.name.replace(
        /\s/g,
        "-"
      )}`;

      const fullPath = path.join(
        uploadDir,
        fileName
      );

      await writeFile(fullPath, buffer);

      filePath = `/uploads/${fileName}`;
    }

    // SAVE DB

    const requirement =
      await prisma.customRequirement.create(
        {
          data: {
            productName,
            casNo,
            molecularFormula,
            purity,
            quantity,
            quantityUnit:
              quantityUnit || "KG",
            packSize,
            application,
            deliveryLocation,
            detailedRequirement,
            attachment: filePath,
          },
        }
      );

    return Response.json(
      {
        success: true,
        message:
          "Requirement submitted successfully",
        data: requirement,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.log(error);

    return Response.json(
      {
        error:
          error.message ||
          "Something went wrong",
      },
      { status: 500 }
    );
  }
}