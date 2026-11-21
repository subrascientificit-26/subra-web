export const ADMIN_LABEL_CLASS =
  "block text-xs font-semibold text-muted uppercase tracking-wider mb-2";

export const ADMIN_INPUT_CLASS =
  "w-full h-11 rounded-xl border border-border bg-surface-elevated px-3.5 text-sm text-foreground outline-none transition-all placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/20";

export const ADMIN_TEXTAREA_CLASS =
  "w-full rounded-xl border border-border bg-surface-elevated p-3.5 text-sm text-foreground outline-none transition-all placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/20 resize-none";

export const ADMIN_SELECT_CLASS =
  "w-full h-11 rounded-xl border border-border bg-surface-elevated px-3 text-sm text-foreground outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20";

export const ADMIN_TOOLBAR_SELECT_CLASS =
  "h-10 rounded-xl border border-border bg-surface px-3 text-xs text-foreground outline-none focus:border-primary transition-all";

export const ADMIN_SEARCH_CLASS =
  "w-full h-10 pl-10 pr-8 rounded-xl border border-border bg-surface-elevated text-xs text-foreground placeholder:text-muted outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all";

export const ADMIN_CARD_CLASS =
  "rounded-2xl bg-surface border border-border p-5 shadow-sm theme-dark:shadow-xl";

export const ADMIN_SECONDARY_BTN_CLASS =
  "rounded-xl border border-border bg-surface-elevated text-muted font-medium text-sm hover:border-primary/40 hover:text-foreground transition-all";

export const ADMIN_TOOLBAR_BTN_CLASS =
  "h-10 px-4 rounded-xl border border-border bg-surface text-foreground whitespace-nowrap text-xs font-semibold transition-colors hover:border-primary hover:bg-surface-elevated flex items-center gap-2 cursor-pointer";

export const ADMIN_FORM_CARD_CLASS =
  "bg-surface backdrop-blur-md border border-border rounded-xl p-6 shadow-sm theme-dark:shadow-xl transition-all duration-200";

export const ADMIN_FORM_INPUT_CLASS =
  "w-full h-11 rounded-lg border border-border bg-surface-elevated px-4 text-sm text-foreground placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none disabled:opacity-50 disabled:cursor-not-allowed";

export const ADMIN_FORM_TEXTAREA_CLASS =
  "w-full rounded-lg border border-border bg-surface-elevated px-4 py-3 text-sm text-foreground placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none disabled:opacity-50 disabled:cursor-not-allowed resize-none";

export const ADMIN_EMPTY_BADGE_CLASS =
  "bg-surface-elevated border border-border text-muted";

export function withFieldError(baseClass: string, hasError: boolean) {
  return hasError
    ? `${baseClass} border-red-500 focus:border-red-500`
    : baseClass;
}
