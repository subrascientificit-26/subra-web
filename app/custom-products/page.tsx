import Navbar from "@/components/Navbar";
import CustomProductsHero from "@/components/CustomProductsHero";
import CustomizationProcess from "@/components/CustomizationProcess";
import CustomProductForm from "@/components/CustomProductForm";
import CustomProductFeatures from "@/components/CustomProductFeatures";
import Footer from "@/components/Footer";

export const metadata = {
  title: "Custom Products | Patient Catalogue",
  description:
    "Get tailored solutions for your unique chemical requirements. Custom manufacturing services with quality assurance and timely delivery.",
};

export default function CustomProductsPage() {
  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden bg-background text-foreground">
      <Navbar />

      <CustomProductsHero />
      <CustomizationProcess />
      <CustomProductForm />
      <CustomProductFeatures />

      <Footer />
    </div>
  );
}
