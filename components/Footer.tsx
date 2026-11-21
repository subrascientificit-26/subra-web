"use client";

import Link from "next/link";
import { MapPin, Phone, Mail } from "lucide-react";
import { useSidebarItems } from "@/lib/hooks/useSidebarItems";
import { useSiteSettings } from "@/lib/hooks/useSiteSettings";
import { PAGE_CONTAINER_CLASS } from "@/lib/layout";
import SiteBranding from "@/components/SiteBranding";
import SocialLinkIcon from "@/components/SocialLinkIcon";
import { NAV_LINKS, ROUTES } from "@/lib/routes";

export default function Footer() {
  const { items: quickLinks } = useSidebarItems("footer", NAV_LINKS.footer.quickLinks);
  const { items: serviceLinks } = useSidebarItems(
    "footer_service",
    NAV_LINKS.footer.customerService
  );
  const { settings } = useSiteSettings();

  return (
    <footer className="border-t border-border bg-surface text-muted py-0">
      <div className={PAGE_CONTAINER_CLASS}>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 py-5 border-b border-border">
          <div>
            <SiteBranding
              href={ROUTES.home}
              showTagline
              titleClassName="text-red-500 font-bold text-2xl"
              taglineClassName="text-xs font-bold text-muted"
              logoClassName="h-10 w-10 object-contain mb-2"
            />
          </div>

          <div>
            <h4 className="font-semibold text-foreground mb-3 text-sm">Quick Links</h4>
            <ul className="grid grid-cols-2 gap-y-2 text-xs sm:text-sm">
              {quickLinks.length > 0 ? (
                quickLinks.map((link) => (
                  <li key={link.id ?? link.href}>
                    <Link href={link.href} className="hover:text-primary transition">
                      {link.label}
                    </Link>
                  </li>
                ))
              ) : (
                <li className="text-muted col-span-2">No links configured</li>
              )}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-foreground mb-3 text-sm">Customer Service</h4>
            <ul className="flex flex-col gap-y-2 text-xs sm:text-sm">
              {serviceLinks.length > 0 ? (
                serviceLinks.map((link) => (
                  <li key={link.id ?? link.href}>
                    <Link href={link.href} className="hover:text-primary transition">
                      {link.label}
                    </Link>
                  </li>
                ))
              ) : (
                <li className="text-muted col-span-2">No links configured</li>
              )}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-foreground mb-3 text-sm">Contact Us</h4>
            <div className="space-y-3 text-xs sm:text-sm text-muted">
              <div className="flex items-start gap-2">
                <MapPin size={15} className="text-foreground mt-0.5 flex-shrink-0" />
                <span className="leading-5 whitespace-pre-line">{settings.companyAddress}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone size={15} className="text-foreground flex-shrink-0" />
                <span>{settings.contactPhone}</span>
              </div>
              <div className="flex items-center gap-2 break-all">
                <Mail size={15} className="text-foreground flex-shrink-0" />
                <span>{settings.contactEmail}</span>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-foreground mb-3 text-sm">Follow Us</h4>
            <div className="flex flex-wrap items-center gap-3">
              {settings.socialLinks.map((link) => (
                <a
                  key={link.id}
                  href={link.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 flex items-center justify-center rounded-full bg-surface-elevated border border-border text-foreground hover:scale-105 transition"
                  aria-label={link.label}
                >
                  <SocialLinkIcon icon={link.icon} label={link.label} size={15} />
                </a>
              ))}
              {settings.socialLinks.length === 0 ? (
                <p className="text-xs text-muted">No social links configured</p>
              ) : null}
            </div>
          </div>
        </div>

        <div className="flex justify-center items-center pt-4 pb-4">
          <div className="text-[11px] sm:text-xs text-muted text-center">
            © {new Date().getFullYear()} {settings.siteName} {settings.siteTagline}. All Rights Reserved.
          </div>
        </div>
      </div>
    </footer>
  );
}
