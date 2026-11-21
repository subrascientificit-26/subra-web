import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import HelpSupportContent from "@/components/HelpSupportContent";

export const metadata = {
  title: "Help & Support - Subra Catalogue",
  description:
    "Get help with product enquiries, account questions, and find answers to frequently asked questions.",
};

export default function HelpSupportPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground overflow-x-hidden">
      <Navbar />
      <HelpSupportContent />
      <Footer />
    </div>
  );
}
