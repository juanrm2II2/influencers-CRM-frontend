import type { Metadata } from "next";
import "./globals.css";
import Providers from "@/components/Providers";
import CookieConsent from "@/components/CookieConsent";

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: "Influencer CRM",
  description: "Manage your influencer partnerships",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased bg-gray-50 text-gray-900">
        <Providers>{children}</Providers>
        <CookieConsent />
      </body>
    </html>
  );
}
