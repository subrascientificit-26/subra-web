export function getUsernameFromEmail(email: string): string {
  return email.split("@")[0].trim().toLowerCase();
}

export const DELETE_MESSAGES = {
  categoryHasSubcategories: (count: number, names: string[]) =>
    count === 1
      ? `Cannot delete this category. Subcategory "${names[0]}" is still linked to it. Remove or reassign it first.`
      : `Cannot delete this category. ${count} subcategories are still linked (${names.slice(0, 3).join(", ")}${names.length > 3 ? "..." : ""}). Remove them first.`,
  categoryHasProducts: (count: number) =>
    `Cannot delete this category. ${count} product${count === 1 ? "" : "s"} still use subcategories under it. Move or delete those products first.`,
  subcategoryHasProducts: (count: number, names: string[]) =>
    count === 1
      ? `Cannot delete this subcategory. Product "${names[0]}" is still assigned to it. Move or delete the product first.`
      : `Cannot delete this subcategory. ${count} products are still assigned to it (${names.slice(0, 3).join(", ")}${names.length > 3 ? "..." : ""}). Remove them first.`,
};
