import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AboutUsContent from "@/components/AboutUsContent";

export const metadata = {
  title: "About Us - Subra Catalogue",
  description:
    "Learn about our company, mission, and commitment to supplying quality laboratory products and specialty chemicals.",
};

export default function AboutUsPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground overflow-hidden">
      <Navbar />
      <AboutUsContent />
      <Footer />
    </div>
  );
}
