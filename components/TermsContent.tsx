"use client";

import Link from "next/link";
import { PageHero } from "@/components/ui";
import InfoSection from "@/components/InfoSection";
import { ROUTES } from "@/lib/routes";
import { PAGE_CONTAINER_CLASS } from "@/lib/layout";
import { useSiteSettings } from "@/lib/hooks/useSiteSettings";

export default function TermsContent() {
  const { settings } = useSiteSettings();
  const siteTitle = settings.siteName;
  const lastUpdated = "June 27, 2026";

  return (
    <div className="flex-grow">
      <div className={`${PAGE_CONTAINER_CLASS} py-4`}>
        <PageHero
          title="Terms & Conditions"
          description={`Please read these terms carefully before using ${siteTitle || "our"} product catalogue, enquiry services, or website.`}
          breadcrumbs={[
            { label: "Home", href: ROUTES.home },
            { label: "Terms & Conditions" },
          ]}
        />

        <p className="text-sm text-muted mb-6">Last updated: {lastUpdated}</p>

        <div className="space-y-6">
          <InfoSection title="Acceptance of Terms">
            <p>
              By accessing or using this website, creating an account, or submitting an
              enquiry, you agree to be bound by these Terms & Conditions. If you do not
              agree, please do not use our services. We may update these terms from time to
              time; continued use of the site after changes constitutes acceptance of the
              revised terms.
            </p>
          </InfoSection>

          <InfoSection title="Use of the Website">
            <p>You agree to use this website only for lawful purposes. You must not:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Attempt to gain unauthorised access to any part of the site or its systems.</li>
              <li>Use automated tools to scrape, copy, or harvest product data without permission.</li>
              <li>Submit false, misleading, or fraudulent enquiry information.</li>
              <li>Interfere with the proper functioning or security of the website.</li>
            </ul>
          </InfoSection>

          <InfoSection title="Product Information">
            <p>
              Product descriptions, specifications, CAS numbers, molecular formulas, images,
              and pricing displayed on this catalogue are provided for informational purposes.
              While we strive for accuracy, we do not warrant that all information is complete,
              current, or error-free. Product availability, pack sizes, and prices are subject
              to change without notice. Final specifications and pricing will be confirmed at
              the time of quotation or order.
            </p>
          </InfoSection>

          <InfoSection title="Enquiries & Quotations">
            <p>
              Submitting an enquiry through our website does not constitute a binding order or
              contract. All enquiries are subject to review and confirmation by our team.
              Quotations, if provided, are valid for the period stated in the quotation and
              are subject to product availability and applicable regulations.
            </p>
            <p>
              You can submit enquiries via our{" "}
              <Link href={ROUTES.enquiry} className="text-primary hover:underline">
                Enquiry page
              </Link>
              .
            </p>
          </InfoSection>

          <InfoSection title="Account Registration">
            <p>
              When you create an account, you are responsible for maintaining the
              confidentiality of your login credentials and for all activity under your
              account. You agree to provide accurate registration information and to notify
              us promptly of any unauthorised use of your account.
            </p>
          </InfoSection>

          <InfoSection title="Intellectual Property">
            <p>
              All content on this website — including text, graphics, logos, product
              descriptions, and software — is the property of {siteTitle || "the company"}{" "}
              or its licensors and is protected by applicable intellectual property laws. You
              may not reproduce, distribute, or create derivative works without our prior
              written consent.
            </p>
          </InfoSection>

          <InfoSection title="Limitation of Liability">
            <p>
              To the fullest extent permitted by law, {siteTitle || "we"} shall not be
              liable for any indirect, incidental, special, or consequential damages arising
              from your use of this website or reliance on product information. Our total
              liability for any claim related to the website shall not exceed the amount you
              paid us, if any, in the twelve months preceding the claim.
            </p>
          </InfoSection>

          <InfoSection title="Governing Law">
            <p>
              These Terms & Conditions are governed by the laws of India. Any disputes arising
              from these terms or your use of the website shall be subject to the exclusive
              jurisdiction of the courts in the applicable region, unless otherwise required
              by mandatory law.
            </p>
          </InfoSection>

          <InfoSection title="Contact">
            <p>For questions about these Terms & Conditions, please contact us:</p>
            <ul className="list-none space-y-1 mt-2">
              <li>
                <strong className="text-foreground">Email:</strong>{" "}
                {settings.contactEmail || "—"}
              </li>
              <li>
                <strong className="text-foreground">Phone:</strong>{" "}
                {settings.contactPhone || "—"}
              </li>
            </ul>
          </InfoSection>
        </div>
      </div>
    </div>
  );
}
