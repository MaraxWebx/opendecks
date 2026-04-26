import type { Metadata, Viewport } from "next";
import { Space_Grotesk } from "next/font/google";
import "vanilla-cookieconsent/dist/cookieconsent.css";

import { CookieConsentManager } from "@/components/cookie-consent-manager";
import { Footer } from "@/components/footer";
import { GoogleAnalyticsManager } from "@/components/google-analytics-manager";
import { Header } from "@/components/header";
import { buildMetadata } from "@/lib/seo";

import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  display: "swap"
});

export const metadata: Metadata = buildMetadata({
  path: "/",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#050505"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="it">
      <body className={spaceGrotesk.className} suppressHydrationWarning>
        <div className="flex min-h-screen flex-col overflow-x-hidden">
          <Header />
          <main>{children}</main>
          <Footer />
        </div>
        <GoogleAnalyticsManager />
        <CookieConsentManager />
      </body>
    </html>
  );
}
