"use client";

import { useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    grecaptcha?: {
      ready: (callback: () => void) => void;
      render: (
        container: HTMLElement,
        parameters: Record<string, unknown>,
      ) => number;
      execute: (widgetId?: number) => void;
      reset: (widgetId?: number) => void;
    };
    __opendecksRecaptchaScriptPromise?: Promise<void>;
  }
}

const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || "";

function loadRecaptchaScript() {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Window non disponibile."));
  }

  if (window.grecaptcha) {
    return Promise.resolve();
  }

  if (window.__opendecksRecaptchaScriptPromise) {
    return window.__opendecksRecaptchaScriptPromise;
  }

  window.__opendecksRecaptchaScriptPromise = new Promise<void>(
    (resolve, reject) => {
      const existingScript = document.querySelector<HTMLScriptElement>(
        'script[src^="https://www.google.com/recaptcha/api.js"]',
      );

      if (existingScript) {
        existingScript.addEventListener("load", () => resolve(), { once: true });
        existingScript.addEventListener(
          "error",
          () => reject(new Error("Script reCAPTCHA non caricato.")),
          { once: true },
        );
        return;
      }

      const script = document.createElement("script");
      script.src = "https://www.google.com/recaptcha/api.js?render=explicit";
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error("Script reCAPTCHA non caricato."));
      document.head.appendChild(script);
    },
  );

  return window.__opendecksRecaptchaScriptPromise;
}

export function useInvisibleRecaptcha() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const widgetIdRef = useRef<number | null>(null);
  const resolverRef = useRef<{
    resolve: (token: string) => void;
    reject: (error: Error) => void;
  } | null>(null);
  const [isReady, setIsReady] = useState(!siteKey && process.env.NODE_ENV !== "production");

  useEffect(() => {
    if (!siteKey) {
      return;
    }

    let active = true;

    void loadRecaptchaScript()
      .then(() => {
        if (!active || !containerRef.current || !window.grecaptcha) {
          return;
        }

        window.grecaptcha.ready(() => {
          if (!active || !containerRef.current || !window.grecaptcha) {
            return;
          }

          if (widgetIdRef.current !== null) {
            setIsReady(true);
            return;
          }

          widgetIdRef.current = window.grecaptcha.render(containerRef.current, {
            sitekey: siteKey,
            size: "invisible",
            badge: "bottomright",
            callback: (token: string) => {
              resolverRef.current?.resolve(token);
              resolverRef.current = null;
            },
            "expired-callback": () => {
              resolverRef.current?.reject(
                new Error("Verifica reCAPTCHA scaduta. Riprova."),
              );
              resolverRef.current = null;
              if (widgetIdRef.current !== null) {
                window.grecaptcha?.reset(widgetIdRef.current);
              }
            },
            "error-callback": () => {
              resolverRef.current?.reject(
                new Error("reCAPTCHA non disponibile. Riprova."),
              );
              resolverRef.current = null;
              if (widgetIdRef.current !== null) {
                window.grecaptcha?.reset(widgetIdRef.current);
              }
            },
          });

          setIsReady(true);
        });
      })
      .catch(() => {
        if (active) {
          setIsReady(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  async function executeRecaptcha() {
    if (!siteKey) {
      if (process.env.NODE_ENV !== "production") {
        return "";
      }

      throw new Error("Configura NEXT_PUBLIC_RECAPTCHA_SITE_KEY per il form.");
    }

    if (!window.grecaptcha || widgetIdRef.current === null) {
      throw new Error("reCAPTCHA non ancora pronto. Riprova.");
    }

    if (resolverRef.current) {
      throw new Error("Verifica reCAPTCHA già in corso.");
    }

    return new Promise<string>((resolve, reject) => {
      resolverRef.current = { resolve, reject };
      window.grecaptcha?.reset(widgetIdRef.current ?? undefined);
      window.grecaptcha?.execute(widgetIdRef.current ?? undefined);
    });
  }

  return {
    recaptchaContainerRef: containerRef,
    executeRecaptcha,
    isRecaptchaReady: isReady,
  };
}
