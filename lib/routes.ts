/** Centralized route definitions — use these instead of hardcoded path strings. */

export const ROUTES = {
  home: "/",
  search: "/search",

  applications: "/applications",
  products: "/products",
  productDetail: (id: string | number) => `/products/${id}`,
  externalProducts: "/external-products",
  externalProductDetail: (id: string | number) => `/external-products/${id}`,
  productsByCategory: (categoryId: string | number) =>
    `/products?category=${categoryId}`,
  customProducts: "/custom-products",
  azProducts: "/a-z-products",
  cart: "/cart",
  enquiry: "/enquiry",
  aboutUs: "/about-us",
  privacyPolicy: "/privacy-policy",
  termsAndConditions: "/terms-and-conditions",
  helpSupport: "/help-support",
  // orders: "/orders",

  login: "/login",
  register: "/register",
  forgotPassword: "/forgot",
  resetPassword: "/reset-password",
  dashboard: "/dashboard",

  admin: {
    root: "/admin",
    dashboard: "/admin/dashboard",
    products: "/admin/products",
    productCreate: "/admin/products/create",
    productView: (id: string | number) => `/admin/products/view/${id}`,
    productEdit: (id: string | number) => `/admin/products/edit/${id}`,
    externalProducts: "/admin/external-products",
    categories: "/admin/categories",
    categoryEdit: (id: string | number) => `/admin/categories/edit/${id}`,
    subcategories: "/admin/subcategories",
    subcategoryEdit: (id: string | number) => `/admin/subcategories/edit/${id}`,
    enquiry: "/admin/enquiry",
    sidebar: "/admin/sidebar",
    settings: "/admin/settings",
    users: "/admin/users",
  },
} as const;

export const NAV_LINKS = {
  public: [
    { label: "Applications", href: ROUTES.applications },
    { label: "Products", href: ROUTES.products },
    { label: "About Us", href: ROUTES.aboutUs },
    { label: "Enquiry", href: ROUTES.enquiry },
  ],
  productDropdown: [
    { label: "All Products", href: ROUTES.products },
    { label: "A-Z Products", href: ROUTES.azProducts },
    { label: "Custom Products", href: ROUTES.customProducts },
  ],
  footer: {
    quickLinks: [
      { label: "Applications", href: ROUTES.applications },
      { label: "Products", href: ROUTES.products },
      { label: "Custom Products", href: ROUTES.customProducts },
      { label: "A-Z Products", href: ROUTES.azProducts },
      { label: "About Us", href: ROUTES.aboutUs },
      { label: "Enquiry", href: ROUTES.enquiry },
    ],
    customerService: [
      { label: "My Profile", href: ROUTES.dashboard },
      // { label: "My Orders", href: ROUTES.orders },
      // { label: "Track Order", href: ROUTES.orders },
      { label: "Help & Support", href: ROUTES.helpSupport },
      { label: "Terms & Conditions", href: ROUTES.termsAndConditions },
      { label: "Privacy Policy", href: ROUTES.privacyPolicy },
    ],
  },
  homeCategories: [
    { title: "Applications", href: ROUTES.applications },
    { title: "Products", href: ROUTES.products },
    { title: "Custom Products", href: ROUTES.customProducts },
    { title: "A-Z Products", href: ROUTES.azProducts },
    { title: "Enquiry", href: ROUTES.enquiry },
    // { title: "My Orders", href: ROUTES.orders },
  ],
  azSidebar: [
    { title: "All Products", href: ROUTES.products },
    { title: "Custom Products", href: ROUTES.customProducts },
    { title: "Request Quote", href: ROUTES.enquiry },
  ],
} as const;

export function buildSearchUrl(query: string, scope = "all") {
  const params = new URLSearchParams();
  if (query.trim()) params.set("q", query.trim());
  if (scope !== "all") params.set("scope", scope);
  const qs = params.toString();
  return qs ? `${ROUTES.search}?${qs}` : ROUTES.search;
}

export interface EnquiryUrlParams {
  productId?: string | number;
  productName?: string;
  image?: string;
  casNo?: string;
  molecularFormula?: string;
  molecularWeight?: string | number;
  category?: string;
  subCategory?: string;
  quantity?: string | number;
  packSize?: string;
  price?: string | number;
  subject?: string;
  message?: string;
}

export function buildEnquiryUrl(params?: EnquiryUrlParams) {
  if (!params) return ROUTES.enquiry;

  const search = new URLSearchParams();

  const entries: Array<[keyof EnquiryUrlParams, string | number | undefined]> = [
    ["productId", params.productId],
    ["productName", params.productName],
    ["image", params.image],
    ["casNo", params.casNo],
    ["molecularFormula", params.molecularFormula],
    ["molecularWeight", params.molecularWeight],
    ["category", params.category],
    ["subCategory", params.subCategory],
    ["quantity", params.quantity],
    ["packSize", params.packSize],
    ["price", params.price],
    ["subject", params.subject],
    ["message", params.message],
  ];

  for (const [key, value] of entries) {
    const text = value === undefined || value === null ? "" : String(value).trim();
    if (text) {
      search.set(key, text);
    }
  }

  const qs = search.toString();
  return qs ? `${ROUTES.enquiry}?${qs}` : ROUTES.enquiry;
}
