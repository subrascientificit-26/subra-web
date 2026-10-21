import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PrivacyPolicyContent from "@/components/PrivacyPolicyContent";

export const metadata = {
  title: "Privacy Policy - Patient Catalogue",
  description:
    "Learn how we collect, use, and protect your personal information when using our product catalogue and enquiry services.",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground overflow-hidden">
      <Navbar />
      <PrivacyPolicyContent />
      <Footer />
    </div>
  );
}
