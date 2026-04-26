"use client";

import Script from "next/script";
import { useEffect, useState } from "react";
import * as CookieConsent from "vanilla-cookieconsent";

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
    [key: string]: unknown;
  }
}

const measurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
const isProduction = process.env.NODE_ENV === "production";

export function GoogleAnalyticsManager() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if (!isProduction || !measurementId) {
      return;
    }

    const syncConsent = () => {
      const hasAnalyticsConsent = CookieConsent.acceptedCategory("analytics");
      window[`ga-disable-${measurementId}`] = !hasAnalyticsConsent;
      setEnabled(hasAnalyticsConsent);
    };

    syncConsent();

    const handleConsentChange = () => {
      syncConsent();
    };

    window.addEventListener(
      "opendecks-cookie-consent-change",
      handleConsentChange,
    );

    return () => {
      window.removeEventListener(
        "opendecks-cookie-consent-change",
        handleConsentChange,
      );
    };
  }, []);

  if (!isProduction || !measurementId || !enabled) {
    return null;
  }

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          window.gtag = gtag;
          gtag('js', new Date());
          gtag('config', '${measurementId}', {
            anonymize_ip: true
          });
        `}
      </Script>
    </>
  );
}
