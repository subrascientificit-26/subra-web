import { ROUTES } from "@/lib/routes";

/**
 * Determines whether an admin sidebar link should appear active.
 * List routes (e.g. All Products) use exact match only so sibling
 * routes like /create do not incorrectly highlight the list item.
 */
export function isAdminNavActive(pathname: string | null, targetHref: string): boolean {
  if (!pathname || !targetHref) return false;

  if (pathname === targetHref) return true;

  if (targetHref === ROUTES.admin.products) {
    return false;
  }

  if (targetHref === ROUTES.admin.productCreate) {
    return (
      pathname.startsWith("/admin/products/edit/") ||
      pathname.startsWith("/admin/products/view/")
    );
  }

  if (targetHref === ROUTES.admin.categories) {
    return pathname.startsWith(`${ROUTES.admin.categories}/edit/`);
  }

  if (targetHref === ROUTES.admin.subcategories) {
    return pathname.startsWith(`${ROUTES.admin.subcategories}/edit/`);
  }

  if (targetHref === ROUTES.admin.users) {
    return pathname.startsWith(`${ROUTES.admin.users}/`);
  }

  return pathname.startsWith(`${targetHref}/`);
}
