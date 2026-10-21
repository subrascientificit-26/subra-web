/** Shared horizontal padding for header, content, and footer across the app. */
export const PAGE_CONTAINER_CLASS =
  "max-w-[98%] mx-auto w-full px-2 sm:px-3 lg:px-4";

/** Sticky sidebar below the fixed site header — only the sidebar scrolls on desktop. */
export const STICKY_SIDEBAR_CLASS =
  "lg:sticky lg:top-[var(--site-header-height)] lg:self-start lg:max-h-[calc(100vh-var(--site-header-height)-1rem)] lg:overflow-y-auto lg:scrollbar-none";
