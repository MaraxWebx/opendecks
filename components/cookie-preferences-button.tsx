"use client";

import * as CookieConsent from "vanilla-cookieconsent";

export function CookiePreferencesButton() {
  return (
    <button
      type="button"
      onClick={() => CookieConsent.showPreferences()}
      className="w-fit text-left text-sm text-white/66 underline decoration-[#E31F29]/55 underline-offset-4 transition hover:text-white"
    >
      Preferenze cookie
    </button>
  );
}
