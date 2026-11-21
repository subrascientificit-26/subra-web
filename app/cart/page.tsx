import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CartClient from "@/components/CartClient";
import Link from "next/link";
import { Home } from "lucide-react";
import { ROUTES } from "@/lib/routes";
import { PAGE_CONTAINER_CLASS } from "@/lib/layout";

export const metadata = {
  title: "Cart - Subra Catalogue",
  description: "Review the products you've added and request an enquiry.",
};

export default function CartPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navbar />

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

            <span className="text-primary">Cart</span>
          </div>

          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight mb-2 text-foreground">
              Your Cart
            </h1>

            <p className="text-muted text-sm sm:text-base md:text-lg max-w-2xl">
              Review the products you&apos;ve added and send us an enquiry.
            </p>
          </div>

          <CartClient />
        </div>
      </main>

      <Footer />
    </div>
  );
}
