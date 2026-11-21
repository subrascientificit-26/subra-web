'use client';

import {
  Headphones,
  BadgeCheck,
  ShieldCheck,
  Globe,
} from 'lucide-react';
import { PAGE_CONTAINER_CLASS } from '@/lib/layout';

export default function CustomProductFeatures() {
  const features = [
    {
      title: 'Expert Support',
      description:
        'Our team of experts will assist you at every step',
      icon: Headphones,
    },
    {
      title: 'High Quality Standards',
      description:
        'All products manufactured as per international quality standards',
      icon: BadgeCheck,
    },
    {
      title: 'Confidentiality Assured',
      description:
        'Your requirements are 100% confidential',
      icon: ShieldCheck,
    },
    {
      title: 'Timely Delivery',
      description:
        'We ensure on-time delivery across the globe',
      icon: Globe,
    },
  ];

  return (
    <div className="w-full bg-background text-foreground py-2">

      <div className={PAGE_CONTAINER_CLASS}>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-6">

          {features.map((feature, index) => {
            const Icon = feature.icon;

            return (
              <div
                key={index}
                className="flex items-start gap-4 rounded-xl border border-border bg-surface p-5 transition-all duration-300 hover:border-primary"
              >

                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-primary/30 bg-primary/10">

                  <Icon className="h-5 w-5 text-primary" />

                </div>

                <div>

                  <h3 className="mb-1 text-base font-semibold text-foreground">
                    {feature.title}
                  </h3>

                  <p className="text-sm leading-6 text-muted">
                    {feature.description}
                  </p>

                </div>

              </div>
            );
          })}

        </div>

      </div>

    </div>
  );
}
