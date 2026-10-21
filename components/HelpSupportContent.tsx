"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ChevronDown,
  Phone,
  Mail,
  Clock3,
  MapPin,
  MessageSquareText,
  Package,
  Search,
  ArrowRight,
} from "lucide-react";
import { PageHero } from "@/components/ui";
import { ROUTES } from "@/lib/routes";
import { useSiteSettings } from "@/lib/hooks/useSiteSettings";

const FAQS = [
  {
    question: "How do I submit a product enquiry?",
    answer:
      "Browse our product catalogue, open the product you are interested in, and click the enquiry button — or visit the Enquiry page directly. Fill in your requirements and our team will respond with a quotation.",
  },
  {
    question: "How long does it take to receive a quotation?",
    answer:
      "We typically respond to enquiries within one to two business days. Complex or custom product requests may take slightly longer. You can track your enquiry status from your dashboard after logging in.",
  },
  {
    question: "Can I request a product that is not listed in the catalogue?",
    answer:
      "Yes. Use the Enquiry page to describe the product you need, including CAS number, quantity, and specifications if available. Our sourcing team will check availability and get back to you.",
  },
  {
    question: "How do I create an account?",
    answer:
      "Click Register in the navigation bar and complete the registration form with your name, email, and organisation details. Once registered, you can manage enquiries and access your dashboard.",
  },
  {
    question: "What are your business hours?",
    answer:
      "Our support team is available Monday to Saturday, 9:00 AM to 6:00 PM (IST). Enquiries submitted outside business hours will be addressed on the next working day.",
  },
  {
    question: "How can I search for a specific chemical or product?",
    answer:
      "Use the search bar at the top of the site to find products by name, CAS number, or keyword. You can also browse by application area or use the A-Z Products listing for alphabetical navigation.",
  },
];

const QUICK_LINKS = [
  {
    icon: Package,
    title: "Browse Products",
    description: "Explore our full product catalogue.",
    href: ROUTES.products,
  },
  {
    icon: MessageSquareText,
    title: "Submit Enquiry",
    description: "Request a quote or ask about a product.",
    href: ROUTES.enquiry,
  },
  {
    icon: Search,
    title: "Search Catalogue",
    description: "Find products by name, CAS, or keyword.",
    href: ROUTES.search,
  },
];

function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-xl border border-border bg-surface-elevated overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition hover:bg-surface"
        aria-expanded={open}
      >
        <span className="text-sm font-semibold text-foreground">{question}</span>
        <ChevronDown
          size={18}
          className={`shrink-0 text-muted transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <div className="border-t border-border px-5 py-4">
          <p className="text-sm leading-7 text-muted">{answer}</p>
        </div>
      )}
    </div>
  );
}

export default function HelpSupportContent() {
  const { settings } = useSiteSettings();

  return (
    <div className="flex-grow">
      <div className="max-w-[1650px] mx-auto px-3 sm:px-5 lg:px-6 py-4">
        <PageHero
          title="Help & Support"
          description="Find answers to common questions, get in touch with our team, or submit a product enquiry."
          image="/Lab-test.jpg"
          imageAlt="Help and support"
          breadcrumbs={[
            { label: "Home", href: ROUTES.home },
            { label: "Help & Support" },
          ]}
        />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          {QUICK_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="group rounded-2xl border border-border bg-surface p-5 shadow-lg theme-light:shadow-md transition hover:border-primary/40"
            >
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full border border-primary/30 bg-primary/10">
                <link.icon size={18} className="text-primary" />
              </div>
              <h3 className="text-sm font-semibold text-foreground mb-1">{link.title}</h3>
              <p className="text-xs text-muted mb-3">{link.description}</p>
              <span className="inline-flex items-center gap-1 text-xs text-primary group-hover:gap-2 transition-all">
                Go <ArrowRight size={13} />
              </span>
            </Link>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="rounded-2xl border border-border bg-surface p-6 md:p-8 shadow-lg theme-light:shadow-md">
            <h2 className="text-lg font-bold text-foreground mb-2">Contact Support</h2>
            <div className="h-1 w-10 rounded-full bg-primary mb-5" />
            <p className="text-sm text-muted leading-7 mb-5">
              Our team is ready to help with product enquiries, technical questions, and
              quotation requests.
            </p>

            <div className="space-y-4">
              <div className="flex gap-3">
                <Phone size={16} className="mt-1 text-primary shrink-0" />
                <div>
                  <p className="text-sm font-medium text-foreground">Phone</p>
                  <p className="text-sm text-muted">{settings.contactPhone || "—"}</p>
                </div>
              </div>
              <div className="flex gap-3">
                <Mail size={16} className="mt-1 text-primary shrink-0" />
                <div>
                  <p className="text-sm font-medium text-foreground">Email</p>
                  <p className="text-sm text-muted break-all">
                    {settings.contactEmail || "—"}
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <Clock3 size={16} className="mt-1 text-primary shrink-0" />
                <div>
                  <p className="text-sm font-medium text-foreground">Business Hours</p>
                  <p className="text-sm text-muted">Mon – Sat: 9:00 AM – 6:00 PM</p>
                </div>
              </div>
              <div className="flex gap-3">
                <MapPin size={16} className="mt-1 text-primary shrink-0" />
                <div>
                  <p className="text-sm font-medium text-foreground">Address</p>
                  <p className="text-sm text-muted whitespace-pre-line leading-6">
                    {settings.companyAddress || "—"}
                  </p>
                </div>
              </div>
            </div>

            <Link
              href={ROUTES.enquiry}
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition hover:opacity-90"
            >
              Submit an Enquiry
              <ArrowRight size={15} />
            </Link>
          </div>

          <div className="rounded-2xl border border-border bg-surface p-6 md:p-8 shadow-lg theme-light:shadow-md">
            <h2 className="text-lg font-bold text-foreground mb-2">
              Frequently Asked Questions
            </h2>
            <div className="h-1 w-10 rounded-full bg-primary mb-5" />
            <div className="space-y-3">
              {FAQS.map((faq) => (
                <FaqItem key={faq.question} question={faq.question} answer={faq.answer} />
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-6 text-center shadow-lg theme-light:shadow-md">
          <p className="text-sm text-muted mb-3">
            Still need help? Our support team is happy to assist you.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              href={ROUTES.enquiry}
              className="inline-flex items-center gap-2 rounded-xl border border-primary px-5 py-2.5 text-sm font-medium text-primary transition hover:bg-primary/10"
            >
              Contact Us
            </Link>
            <Link
              href={ROUTES.privacyPolicy}
              className="text-sm text-muted hover:text-primary transition"
            >
              Privacy Policy
            </Link>
            <span className="text-border">·</span>
            <Link
              href={ROUTES.termsAndConditions}
              className="text-sm text-muted hover:text-primary transition"
            >
              Terms & Conditions
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
