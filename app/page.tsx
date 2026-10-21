import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
// import Features from "@/components/Features";
import ProductCategories from "@/components/ProductCategories";
import Services from "@/components/Services";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden bg-background text-foreground">

      <div className="w-full">
        <Navbar />
      </div>

      <div className="w-full">
        <Hero />
      </div>

      <div className="w-full">
        <ProductCategories />
      </div>

      <div className="w-full">
        <Services />
      </div>

      <div className="w-full">
        <Footer />
      </div>

    </div>
  );
}