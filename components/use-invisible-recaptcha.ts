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
const RECAPTCHA_TIMEOUT_MS = 20_000;

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
        existingScript.addEventListener("load", () => resolve(), {
          once: true,
        });
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
      script.onerror = () =>
        reject(new Error("Script reCAPTCHA non caricato."));
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
  const timeoutRef = useRef<number | null>(null);
  const [isReady, setIsReady] = useState(
    !siteKey && process.env.NODE_ENV !== "production",
  );

  function clearPendingExecution(error?: Error) {
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    if (error) {
      resolverRef.current?.reject(error);
    }

    resolverRef.current = null;

    if (widgetIdRef.current !== null) {
      window.grecaptcha?.reset(widgetIdRef.current);
    }
  }

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
              const resolver = resolverRef.current;
              clearPendingExecution();
              resolver?.resolve(token);
            },
            "expired-callback": () => {
              clearPendingExecution(
                new Error("Verifica reCAPTCHA scaduta. Riprova."),
              );
            },
            "error-callback": () => {
              clearPendingExecution(
                new Error("reCAPTCHA non disponibile. Riprova."),
              );
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
      clearPendingExecution();
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
      clearPendingExecution();
    }

    return new Promise<string>((resolve, reject) => {
      resolverRef.current = { resolve, reject };
      timeoutRef.current = window.setTimeout(() => {
        clearPendingExecution(
          new Error("Verifica reCAPTCHA non completata. Riprova."),
        );
      }, RECAPTCHA_TIMEOUT_MS);
      window.grecaptcha?.reset(widgetIdRef.current ?? undefined);
      window.grecaptcha?.execute(widgetIdRef.current ?? undefined);
    });
  }

  function resetRecaptcha() {
    clearPendingExecution();
  }

  return {
    recaptchaContainerRef: containerRef,
    executeRecaptcha,
    isRecaptchaReady: isReady,
    resetRecaptcha,
  };
}
