import Link from "next/link";
import Image from "next/image";
import { ChevronRight } from "lucide-react";
import { ROUTES } from "@/lib/routes";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface PageHeroProps {
  title: string;
  description: string;
  breadcrumbs?: BreadcrumbItem[];
  image?: string;
  imageAlt?: string;
}

export default function PageHero({
  title,
  description,
  breadcrumbs = [{ label: "Home", href: ROUTES.home }],
  image,
  imageAlt = title,
}: PageHeroProps) {
  return (
    <div className="relative mb-5 overflow-hidden rounded-2xl border border-border bg-surface">
      <div className="grid grid-cols-1 lg:grid-cols-[50%_50%]">
        <div className="z-10 p-6 lg:p-5">
          <nav className="mb-3 flex flex-wrap items-center gap-2 text-sm text-muted">
            {breadcrumbs.map((item, index) => (
              <span key={item.label} className="flex items-center gap-2">
                {index > 0 && <ChevronRight size={15} />}
                {item.href ? (
                  <Link href={item.href} className="transition hover:text-primary">
                    {item.label}
                  </Link>
                ) : (
                  <span className="text-foreground">{item.label}</span>
                )}
              </span>
            ))}
          </nav>

          <h1 className="mb-3 text-2xl font-bold text-foreground sm:text-4xl">{title}</h1>
          <div className="mb-3 h-1 w-14 rounded-full bg-primary" />
          <p className="max-w-xl text-sm leading-6 text-muted sm:text-base">
            {description}
          </p>
        </div>

        <div className="relative h-[240px] min-h-[170px] sm:h-[300px] lg:h-full">
          {image ? (
            <>
              <Image src={image} alt={imageAlt} fill className="object-cover" priority />
              <div className="absolute inset-0 bg-black/40 theme-light:bg-black/20" />
            </>
          ) : (
            <>
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-surface-elevated theme-light:from-primary/10 theme-light:to-surface-elevated" />
              <div className="absolute inset-0 bg-[linear-gradient(to_right,var(--surface)_0%,rgba(7,18,36,0.95)_10%,rgba(7,18,36,0.7)_20%,transparent_45%)] theme-light:hidden" />
            </>
          )}
          <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(2,8,23,0.4)_0%,transparent_20%,transparent_80%,rgba(2,8,23,0.4)_100%)] theme-light:opacity-30" />
        </div>
      </div>
    </div>
  );
}
