"use client";

import { PageHero } from "@/components/ui";
import InfoSection from "@/components/InfoSection";
import { ROUTES } from "@/lib/routes";
import { PAGE_CONTAINER_CLASS } from "@/lib/layout";
import { useSiteSettings } from "@/lib/hooks/useSiteSettings";

export default function PrivacyPolicyContent() {
  const { settings } = useSiteSettings();
  const siteTitle = settings.siteName;
  const lastUpdated = "June 27, 2026";

  return (
    <div className="flex-grow">
      <div className={`${PAGE_CONTAINER_CLASS} py-4`}>
        <PageHero
          title="Privacy Policy"
          description={`How ${siteTitle || "we"} collect, use, and protect your personal information when you use our product catalogue and enquiry services.`}
          breadcrumbs={[
            { label: "Home", href: ROUTES.home },
            { label: "Privacy Policy" },
          ]}
        />

        <p className="text-sm text-muted mb-6">Last updated: {lastUpdated}</p>

        <div className="space-y-6">
          <InfoSection title="Introduction">
            <p>
              {siteTitle || "We"} respect your privacy and are committed to protecting the
              personal information you share with us. This Privacy Policy explains what data
              we collect, how we use it, and the choices you have regarding your information
              when you visit our website, browse our product catalogue, create an account, or
              submit an enquiry.
            </p>
          </InfoSection>

          <InfoSection title="Information We Collect">
            <p>We may collect the following types of information:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong className="text-foreground">Account information</strong> — name,
                email address, phone number, organisation, and password when you register.
              </li>
              <li>
                <strong className="text-foreground">Enquiry details</strong> — product
                names, quantities, specifications, and any message you include in an enquiry
                form.
              </li>
              <li>
                <strong className="text-foreground">Usage data</strong> — pages visited,
                search queries, browser type, device information, and IP address collected
                automatically through cookies and similar technologies.
              </li>
              <li>
                <strong className="text-foreground">Communications</strong> — records of
                correspondence when you contact our support team.
              </li>
            </ul>
          </InfoSection>

          <InfoSection title="How We Use Your Information">
            <p>We use the information we collect to:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Provide access to our product catalogue and account features.</li>
              <li>Process and respond to your product enquiries and quotations.</li>
              <li>Send order updates, enquiry confirmations, and service-related emails.</li>
              <li>Improve our website, product listings, and customer experience.</li>
              <li>Comply with legal obligations and protect against fraud or misuse.</li>
            </ul>
          </InfoSection>

          <InfoSection title="Sharing of Information">
            <p>
              We do not sell your personal information. We may share data with trusted
              service providers who assist us in operating the website, sending emails, or
              processing enquiries — subject to confidentiality agreements. We may also
              disclose information when required by law or to protect our rights and the
              safety of our users.
            </p>
          </InfoSection>

          <InfoSection title="Cookies">
            <p>
              Our website uses cookies and similar technologies to remember your
              preferences, keep you signed in, and analyse site traffic. You can control
              cookies through your browser settings, though disabling them may affect
              certain features such as login and theme preferences.
            </p>
          </InfoSection>

          <InfoSection title="Data Security">
            <p>
              We implement appropriate technical and organisational measures to safeguard
              your personal information against unauthorised access, alteration, or
              disclosure. However, no method of transmission over the internet is completely
              secure, and we cannot guarantee absolute security.
            </p>
          </InfoSection>

          <InfoSection title="Data Retention">
            <p>
              We retain your personal information for as long as your account is active or
              as needed to fulfil the purposes described in this policy, including
              satisfying legal, accounting, or reporting requirements. Enquiry records may be
              kept to maintain a history of your interactions with us.
            </p>
          </InfoSection>

          <InfoSection title="Your Rights">
            <p>
              Depending on applicable law, you may have the right to access, correct, or
              delete your personal data, withdraw consent, or object to certain processing.
              To exercise these rights, please contact us using the details below.
            </p>
          </InfoSection>

          <InfoSection title="Contact Us">
            <p>
              If you have questions about this Privacy Policy or how we handle your data,
              please reach out to us:
            </p>
            <ul className="list-none space-y-1 mt-2">
              <li>
                <strong className="text-foreground">Email:</strong>{" "}
                {settings.contactEmail || "—"}
              </li>
              <li>
                <strong className="text-foreground">Phone:</strong>{" "}
                {settings.contactPhone || "—"}
              </li>
              <li>
                <strong className="text-foreground">Address:</strong>{" "}
                <span className="whitespace-pre-line">
                  {settings.companyAddress || "—"}
                </span>
              </li>
            </ul>
          </InfoSection>
        </div>
      </div>
    </div>
  );
}
