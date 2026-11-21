"use client";

import { useSiteSettings } from '@/lib/hooks/useSiteSettings';
import { PAGE_CONTAINER_CLASS } from '@/lib/layout';
import WidgetCardIcon from '@/components/WidgetCardIcon';

function getServiceGridClass(count: number) {
  if (count <= 1) return "grid-cols-1";
  if (count === 2) return "grid-cols-1 sm:grid-cols-2";
  if (count === 3) return "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3";
  if (count === 4) return "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4";
  return "grid-cols-1 sm:grid-cols-2 lg:grid-cols-5";
}

export default function Services() {
  const { settings } = useSiteSettings();
  const serviceCards = settings.serviceCards;

  if (serviceCards.length === 0) {
    return null;
  }

  return (
    <section className="bg-background text-foreground border-t border-b border-border py-4">
      <div className={PAGE_CONTAINER_CLASS}>
        <div
          className={`grid gap-px bg-border overflow-hidden rounded-xl border border-border ${getServiceGridClass(serviceCards.length)}`}
        >
          {serviceCards.map((service) => (
            <div
              key={service.id}
              className="flex items-start gap-4 bg-background px-4 py-4"
            >
              <div className="flex-shrink-0">
                <div className="h-12 w-12 sm:h-14 sm:w-14 flex items-center justify-center rounded-full border border-primary/60">
                  <WidgetCardIcon
                    icon={service.icon}
                    size={25}
                    className="text-primary"
                  />
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-sm sm:text-[15px] mb-1">
                  {service.title}
                </h3>

                <p className="text-xs sm:text-[13px] text-muted leading-5">
                  {service.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
