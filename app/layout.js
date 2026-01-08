import "./globals.css";
import NavBar from "../components/NavBar";
import Footer from "../components/Footer";
import { Analytics } from "@vercel/analytics/react";
import GoogleAnalytics from "../components/GoogleAnalytics";

// ✅ ADD THIS (Google Font via Next.js)
import { Inter } from "next/font/google";
const inter = Inter({ subsets: ["latin"], display: "swap" });

export const metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),

  title: {
    default: "Executive Pro Cleaning",
    template: "%s | Executive Pro Cleaning",
  },

  description: "Reliable cleaning and day-to-day support across Canberra, Queanbeyan, and Royalla.",

  alternates: {
    canonical: "/",
  },

  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },

  openGraph: {
    type: "website",
    siteName: "Executive Pro Cleaning",
    title: "Executive Pro Cleaning",
    description: "Reliable cleaning and day-to-day support across Canberra, Queanbeyan, and Royalla.",
    url: "/",
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "Executive Pro Cleaning",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "Executive Pro Cleaning",
    description: "Reliable cleaning and day-to-day support across Canberra, Queanbeyan, and Royalla.",
    images: ["/og.png"],
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      {/* ✅ APPLY FONT HERE */}
      <body className={inter.className}>
        <NavBar />
        <main className="container">{children}</main>
        <Footer />
        <Analytics />
        <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID} />
      </body>
    </html>
  );
}