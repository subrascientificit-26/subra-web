"use client";

import Link from 'next/link';
import Image from 'next/image';
import { ROUTES } from '@/lib/routes';
import { useSiteSettings } from '@/lib/hooks/useSiteSettings';
import WidgetCardIcon from '@/components/WidgetCardIcon';
import { ChevronRight } from 'lucide-react';

function getHeroGridClass(count: number) {
  if (count <= 1) return "grid-cols-1";
  if (count === 2) return "grid-cols-1 sm:grid-cols-2";
  if (count === 3) return "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3";
  return "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4";
}

export default function Hero() {
  const { settings } = useSiteSettings();
  const siteTitle = settings.siteName || "Welcome";
  const heroCards = settings.heroCards;

  return (
    <section className="bg-background text-foreground overflow-hidden">

      <div className="max-w-[98%] mx-auto sm:px-3">

        {/* ================= HERO GRID ================= */}
        <div className="grid lg:grid-cols-[40%_60%] mt-5 mb-5">

          {/* ================= CONTENT ================= */}
          <div className="order-1 max-w-xl">

            <p className="text-primary text-sm sm:text-base lg:text-lg font-semibold mt-5">
              WELCOME TO
            </p>

            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold leading-tight mb-3">
              {siteTitle}
            </h1>

            <div className="w-16 sm:w-20 h-1 bg-primary mb-4"></div>

            <p className="text-sm sm:text-base lg:text-lg text-muted leading-6 sm:leading-7 mb-5">
              Your trusted partner for high-quality specialty
              chemicals, laboratory reagents, instruments and lab
              consumables.
            </p>

            <Link
              href={ROUTES.products}
              className="
                inline-flex items-center
                bg-primary
                hover:bg-primary-hover
                text-white
                text-sm sm:text-base
                px-4 py-3
                rounded-lg
                transition-all duration-300
                shadow-lg shadow-blue-900/30
              "
            >
              Explore Products

              <ChevronRight
                size={18}
                className="ml-2"
              />
            </Link>
          </div>

          {/* ================= IMAGE ================= */}
          <div className="order-2 relative h-[150px] sm:h-[200px] lg:h-[320px] overflow-hidden rounded-2xl border border-border">

            <Image
              src="/Lab-test.jpg"
              alt="Laboratory"
              fill
              priority
              className="object-cover"
            />

            <div className="absolute inset-0 bg-black/35 theme-light:bg-black/10"></div>

            {/* Dark overlays — hidden in light mode */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#020817_0%,rgba(2,8,23,0.85)_12%,rgba(2,8,23,0)_35%)] theme-light:hidden"></div>
            <div className="absolute inset-0 bg-[linear-gradient(to_left,#020817_0%,rgba(2,8,23,0.75)_10%,rgba(2,8,23,0)_30%)] theme-light:hidden"></div>
            <div className="absolute inset-0 bg-[linear-gradient(to_bottom,#020817_0%,rgba(2,8,23,0.7)_10%,rgba(2,8,23,0)_28%)] theme-light:hidden"></div>
            <div className="absolute inset-0 bg-[linear-gradient(to_top,#020817_0%,rgba(2,8,23,0.9)_12%,rgba(2,8,23,0)_35%)] theme-light:hidden"></div>

            {/* Blue Effect */}
            <div className="absolute inset-0 bg-blue-900/10"></div>
          </div>
        </div>

        {/* ================= FEATURES ================= */}
        {heroCards.length > 0 ? (
          <div>
            <div className="border border-border rounded-2xl overflow-hidden bg-surface backdrop-blur-sm">
              <div
                className={`grid divide-y sm:divide-y-0 sm:divide-x divide-border ${getHeroGridClass(heroCards.length)}`}
              >
                {heroCards.map((feature) => (
                  <div
                    key={feature.id}
                    className="flex items-center gap-4 px-4 sm:px-6 py-4"
                  >
                    <div className="flex-shrink-0">
                      <div
                        className="
                          w-14 h-14 sm:w-16 sm:h-16
                          rounded-full
                          border border-primary/40
                          flex items-center justify-center
                        "
                      >
                        <WidgetCardIcon icon={feature.icon} />
                      </div>
                    </div>

                    <div>
                      {feature.count ? (
                        <h2 className="text-lg sm:text-xl font-bold text-foreground leading-none mb-1">
                          {feature.count}
                        </h2>
                      ) : null}

                      <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-foreground mb-1">
                        {feature.title}
                      </h3>

                      <p className="text-xs sm:text-sm text-muted leading-5">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : null}

      </div>
    </section>
  );
}
