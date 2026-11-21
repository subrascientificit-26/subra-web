"use client";

import Link from "next/link";
import Image from "next/image";
import {
  Target,
  Eye,
  Heart,
  ArrowRight,
  FlaskConical,
  ShieldCheck,
  Users,
} from "lucide-react";
import { PageHero } from "@/components/ui";
import WidgetCardIcon from "@/components/WidgetCardIcon";
import { ROUTES } from "@/lib/routes";
import { PAGE_CONTAINER_CLASS } from "@/lib/layout";
import { useSiteSettings } from "@/lib/hooks/useSiteSettings";

const VALUES = [
  {
    icon: ShieldCheck,
    title: "Quality First",
    description:
      "We source and supply products that meet rigorous quality standards for research and industrial use.",
  },
  {
    icon: Users,
    title: "Customer Focus",
    description:
      "Every enquiry is handled with care — from quotation to delivery, our team is here to support you.",
  },
  {
    icon: FlaskConical,
    title: "Scientific Expertise",
    description:
      "Deep knowledge of specialty chemicals, reagents, and laboratory supplies across diverse applications.",
  },
];

export default function AboutUsContent() {
  const { settings } = useSiteSettings();
  const siteTitle = settings.siteName;

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <div className="flex-grow">
        <div className={`${PAGE_CONTAINER_CLASS} py-4`}>
          <PageHero
            title="About Us"
            description={`Learn more about ${siteTitle || "our company"} — your trusted partner for high-quality specialty chemicals, laboratory reagents, instruments, and lab consumables.`}
            image="/Lab-test.jpg"
            imageAlt="About us"
            breadcrumbs={[
              { label: "Home", href: ROUTES.home },
              { label: "About Us" },
            ]}
          />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div className="rounded-2xl border border-border bg-surface p-6 md:p-8 shadow-lg theme-light:shadow-md">
              <h2 className="text-xl font-bold text-foreground mb-3">Who We Are</h2>
              <div className="h-1 w-12 rounded-full bg-primary mb-4" />
              <p className="text-sm sm:text-base text-muted leading-7 mb-4">
                {siteTitle || "We"} are a dedicated supplier of specialty chemicals,
                laboratory reagents, instruments, and consumables serving research
                laboratories, educational institutions, and industries across India and
                beyond.
              </p>
              <p className="text-sm sm:text-base text-muted leading-7">
                With a comprehensive product catalogue spanning multiple application
                areas, we make it easy for scientists and procurement teams to find,
                enquire about, and source the materials they need — backed by responsive
                support and reliable delivery.
              </p>
            </div>

            <div className="relative overflow-hidden rounded-2xl border border-border min-h-[280px]">
              <Image
                src="/Lab-test.jpg"
                alt="Laboratory"
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-6">
                <p className="text-white text-lg font-semibold">
                  Empowering Science &amp; Industry
                </p>
                <p className="text-white/80 text-sm mt-1">
                  Trusted by professionals worldwide
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="rounded-2xl border border-border bg-surface p-6 shadow-lg theme-light:shadow-md">
              <div className="flex h-11 w-11 items-center justify-center rounded-full border border-primary/30 bg-primary/10 mb-4">
                <Target size={20} className="text-primary" />
              </div>
              <h3 className="text-base font-semibold text-foreground mb-2">Our Mission</h3>
              <p className="text-sm text-muted leading-6">
                To provide scientists, researchers, and industries with reliable access
                to quality laboratory products and exceptional customer service.
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-surface p-6 shadow-lg theme-light:shadow-md">
              <div className="flex h-11 w-11 items-center justify-center rounded-full border border-primary/30 bg-primary/10 mb-4">
                <Eye size={20} className="text-primary" />
              </div>
              <h3 className="text-base font-semibold text-foreground mb-2">Our Vision</h3>
              <p className="text-sm text-muted leading-6">
                To be the preferred catalogue and supply partner for laboratory and
                industrial chemical needs across diverse sectors.
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-surface p-6 shadow-lg theme-light:shadow-md">
              <div className="flex h-11 w-11 items-center justify-center rounded-full border border-primary/30 bg-primary/10 mb-4">
                <Heart size={20} className="text-primary" />
              </div>
              <h3 className="text-base font-semibold text-foreground mb-2">Our Values</h3>
              <p className="text-sm text-muted leading-6">
                Integrity, quality assurance, and a commitment to helping our customers
                succeed in their research and production goals.
              </p>
            </div>
          </div>

          {settings.heroCards.length > 0 && (
            <div className="rounded-2xl border border-border bg-surface p-6 md:p-8 mb-6 shadow-lg theme-light:shadow-md">
              <h2 className="text-xl font-bold text-foreground mb-2">At a Glance</h2>
              <div className="h-1 w-12 rounded-full bg-primary mb-6" />
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {settings.heroCards.map((card) => (
                  <div
                    key={card.id}
                    className="text-center rounded-xl border border-border bg-surface-elevated p-4"
                  >
                    {card.count && (
                      <p className="text-2xl font-bold text-primary mb-1">{card.count}</p>
                    )}
                    <div className="flex justify-center mb-2">
                      <WidgetCardIcon icon={card.icon} size={22} className="text-primary" />
                    </div>
                    <p className="text-sm font-semibold text-foreground">{card.title}</p>
                    <p className="text-xs text-muted mt-1 leading-5">{card.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div className="rounded-2xl border border-border bg-surface p-6 md:p-8 shadow-lg theme-light:shadow-md">
              <h2 className="text-xl font-bold text-foreground mb-2">Why Choose Us</h2>
              <div className="h-1 w-12 rounded-full bg-primary mb-6" />
              <div className="space-y-5">
                {VALUES.map((item) => (
                  <div key={item.title} className="flex gap-4">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border border-primary/30 bg-primary/10">
                      <item.icon size={18} className="text-primary" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-foreground">{item.title}</h3>
                      <p className="text-sm text-muted leading-6 mt-1">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {settings.serviceCards.length > 0 && (
              <div className="rounded-2xl border border-border bg-surface p-6 md:p-8 shadow-lg theme-light:shadow-md">
                <h2 className="text-xl font-bold text-foreground mb-2">What We Offer</h2>
                <div className="h-1 w-12 rounded-full bg-primary mb-6" />
                <div className="space-y-4">
                  {settings.serviceCards.map((card) => (
                    <div key={card.id} className="flex gap-4 items-start">
                      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border border-primary/60">
                        <WidgetCardIcon icon={card.icon} size={18} className="text-primary" />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-foreground">{card.title}</h3>
                        <p className="text-sm text-muted leading-6 mt-1">{card.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-primary/30 bg-primary/5 p-6 md:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-foreground mb-1">Ready to get started?</h2>
              <p className="text-sm text-muted">
                Browse our catalogue or reach out — we&apos;re happy to help with your requirements.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href={ROUTES.products}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-white hover:opacity-90 transition"
              >
                Browse Products
                <ArrowRight size={16} />
              </Link>
              <Link
                href={ROUTES.enquiry}
                className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-5 py-2.5 text-sm font-medium text-foreground hover:border-primary/40 transition"
              >
                Contact Us
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
