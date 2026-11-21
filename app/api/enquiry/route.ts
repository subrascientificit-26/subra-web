import { mkdir, unlink, writeFile } from 'fs/promises';
import path from 'path';
import { prisma } from '@/lib/prisma';
import { requireAdmin, getAuthUser } from '@/lib/auth';
import { NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import {
  createTransporterFromConfig,
  formatSmtpFromAddress,
  getSmtpStatus,
  resolveAppBaseUrl,
} from '@/lib/smtp';
import { generateRandomPassword } from '@/lib/validators';
import { escapeEmailHtml, sendNewAccountCredentialsEmail } from '@/lib/mail';
import { getUsernameFromEmail } from '@/lib/messages';
import { validateEnquiryAttachmentFile } from '@/lib/enquiry';
import { verifyCaptchaToken } from '@/lib/captcha';
import { emitRealtimeUpdate } from '@/lib/realtime';

const ENQUIRY_UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads', 'enquiries');

function sanitizeEnquiryFilename(originalName: string) {
  const baseName = path.basename(originalName || 'attachment');
  const ext = path.extname(baseName).replace(/[^a-zA-Z0-9.]/g, '').slice(0, 12);
  const stem = path
    .basename(baseName, path.extname(baseName))
    .replace(/[^a-zA-Z0-9_-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);

  return `${stem || 'file'}${ext || ''}`;
}

async function saveEnquiryAttachment(file: File): Promise<string> {
  const validationError = validateEnquiryAttachmentFile(file);
  if (validationError) {
    throw new Error(validationError);
  }

  await mkdir(ENQUIRY_UPLOAD_DIR, { recursive: true });

  const safeName = sanitizeEnquiryFilename(file.name);
  const uniqueName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safeName}`;
  const fullPath = path.join(ENQUIRY_UPLOAD_DIR, uniqueName);
  const buffer = Buffer.from(await file.arrayBuffer());

  await writeFile(fullPath, buffer);
  return `/uploads/enquiries/${uniqueName}`;
}

async function deleteStoredEnquiryFile(fileUrl?: string | null) {
  const trimmed = fileUrl?.trim();
  if (!trimmed || !trimmed.startsWith('/uploads/enquiries/')) return;

  const fileName = trimmed.slice('/uploads/enquiries/'.length);
  if (!fileName || fileName.includes('/') || fileName.includes('\\')) return;

  const resolvedPath = path.resolve(ENQUIRY_UPLOAD_DIR, fileName);
  const resolvedRoot = path.resolve(ENQUIRY_UPLOAD_DIR);
  if (!resolvedPath.startsWith(`${resolvedRoot}${path.sep}`)) return;

  await unlink(resolvedPath).catch(() => {});
}

function parseEnquiryNumericId(raw: unknown): number | null {
  if (typeof raw === 'number' && Number.isInteger(raw) && raw > 0) {
    return raw;
  }
  if (typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  if (/^\d+$/.test(trimmed)) {
    const parsed = Number.parseInt(trimmed, 10);
    return parsed > 0 ? parsed : null;
  }
  const formattedMatch = trimmed.match(/^ENQ-0*(\d+)$/i);
  if (formattedMatch?.[1]) {
    const parsed = Number.parseInt(formattedMatch[1], 10);
    return parsed > 0 ? parsed : null;
  }
  return null;
}

function mapPublicEnquiry(enquiry: {
  id: number;
  subject: string;
  createdAt: Date;
}) {
  return {
    id: `ENQ-${String(enquiry.id).padStart(5, '0')}`,
    title: enquiry.subject || 'Enquiry',
    date: new Date(enquiry.createdAt).toLocaleDateString('en-IN'),
    status: 'Completed',
    icon: '📩',
  };
}

function mapAdminEnquiry(
  enquiry: {
    id: number;
    fullName: string;
    companyName: string;
    email: string;
    phoneNumber: string;
    subject: string;
    productCategory: string | null;
    message: string;
    fileUrl: string | null;
    createdAt: Date;
  },
  productIdByCategory: Map<string, number>,
  accountEmails: Set<string>
) {
  const productCategory = enquiry.productCategory;
  const productId = productCategory
    ? productIdByCategory.get(productCategory) ?? null
    : null;

  return {
    rawId: enquiry.id,
    id: `ENQ-${String(enquiry.id).padStart(5, '0')}`,
    title: enquiry.subject || 'Enquiry',
    date: new Date(enquiry.createdAt).toLocaleDateString('en-IN'),
    status: 'Completed',
    fullName: enquiry.fullName,
    companyName: enquiry.companyName,
    email: enquiry.email,
    phoneNumber: enquiry.phoneNumber,
    subject: enquiry.subject,
    productCategory,
    productId,
    message: enquiry.message,
    fileUrl: enquiry.fileUrl,
    hasAccount: accountEmails.has(enquiry.email.toLowerCase()),
    createdAt: enquiry.createdAt.toISOString(),
  };
}

async function resolveProductIds(categories: (string | null | undefined)[]) {
  const unique = [...new Set(categories.filter(Boolean))] as string[];
  const productIdByCategory = new Map<string, number>();

  if (!unique.length) return productIdByCategory;

  const numericIds = unique
    .filter((value) => /^\d+$/.test(value))
    .map((value) => Number.parseInt(value, 10));

  const products = await prisma.product.findMany({
    where: {
      isDeleted: false,
      OR: [
        { name: { in: unique } },
        { slug: { in: unique } },
        ...(numericIds.length ? [{ id: { in: numericIds } }] : []),
      ],
    },
    select: { id: true, name: true, slug: true },
  });

  for (const category of unique) {
    if (/^\d+$/.test(category)) {
      const product = products.find((item) => item.id === Number.parseInt(category, 10));
      if (product) productIdByCategory.set(category, product.id);
      continue;
    }

    const exactMatch = products.find(
      (item) => item.name === category || item.slug === category
    );
    if (exactMatch) {
      productIdByCategory.set(category, exactMatch.id);
      continue;
    }

    const normalized = category.toLowerCase();
    const partialMatch = products.find(
      (item) =>
        item.name.toLowerCase().includes(normalized) ||
        normalized.includes(item.name.toLowerCase())
    );
    if (partialMatch) {
      productIdByCategory.set(category, partialMatch.id);
    }
  }

  return productIdByCategory;
}

// Auto-create an account for enquirers who are not logged in and do not yet
// have an account. Emails the generated credentials. Never throws — a failure
// here must not break the enquiry submission itself.
async function autoCreateAccountForEnquiry(details: {
  email: string;
  fullName?: string;
  baseUrl?: string;
}): Promise<boolean> {
  const email = details.email?.trim().toLowerCase();
  if (!email) return false;

  try {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) return false;

    const password = generateRandomPassword();
    const hashedPassword = await bcrypt.hash(password, 10);
    const name = details.fullName?.trim() || getUsernameFromEmail(email);

    await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
        emailVerified: true,
      },
    });

    await sendNewAccountCredentialsEmail({
      email,
      name,
      password,
      baseUrl: details.baseUrl,
    });
    return true;
  } catch (error) {
    console.error('Failed to auto-create account for enquiry:', error);
    return false;
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const limitParam = searchParams.get('limit');

    if (limitParam) {
      const enquiries = await prisma.enquiry.findMany({
        orderBy: { createdAt: 'desc' },
        take: Number.parseInt(limitParam, 10) || 4,
        select: {
          id: true,
          subject: true,
          createdAt: true,
        },
      });

      return NextResponse.json(enquiries.map(mapPublicEnquiry));
    }

    const auth = await requireAdmin(req);
    if (auth instanceof NextResponse) return auth;

    const enquiries = await prisma.enquiry.findMany({
      orderBy: { createdAt: 'desc' },
    });

    const productIdByCategory = await resolveProductIds(
      enquiries.map((enquiry) => enquiry.productCategory)
    );

    const uniqueEmails = [
      ...new Set(enquiries.map((enquiry) => enquiry.email.toLowerCase())),
    ];
    const usersWithAccounts = uniqueEmails.length
      ? await prisma.user.findMany({
          where: { email: { in: uniqueEmails } },
          select: { email: true },
        })
      : [];
    const accountEmails = new Set(
      usersWithAccounts.map((user) => user.email.toLowerCase())
    );

    return NextResponse.json(
      enquiries.map((enquiry) =>
        mapAdminEnquiry(enquiry, productIdByCategory, accountEmails)
      )
    );
  } catch (error) {
    console.error('Failed to fetch enquiries:', error);

    return NextResponse.json(
      { success: false, message: 'Failed to fetch enquiries' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const contentType = req.headers.get('content-type') || '';

    let fullName = '';
    let companyName = '';
    let email = '';
    let phoneNumber = '';
    let subject = '';
    let productCategory = '';
    let message = '';
    let fileUrl: string | null = null;
    let uploadedFile: File | null = null;
    let captchaToken: unknown = '';
    let captchaAnswer: unknown = '';

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      fullName = formData.get('fullName')?.toString() ?? '';
      companyName = formData.get('companyName')?.toString() ?? '';
      email = formData.get('email')?.toString() ?? '';
      phoneNumber = formData.get('phoneNumber')?.toString() ?? '';
      subject = formData.get('subject')?.toString() ?? '';
      productCategory = formData.get('productCategory')?.toString() ?? '';
      message = formData.get('message')?.toString() ?? '';
      captchaToken = formData.get('captchaToken')?.toString() ?? '';
      captchaAnswer = formData.get('captchaAnswer')?.toString() ?? '';

      const uploaded = formData.get('file') ?? formData.get('attachment');
      if (uploaded instanceof File && uploaded.size > 0) {
        uploadedFile = uploaded;
      }
    } else {
      const body = await req.json();
      fullName = typeof body?.fullName === 'string' ? body.fullName : '';
      companyName = typeof body?.companyName === 'string' ? body.companyName : '';
      email = typeof body?.email === 'string' ? body.email : '';
      phoneNumber = typeof body?.phoneNumber === 'string' ? body.phoneNumber : '';
      subject = typeof body?.subject === 'string' ? body.subject : '';
      productCategory =
        typeof body?.productCategory === 'string' ? body.productCategory : '';
      message = typeof body?.message === 'string' ? body.message : '';
      captchaToken = body?.captchaToken;
      captchaAnswer = body?.captchaAnswer;
      fileUrl =
        typeof body?.fileUrl === 'string' && body.fileUrl.trim()
          ? body.fileUrl.trim()
          : null;
    }

    const trimmedMessage = message.trim();

    if (!trimmedMessage) {
      return NextResponse.json(
        {
          success: false,
          message: 'Your message / requirements cannot be empty.',
        },
        { status: 400 }
      );
    }

    const captchaResult = verifyCaptchaToken(captchaToken, captchaAnswer);
    if (!captchaResult.valid) {
      return NextResponse.json(
        {
          success: false,
          message: captchaResult.error,
          code: 'CAPTCHA_INVALID',
        },
        { status: 400 }
      );
    }

    if (uploadedFile) {
      try {
        fileUrl = await saveEnquiryAttachment(uploadedFile);
      } catch (uploadError) {
        return NextResponse.json(
          {
            success: false,
            message:
              uploadError instanceof Error
                ? uploadError.message
                : 'Invalid uploaded file.',
          },
          { status: 400 }
        );
      }
    }

    const enquiry = await prisma.enquiry.create({
      data: {
        fullName: fullName.trim(),
        companyName: companyName.trim(),
        email: email.trim(),
        phoneNumber: phoneNumber.trim(),
        subject: subject.trim(),
        productCategory: productCategory.trim() || null,
        message: trimmedMessage,
        fileUrl,
      },
    });

    // If the enquirer is not logged in, auto-create an account and email the
    // login credentials so they can track their enquiries.
    const currentUser = await getAuthUser(req);
    const trimmedEmail = email.trim();
    const baseUrl = resolveAppBaseUrl(req);
    let createdNewAccount = false;
    if (!currentUser && trimmedEmail) {
      createdNewAccount = await autoCreateAccountForEnquiry({
        email: trimmedEmail,
        fullName: fullName.trim() || undefined,
        baseUrl,
      });
    }

    try {
      const smtpStatus = await getSmtpStatus();
      if (smtpStatus.configured) {
        const transporter = createTransporterFromConfig(smtpStatus.config);
        const from = formatSmtpFromAddress(smtpStatus.config);
        const adminEmail = smtpStatus.config.adminEmail;
        const rawBrandName = smtpStatus.config.siteName?.trim() || 'Subra Scientific';
        const safeBrandName = escapeEmailHtml(rawBrandName);
        const safeSubject = escapeEmailHtml(String(subject || 'General Enquiry'));
        const safeFullName = escapeEmailHtml(String(fullName || 'Customer'));
        const safeCompanyName = escapeEmailHtml(String(companyName || '-'));
        const safeEmail = escapeEmailHtml(trimmedEmail || '-');
        const safePhone = escapeEmailHtml(String(phoneNumber || '-'));
        const safeProductCategory = escapeEmailHtml(String(productCategory || '-'));
        const safeMessage = escapeEmailHtml(trimmedMessage);
        const fullAttachmentUrl = fileUrl
          ? fileUrl.startsWith('http://') || fileUrl.startsWith('https://')
            ? fileUrl
            : `${baseUrl}${fileUrl}`
          : '';

        if (adminEmail) {
          await transporter.sendMail({
            from,
            to: adminEmail,
            subject: `New Enquiry - ${subject || 'General Enquiry'}`,
            html: `
<div style="background:#f4f7fb;padding:40px 20px;font-family:Arial,sans-serif;">
  <div style="max-width:650px;margin:auto;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e5e7eb;">

    <div style="background:linear-gradient(135deg,#0f172a,#1e3a8a);padding:30px;text-align:center;">
      <h1 style="color:#ffffff;margin:0;font-size:28px;">
        New Enquiry Received
      </h1>

      <p style="color:#cbd5e1;margin-top:10px;font-size:14px;">
        ${safeBrandName}
      </p>
    </div>

    <div style="padding:30px;">

      <p><b>Name:</b> ${safeFullName}</p>
      <p><b>Company:</b> ${safeCompanyName}</p>
      <p><b>Email:</b> ${safeEmail}</p>
      <p><b>Phone:</b> ${safePhone}</p>
      <p><b>Subject:</b> ${safeSubject}</p>
      <p><b>Product:</b> ${safeProductCategory}</p>
      ${
        fullAttachmentUrl
          ? `<p><b>Attachment:</b> <a href="${escapeEmailHtml(fullAttachmentUrl)}">${escapeEmailHtml(fullAttachmentUrl)}</a></p>`
          : ''
      }

      <div style="margin-top:20px;padding:20px;background:#f8fafc;border-radius:12px;">
        <h3>Message</h3>

        <p>${safeMessage}</p>
      </div>
    </div>

  </div>
</div>
`,
          });
        }

        if (trimmedEmail) {
          await transporter.sendMail({
            from,
            to: trimmedEmail,
            subject: 'Your enquiry has been received',
            html: `
<div style="background:#f4f7fb;padding:40px 20px;font-family:Arial,sans-serif;">
  <div style="max-width:650px;margin:auto;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e5e7eb;">

    <div style="background:linear-gradient(135deg,#2563eb,#1d4ed8);padding:35px;text-align:center;">
      <h1 style="color:#ffffff;margin:0;font-size:30px;">
        Thank You
      </h1>

      <p style="color:#dbeafe;margin-top:10px;font-size:15px;">
        Your enquiry has been received successfully
      </p>
    </div>

    <div style="padding:35px;">

      <p>Hello <b>${safeFullName}</b>,</p>

      <p>
        Thank you for contacting
        <b>${safeBrandName}</b>.
      </p>

      <p>
        We received your enquiry regarding
        <b>${safeSubject}</b>.
      </p>

      <div style="margin:30px 0;padding:20px;border-radius:14px;background:#eff6ff;border:1px solid #bfdbfe;">
        <p style="margin:0;color:#1e3a8a;font-weight:bold;">
          Our team will contact you shortly.
        </p>
      </div>

      <p>Regards,</p>

      <p style="color:#2563eb;font-weight:bold;">
        ${safeBrandName} Team
      </p>
    </div>

  </div>
</div>
`,
          });
        }
      }
    } catch (mailError) {
      console.error('Failed to send enquiry notification emails:', mailError);
    }

    emitRealtimeUpdate(
      createdNewAccount
        ? ['enquiries', 'users', 'dashboard']
        : ['enquiries', 'dashboard'],
      'enquiry-created'
    );

    return NextResponse.json({
      success: true,
      message: 'Enquiry submitted successfully',
      data: enquiry,
    });
  } catch (error) {
    console.log(error);

    return NextResponse.json(
      {
        success: false,
        message: 'Internal server error',
      },
      {
        status: 500,
      }
    );
  }
}

export async function DELETE(req: Request) {
  const auth = await requireAdmin(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const { searchParams } = new URL(req.url);
    let rawId: unknown = searchParams.get('id');

    if (!rawId) {
      const body = await req.json().catch(() => null);
      rawId = body?.id;
    }

    const enquiryId = parseEnquiryNumericId(rawId);
    if (!enquiryId) {
      return NextResponse.json(
        { error: 'Valid enquiry ID is required' },
        { status: 400 }
      );
    }

    const existing = await prisma.enquiry.findUnique({
      where: { id: enquiryId },
      select: { id: true, fileUrl: true },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Enquiry not found' },
        { status: 404 }
      );
    }

    await prisma.enquiry.delete({
      where: { id: enquiryId },
    });

    await deleteStoredEnquiryFile(existing.fileUrl);

    emitRealtimeUpdate(['enquiries', 'dashboard'], 'enquiry-deleted');

    return NextResponse.json({
      success: true,
      message: 'Enquiry deleted successfully',
      id: enquiryId,
    });
  } catch (error) {
    console.error('Failed to delete enquiry:', error);
    return NextResponse.json(
      { error: 'Failed to delete enquiry' },
      { status: 500 }
    );
  }
}
