export interface EnquiryPrefillParams {
  productId?: string;
  productName?: string;
  image?: string;
  casNo?: string;
  molecularFormula?: string;
  molecularWeight?: string;
  category?: string;
  subCategory?: string;
  quantity?: string;
  packSize?: string;
  price?: string;
  subject?: string;
  message?: string;
}

const PREFILL_KEYS: Array<keyof EnquiryPrefillParams> = [
  'productId',
  'productName',
  'image',
  'casNo',
  'molecularFormula',
  'molecularWeight',
  'category',
  'subCategory',
  'quantity',
  'packSize',
  'price',
  'subject',
  'message',
];

export function parseEnquiryPrefillFromSearchParams(
  searchParams: URLSearchParams
): EnquiryPrefillParams {
  const params: EnquiryPrefillParams = {};

  for (const key of PREFILL_KEYS) {
    const value = searchParams.get(key)?.trim();
    if (value) {
      params[key] = value;
    }
  }

  return params;
}

export interface EnquiryFormDefaults {
  fullName: string;
  companyName: string;
  email: string;
  phoneNumber: string;
  subject: string;
  productCategory: string;
  message: string;
}

export function hasEnquiryProductPrefill(params: EnquiryPrefillParams) {
  return Boolean(
    params.productId ||
      params.productName ||
      params.casNo ||
      params.message ||
      params.subject
  );
}

export function getEnquiryFormDefaults(
  searchParams: URLSearchParams
): EnquiryFormDefaults {
  const defaults: EnquiryFormDefaults = {
    fullName: '',
    companyName: '',
    email: '',
    phoneNumber: '',
    subject: '',
    productCategory: '',
    message: '',
  };

  const prefill = parseEnquiryPrefillFromSearchParams(searchParams);
  if (!hasEnquiryProductPrefill(prefill)) {
    return defaults;
  }

  return {
    ...defaults,
    subject: prefill.subject || 'product-inquiry',
    productCategory: prefill.productName || '',
  };
}

export const ENQUIRY_MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
export const ENQUIRY_ALLOWED_FILE_ACCEPT =
  '.pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.jpg,.jpeg,.png,.webp,.gif,.avif';

const ENQUIRY_IMAGE_EXT_RE = /\.(jpe?g|png|webp|gif|avif|bmp)$/i;
const ENQUIRY_ALLOWED_EXT_RE =
  /\.(pdf|docx?|xlsx?|csv|txt|jpe?g|png|webp|gif|avif)$/i;
const ENQUIRY_ALLOWED_MIME_PREFIXES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/avif',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/csv',
  'text/plain',
];

export function validateEnquiryAttachmentFile(
  file: Pick<File, 'name' | 'type' | 'size'>
): string | null {
  if (!file || file.size === 0) {
    return 'Selected file is empty.';
  }

  if (file.size > ENQUIRY_MAX_FILE_SIZE_BYTES) {
    return 'Uploaded file must be 10 MB or smaller.';
  }

  const normalizedType = (file.type || '').toLowerCase();
  const hasAllowedMime =
    ENQUIRY_ALLOWED_MIME_PREFIXES.includes(normalizedType) ||
    (normalizedType.startsWith('image/') && normalizedType !== 'image/svg+xml');
  const hasAllowedExt = ENQUIRY_ALLOWED_EXT_RE.test(file.name || '');

  if (!hasAllowedMime && !hasAllowedExt) {
    return 'Unsupported file type. Upload JPG, PNG, WEBP, GIF, PDF, DOC, DOCX, XLS, or XLSX.';
  }

  return null;
}

export function isEnquiryImageUrl(url?: string | null): boolean {
  const trimmed = url?.trim();
  if (!trimmed) return false;
  if (trimmed.startsWith('blob:') || /^data:image\/(?!svg\+xml)/i.test(trimmed)) {
    return true;
  }
  const cleanPath = trimmed.split('#')[0]?.split('?')[0] ?? '';
  return ENQUIRY_IMAGE_EXT_RE.test(cleanPath);
}

export function getEnquiryAttachmentName(url?: string | null): string {
  const trimmed = url?.trim();
  if (!trimmed) return '';
  const cleanPath = trimmed.split('#')[0]?.split('?')[0] ?? trimmed;
  const rawName = cleanPath.split('/').pop() || cleanPath;
  try {
    return decodeURIComponent(rawName).replace(/^\d+-[a-z0-9]+-/i, '') || rawName;
  } catch {
    return rawName.replace(/^\d+-[a-z0-9]+-/i, '') || rawName;
  }
}

export function formatEnquiryFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
