'use client';

import { PAGE_CONTAINER_CLASS } from '@/lib/layout';
import { useSiteSettings } from '@/lib/hooks/useSiteSettings';

export default function Footer() {
  const { settings } = useSiteSettings();

  return (
    <footer
      className="fixed bottom-0 right-0 left-0 lg:left-[250px] z-40 h-[70px] bg-surface/95 backdrop-blur-md border-t border-border text-foreground"
    >
      <div
        className={`${PAGE_CONTAINER_CLASS} h-full flex flex-col xl:flex-row items-center justify-between gap-2`}
      >
        <div>
          <p className="text-[12px] text-muted text-center xl:text-left">
            © {new Date().getFullYear()} {settings.siteName} {settings.siteTagline}. All Rights Reserved.
          </p>

          {/* <p className="text-[11px] text-muted mt-1 text-center xl:text-left">
            {settings.companyAddress}
          </p> */}
        </div>

        <div className="flex items-center gap-4">
          <button className="text-[12px] text-muted hover:text-primary transition-all">
            Privacy Policy
          </button>

          <div className="w-[1px] h-[12px] bg-border" />

          <button className="text-[12px] text-muted hover:text-primary transition-all">
            Terms & Conditions
          </button>
        </div>
      </div>
    </footer>
  );
}
