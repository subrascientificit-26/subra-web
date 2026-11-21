import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import {
  extractExternalRowValues,
  getMissingExternalImportColumns,
  validateExternalProductInput,
} from "@/lib/externalProducts";
import { emitRealtimeUpdate } from "@/lib/realtime";

interface ImportRowResult {
  row: number;
  productName: string;
  status: "created" | "updated" | "unchanged" | "failed";
  message: string;
}

export async function POST(req: Request) {
  const auth = await requireAdmin(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json(
        { error: "Please upload an Excel file (.xlsx or .xls)." },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const firstSheetName = workbook.SheetNames[0];

    if (!firstSheetName) {
      return NextResponse.json(
        { error: "Uploaded Excel file has no sheets." },
        { status: 400 }
      );
    }

    const sheet = workbook.Sheets[firstSheetName];
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
      defval: "",
    });

    if (!rows.length) {
      return NextResponse.json(
        { error: "The Excel sheet has no data rows." },
        { status: 400 }
      );
    }

    const missingColumns = getMissingExternalImportColumns(rows);
    if (missingColumns.length > 0) {
      return NextResponse.json(
        {
          error: `Missing required Excel column(s): ${missingColumns.join(", ")}`,
          errors: missingColumns.map((col) => `Missing required column: ${col}`),
        },
        { status: 400 }
      );
    }

    const rowResults: ImportRowResult[] = [];
    const errors: string[] = [];
    let created = 0;
    let updated = 0;
    let unchanged = 0;

    for (let index = 0; index < rows.length; index += 1) {
      const rowNumber = index + 2;
      const rawRow = rows[index] ?? {};
      const hasAnyValue = Object.values(rawRow).some(
        (val) => String(val ?? "").trim() !== ""
      );
      if (!hasAnyValue) continue;

      const extracted = extractExternalRowValues(rawRow);
      const displayName =
        extracted.productName || extracted.productCode || `Row ${rowNumber}`;

      const validation = validateExternalProductInput(extracted);
      if (!validation.valid) {
        const message = validation.errors.join("; ");
        errors.push(`Row ${rowNumber}: ${message}`);
        rowResults.push({
          row: rowNumber,
          productName: displayName,
          status: "failed",
          message,
        });
        continue;
      }

      const payload = validation.data;

      try {
        const existing = await prisma.externalProduct.findUnique({
          where: { productCode: payload.productCode },
        });

        if (!existing) {
          await prisma.externalProduct.create({ data: payload });
          created += 1;
          rowResults.push({
            row: rowNumber,
            productName: `${payload.productName} (${payload.productCode})`,
            status: "created",
            message: "Created successfully",
          });
          continue;
        }

        const isSame =
          existing.productName === payload.productName &&
          (existing.casNo ?? null) === payload.casNo &&
          existing.type === payload.type &&
          existing.brand === payload.brand &&
          existing.pack === payload.pack &&
          existing.hsn === payload.hsn &&
          Number(existing.gstPercent) === payload.gstPercent &&
          (existing.sellingRate ?? null) === payload.sellingRate &&
          existing.units === payload.units;

        if (isSame) {
          unchanged += 1;
          rowResults.push({
            row: rowNumber,
            productName: `${payload.productName} (${payload.productCode})`,
            status: "unchanged",
            message: "No changes detected",
          });
          continue;
        }

        await prisma.externalProduct.update({
          where: { id: existing.id },
          data: payload,
        });
        updated += 1;
        rowResults.push({
          row: rowNumber,
          productName: `${payload.productName} (${payload.productCode})`,
          status: "updated",
          message: "Updated existing product code",
        });
      } catch (rowError) {
        const message =
          rowError instanceof Error ? rowError.message : "Database write failed";
        errors.push(`Row ${rowNumber}: ${message}`);
        rowResults.push({
          row: rowNumber,
          productName: displayName,
          status: "failed",
          message,
        });
      }
    }

    const imported = created + updated;
    if (imported > 0) {
      emitRealtimeUpdate(["external-products"], "external-products-imported");
    }

    const parts: string[] = [];
    if (created > 0) parts.push(`${created} created`);
    if (updated > 0) parts.push(`${updated} updated`);
    if (unchanged > 0) parts.push(`${unchanged} unchanged`);
    if (errors.length > 0) parts.push(`${errors.length} failed`);

    return NextResponse.json({
      success: true,
      message: parts.length
        ? `External products import finished: ${parts.join(", ")}.`
        : "Import completed.",
      imported,
      created,
      updated,
      unchanged,
      failed: errors.length,
      errors,
      rowResults,
    });
  } catch (error) {
    console.error("External products import error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to import external products Excel",
      },
      { status: 500 }
    );
  }
}

