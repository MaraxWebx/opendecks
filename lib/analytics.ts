"use client";

type AnalyticsParams = Record<string, string | number | boolean | undefined>;
type AnalyticsIdentifiers = {
  analytics_client_id?: string;
  analytics_session_id?: string;
  analytics_session_number?: number;
};

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

const measurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

function getGtagValue<T extends string | number>(
  fieldName: "client_id" | "session_id" | "session_number",
) {
  if (
    typeof window === "undefined" ||
    typeof window.gtag !== "function" ||
    !measurementId
  ) {
    return Promise.resolve<T | undefined>(undefined);
  }

  return new Promise<T | undefined>((resolve) => {
    window.gtag?.("get", measurementId, fieldName, (value: T | undefined) => {
      resolve(value);
    });
  });
}

async function getAnalyticsIdentifiers(): Promise<AnalyticsIdentifiers> {
  const [clientId, sessionId, sessionNumber] = await Promise.all([
    getGtagValue<string>("client_id"),
    getGtagValue<string>("session_id"),
    getGtagValue<number>("session_number"),
  ]);

  return {
    analytics_client_id: clientId,
    analytics_session_id: sessionId,
    analytics_session_number: sessionNumber,
  };
}

export function trackAnalyticsEvent(
  eventName: string,
  params: AnalyticsParams = {},
) {
  if (typeof window === "undefined" || typeof window.gtag !== "function") {
    return;
  }

  void getAnalyticsIdentifiers()
    .then((identifiers) => {
      window.gtag?.("event", eventName, {
        ...params,
        ...identifiers,
      });
    })
    .catch(() => {
      window.gtag?.("event", eventName, params);
    });
}
