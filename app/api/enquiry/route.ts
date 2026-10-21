import { prisma } from '@/lib/prisma';
import { requireAdmin, getAuthUser } from '@/lib/auth';
import { NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import {
  createMailTransporter,
  getAdminNotificationEmail,
  getMailFromAddress,
} from '@/lib/smtp';
import { generateRandomPassword } from '@/lib/validators';
import { sendNewAccountCredentialsEmail } from '@/lib/mail';
import { getUsernameFromEmail } from '@/lib/messages';

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
}) {
  const email = details.email?.trim().toLowerCase();
  if (!email) return;

  try {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) return;

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

    await sendNewAccountCredentialsEmail({ email, name, password });
  } catch (error) {
    console.error('Failed to auto-create account for enquiry:', error);
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
    const body = await req.json();

    const {
      fullName,
      companyName,
      email,
      phoneNumber,
      subject,
      productCategory,
      message,
    } = body;

    const trimmedMessage =
      typeof message === 'string' ? message.trim() : '';

    if (!trimmedMessage) {
      return NextResponse.json(
        {
          success: false,
          message: 'Your message / requirements cannot be empty.',
        },
        { status: 400 }
      );
    }

    const enquiry = await prisma.enquiry.create({
      data: {
        fullName,
        companyName,
        email,
        phoneNumber,
        subject,
        productCategory,
        message: trimmedMessage,
      },
    });

    // If the enquirer is not logged in, auto-create an account and email the
    // login credentials so they can track their enquiries.
    const currentUser = await getAuthUser(req);
    if (!currentUser && typeof email === 'string' && email.trim()) {
      await autoCreateAccountForEnquiry({ email, fullName });
    }

    const transporter = await createMailTransporter();
    const from = await getMailFromAddress();
    const adminEmail = await getAdminNotificationEmail();

    if (transporter && from && adminEmail) {
      await transporter.sendMail({
        from,
        to: adminEmail,
        subject: `New Enquiry - ${subject}`,
        html: `
<div style="background:#f4f7fb;padding:40px 20px;font-family:Arial,sans-serif;">
  <div style="max-width:650px;margin:auto;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e5e7eb;">

    <div style="background:linear-gradient(135deg,#0f172a,#1e3a8a);padding:30px;text-align:center;">
      <h1 style="color:#ffffff;margin:0;font-size:28px;">
        New Enquiry Received
      </h1>

      <p style="color:#cbd5e1;margin-top:10px;font-size:14px;">
        Patient Scientific Catalogue
      </p>
    </div>

    <div style="padding:30px;">

      <p><b>Name:</b> ${fullName}</p>
      <p><b>Company:</b> ${companyName}</p>
      <p><b>Email:</b> ${email}</p>
      <p><b>Phone:</b> ${phoneNumber}</p>
      <p><b>Subject:</b> ${subject}</p>
      <p><b>Product:</b> ${productCategory}</p>

      <div style="margin-top:20px;padding:20px;background:#f8fafc;border-radius:12px;">
        <h3>Message</h3>

        <p>${trimmedMessage}</p>
      </div>
    </div>

  </div>
</div>
`,
      });

      await transporter.sendMail({
        from,
        to: email,
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

      <p>Hello <b>${fullName}</b>,</p>

      <p>
        Thank you for contacting
        <b>Patient Scientific Catalogue</b>.
      </p>

      <p>
        We received your enquiry regarding
        <b>${subject}</b>.
      </p>

      <div style="margin:30px 0;padding:20px;border-radius:14px;background:#eff6ff;border:1px solid #bfdbfe;">
        <p style="margin:0;color:#1e3a8a;font-weight:bold;">
          Our team will contact you shortly.
        </p>
      </div>

      <p>Regards,</p>

      <p style="color:#2563eb;font-weight:bold;">
        Patient Scientific Team
      </p>
    </div>

  </div>
</div>
`,
      });
    }

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
