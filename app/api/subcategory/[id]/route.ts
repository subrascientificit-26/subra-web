import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import { NextResponse } from 'next/server';
import { DELETE_MESSAGES } from '@/lib/messages';

function parseIdFromReq(req: Request, context: any) {
  const paramId = context?.params?.id;

  if (paramId) {
    const n = Number(paramId);
    if (!Number.isNaN(n)) return n;
  }

  try {
    const url = new URL(req.url);
    const parts = url.pathname.split('/').filter(Boolean);
    const last = parts[parts.length - 1];
    const n = Number(last);
    if (!Number.isNaN(n)) return n;
  } catch (e) {
    // ignore
  }

  return null;
}

export async function GET(req: Request, context: any) {
  const id = parseIdFromReq(req, context);

  if (!id) {
    return Response.json({ error: 'Invalid ID' }, { status: 400 });
  }

  const subcategory = await prisma.subCategory.findUnique({
    where: { id },
    include: { category: true, products: true },
  });

  if (!subcategory) {
    return Response.json({ error: 'Not found' }, { status: 404 });
  }

  return Response.json(subcategory);
}

export async function DELETE(req: Request, context: any) {
  const auth = await requireAdmin(req);
  if (auth instanceof NextResponse) return auth;

  const id = parseIdFromReq(req, context);

  if (!id) {
    return Response.json({ error: 'Invalid ID' }, { status: 400 });
  }

  const subcategory = await prisma.subCategory.findUnique({
    where: { id },
    include: {
      products: {
        where: { isDeleted: false },
        select: { id: true, name: true },
      },
    },
  });

  if (!subcategory) {
    return Response.json({ error: 'Subcategory not found' }, { status: 404 });
  }

  if (subcategory.products.length > 0) {
    const productNames = subcategory.products.map((product) => product.name);
    return Response.json(
      {
        error: DELETE_MESSAGES.subcategoryHasProducts(
          subcategory.products.length,
          productNames
        ),
      },
      { status: 400 }
    );
  }

  await prisma.subCategory.delete({ where: { id } });

  return Response.json({ message: 'Subcategory deleted' });
}
