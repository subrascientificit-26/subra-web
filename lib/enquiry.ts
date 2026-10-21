export interface EnquiryPrefillParams {
  productId?: string;
  productName?: string;
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
