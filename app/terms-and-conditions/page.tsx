import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import TermsContent from "@/components/TermsContent";

export const metadata = {
  title: "Terms & Conditions - Patient Catalogue",
  description:
    "Read the terms and conditions for using our product catalogue, enquiry services, and website.",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground overflow-hidden">
      <Navbar />
      <TermsContent />
      <Footer />
    </div>
  );
}
