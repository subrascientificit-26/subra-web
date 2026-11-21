import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import ThemedToaster from "@/components/ThemedToaster";
import ThemeProvider from "@/components/ThemeProvider";
import CartProvider from "@/components/CartProvider";
import EnquirySelectionProvider from "@/components/EnquirySelectionProvider";
import WishlistProvider from "@/components/WishlistProvider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Subra Catalogue - Specialty Chemicals & Lab Equipment",
  description:
    "Your trusted partner for high-quality specialty chemicals, laboratory reagents, instruments and lab consumables.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} theme-dark h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var s=localStorage.getItem("site-theme-preference");var m=s==="light"||s==="dark"?s:"dark";document.documentElement.classList.remove("theme-dark","theme-light");document.documentElement.classList.add(m==="light"?"theme-light":"theme-dark");document.documentElement.style.colorScheme=m;}catch(e){document.documentElement.classList.add("theme-dark");document.documentElement.style.colorScheme="dark";}})();`,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <ThemeProvider>
          <CartProvider>
            <EnquirySelectionProvider>
              <WishlistProvider>{children}</WishlistProvider>
            </EnquirySelectionProvider>
          </CartProvider>
        </ThemeProvider>

        <ThemedToaster />
      </body>
    </html>
  );
}