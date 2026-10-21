'use client';

import Link from 'next/link';
import { ROUTES } from '@/lib/routes';
import { useEffect, useState } from 'react';
import {
  ArrowRight,
  Phone,
  Mail,
  Clock3,
  MapPin,
  MessageSquareText,
} from 'lucide-react';
import { useSiteSettings } from '@/lib/hooks/useSiteSettings';

interface Enquiry {
  id: string;
  title: string;
  date: string;
  status: string;
  icon?: string;
}

export default function GetInTouch() {
  const { settings } = useSiteSettings();
  const [recentEnquiries, setRecentEnquiries] = useState<Enquiry[]>([]);
  const [loading, setLoading] = useState(true);

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'Completed':
        return 'bg-green-500/10 text-green-600 theme-dark:text-green-400';
      case 'In Progress':
        return 'bg-blue-500/10 text-blue-600 theme-dark:text-blue-400';
      case 'Responded':
        return 'bg-purple-500/10 text-purple-600 theme-dark:text-purple-400';
      default:
        return 'bg-surface-elevated text-muted';
    }
  };

  useEffect(() => {
    const fetchEnquiries = async () => {
      try {
        const res = await fetch('/api/enquiry?limit=3');

        if (!res.ok) {
          setRecentEnquiries([]);
          return;
        }

        const data = await res.json();
        setRecentEnquiries(Array.isArray(data) ? data : []);
      } catch {
        setRecentEnquiries([]);
      } finally {
        setLoading(false);
      }
    };

    fetchEnquiries();
  }, []);

  return (
    <div className="space-y-4">
      <div className="relative overflow-hidden rounded-2xl border border-border bg-surface shadow-lg theme-light:shadow-md">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(37,99,235,0.08),transparent_35%)]" />

        <div className="relative p-5">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-full border border-primary/30 bg-primary/10">
              <Phone size={18} className="text-primary" />
            </div>

            <div>
              <h2 className="text-xl font-semibold text-foreground">
                Get in Touch
              </h2>
              <p className="mt-1 text-sm text-muted">
                Our team is ready to assist you with any product enquiries.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between gap-6">
            <div className="flex-1 space-y-5">
              <div className="flex gap-3">
                <Phone size={16} className="mt-1 text-muted" />
                <div>
                  <p className="text-sm font-medium text-foreground">Phone</p>
                  <p className="mt-1 text-sm text-muted">
                    {settings.contactPhone || "—"}
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <Mail size={16} className="mt-1 text-muted" />
                <div>
                  <p className="text-sm font-medium text-foreground">Email</p>
                  <p className="mt-1 text-sm text-muted">
                    {settings.contactEmail || "—"}
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <Clock3 size={18} className="mt-1 text-muted" />
                <div>
                  <p className="text-sm font-medium text-foreground">Business Hours</p>
                  <p className="mt-1 text-sm text-muted">
                    Mon - Sat : 9:00 AM - 6:00 PM
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <MapPin size={18} className="mt-1 text-muted" />
                <div>
                  <p className="text-sm font-medium text-foreground">Address</p>
                  <p className="mt-1 text-sm leading-6 text-muted whitespace-pre-line">
                    {settings.companyAddress || "—"}
                  </p>
                </div>
              </div>
            </div>

            <div className="relative hidden lg:flex items-center justify-center min-w-[220px]">
              <div className="absolute h-40 w-40 rounded-full bg-primary/10 blur-3xl" />
              <img
                src="/Lab-test.jpg"
                alt="Contact"
                className="relative z-10 h-[230px] w-[210px] rounded-2xl object-cover border border-border"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-surface p-5 shadow-lg theme-light:shadow-md">
        <div className="mb-4 flex items-center justify-between">
          {/* <h2 className="text-base font-semibold text-foreground">
            Recent Enquiries
          </h2> */}

          <Link
            href={ROUTES.enquiry}
            className="flex items-center gap-1 text-sm text-primary hover:text-primary-hover transition"
          >
            View All
            <ArrowRight size={13} />
          </Link>
        </div>

        {loading ? (
          <p className="text-sm text-muted">Loading...</p>
        ) : recentEnquiries.length === 0 ? (
          <p className="text-sm text-muted">No enquiries found</p>
        ) : (
          <div className="space-y-2.5">
            {recentEnquiries.map((enquiry) => (
              <div
                key={enquiry.id}
                className="rounded-xl border border-border bg-surface-elevated px-4 py-3 transition hover:border-primary/40"
              >
                <div className="flex gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full border border-primary/20 bg-primary/10">
                    <MessageSquareText size={18} className="text-primary" />
                  </div>

                  <div className="flex-1">
                    <div className="mb-1 flex items-start justify-between gap-2">
                      <div>
                        <h4 className="text-sm font-semibold text-foreground">
                          {enquiry.id}
                        </h4>
                        <p className="mt-1 text-sm text-muted">{enquiry.title}</p>
                      </div>

                      <span
                        className={`rounded-full px-2.5 py-1 text-[10px] font-medium whitespace-nowrap ${getStatusStyle(
                          enquiry.status
                        )}`}
                      >
                        {enquiry.status}
                      </span>
                    </div>

                    <p className="mt-2 text-xs text-muted">{enquiry.date}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
