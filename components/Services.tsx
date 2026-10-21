"use client";

import { useSiteSettings } from '@/lib/hooks/useSiteSettings';
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
      <div className="max-w-[98%] mx-auto px-2 sm:px-3 lg:px-4">
        <div
          className={`grid divide-y sm:divide-y-0 lg:divide-x divide-border ${getServiceGridClass(serviceCards.length)}`}
        >
          {serviceCards.map((service) => (
            <div
              key={service.id}
              className="flex items-start gap-5 px-4 py-4"
            >
              <div className="flex-shrink-0">
                <div className="w-15 h-15 flex items-center justify-center rounded-full border border-primary/60">
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
