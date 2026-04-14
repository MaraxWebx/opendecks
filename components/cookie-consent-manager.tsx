"use client";

import { useEffect } from "react";
import * as CookieConsent from "vanilla-cookieconsent";

declare global {
  interface Window {
    __opendecksCookieConsentInitialized?: boolean;
  }
}

export function CookieConsentManager() {
  useEffect(() => {
    document.documentElement.classList.add("cc--darkmode");

    if (window.__opendecksCookieConsentInitialized) {
      return;
    }

    window.__opendecksCookieConsentInitialized = true;

    void CookieConsent.run({
      guiOptions: {
        consentModal: {
          layout: "box",
          position: "bottom right",
          equalWeightButtons: true,
          flipButtons: false,
        },
        preferencesModal: {
          layout: "box",
          equalWeightButtons: true,
          flipButtons: false,
        },
      },
      categories: {
        necessary: {
          enabled: true,
          readOnly: true,
        },
        analytics: {},
        marketing: {},
      },
      cookie: {
        name: "opendecks_cookie_consent",
        sameSite: "Lax",
        secure: true,
        expiresAfterDays: 182,
      },
      onConsent: () => {
        window.dispatchEvent(
          new CustomEvent("opendecks-cookie-consent-change", {
            detail: CookieConsent.getUserPreferences(),
          }),
        );
      },
      onChange: () => {
        window.dispatchEvent(
          new CustomEvent("opendecks-cookie-consent-change", {
            detail: CookieConsent.getUserPreferences(),
          }),
        );
      },
      language: {
        default: "it",
        translations: {
          it: {
            consentModal: {
              title: "Cookie e privacy",
              description:
                "Usiamo cookie tecnici necessari per il funzionamento del sito. Quando attiveremo analytics, reCAPTCHA o altri servizi esterni, potrai gestire qui il consenso. Leggi la <a href=\"/privacy-policy\" class=\"cc__link\">Privacy Policy</a>.",
              acceptAllBtn: "Accetta tutto",
              acceptNecessaryBtn: "Solo necessari",
              showPreferencesBtn: "Gestisci preferenze",
              footer:
                '<a href="/privacy-policy" class="cc__link">Privacy Policy</a>',
            },
            preferencesModal: {
              title: "Preferenze cookie",
              acceptAllBtn: "Accetta tutto",
              acceptNecessaryBtn: "Solo necessari",
              savePreferencesBtn: "Salva preferenze",
              closeIconLabel: "Chiudi",
              serviceCounterLabel: "Servizio|Servizi",
              sections: [
                {
                  title: "Gestione consenso",
                  description:
                    "Puoi scegliere quali categorie opzionali abilitare. I cookie tecnici necessari restano sempre attivi.",
                },
                {
                  title: "Cookie necessari",
                  description:
                    "Servono al funzionamento base del sito, della sessione e delle funzioni essenziali.",
                  linkedCategory: "necessary",
                },
                {
                  title: "Analytics",
                  description:
                    "Questa categoria verra usata quando collegheremo strumenti statistici come Google Analytics.",
                  linkedCategory: "analytics",
                },
                {
                  title: "Marketing",
                  description:
                    "Questa categoria verra usata solo se in futuro attiveremo strumenti esterni di marketing o remarketing.",
                  linkedCategory: "marketing",
                },
                {
                  title: "Maggiori informazioni",
                  description:
                    'Per dettagli completi sul trattamento dati e sui servizi collegati, leggi la <a href="/privacy-policy" class="cc__link">Privacy Policy</a>.',
                },
              ],
            },
          },
        },
      },
    });
  }, []);

  return null;
}
