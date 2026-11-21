import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import EnquiryForm from "@/components/EnquiryForm";
import GetInTouch from "@/components/GetInTouch";
import Link from "next/link";
import { Home } from "lucide-react";
import { ROUTES } from "@/lib/routes";
import { PAGE_CONTAINER_CLASS } from "@/lib/layout";

export const metadata = {
  title: "Enquiry - Subra Catalogue",
  description:
    "Send us your enquiries and requirements. Our team will get back to you shortly.",
};

export default function EnquiryPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground overflow-x-clip">
      <Navbar />

      <div className="fixed inset-0 -z-10 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.12),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.08),transparent_30%)] theme-light:opacity-60" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px] theme-light:opacity-30" />
      </div>

      <main className="flex-grow py-6 sm:py-8">
        <div className={PAGE_CONTAINER_CLASS}>
          <div className="flex items-center gap-2 text-sm mb-6 text-muted">
            <Link
              href={ROUTES.home}
              className="flex items-center gap-1 hover:text-primary transition"
            >
              <Home size={14} />
              Home
            </Link>

            <span className="text-border">›</span>

            <span className="text-primary">Enquiry</span>
          </div>

          <div className="mb-5 flex flex-col">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight mb-2 text-foreground">
              Enquiry
            </h1>

            <p className="text-muted text-sm sm:text-base md:text-lg max-w-2xl">
              Send us your requirements and our team will get back to you
              shortly.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
            <div className="lg:col-span-2 min-w-0">
              <div className="rounded-2xl border border-border bg-surface p-4 sm:p-6 md:p-8 shadow-lg theme-light:shadow-md">
                <EnquiryForm />
              </div>
            </div>

            <aside className="flex flex-col space-y-6 lg:sticky lg:top-[calc(var(--site-header-height)+1rem)] lg:max-h-[calc(100vh-var(--site-header-height)-1rem)] lg:self-start lg:overflow-y-auto">
              <GetInTouch />
            </aside>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
