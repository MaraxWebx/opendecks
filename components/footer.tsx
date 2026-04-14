import Image from "next/image";
import Link from "next/link";

import { getEvents } from "@/lib/data";

export async function Footer() {
  const events = await getEvents();
  const latestEvents = [...events]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 4);

  return (
    <footer className="border-t border-[#E31F29]/25 bg-black">
      <div className="mx-auto grid w-full max-w-[1240px] gap-10 px-4 py-10 md:grid-cols-[1.2fr_0.9fr_0.9fr] md:px-6">
        <div className="grid content-start gap-4">
          <Link href="/" className="inline-flex items-center">
            <Image
              src="/img/loghi/LOGO-OPEN-DECKS_bianco.png"
              alt="OpenDecks Italia"
              width={260}
              height={68}
              className="h-16 w-auto object-contain"
            />
          </Link>
          <p className="max-w-sm text-sm leading-7 text-white/70">
            La scena non si aspetta. Si costruisce.
            <br />
            Porta la tua musica.
          </p>
          <Link
            href="/admin/login"
            className="inline-flex w-fit items-center rounded-md border border-[#E31F29]/35 bg-[#E31F29]/10 px-3 py-2 text-white transition hover:bg-[#E31F29]/16"
          >
            Admin access
          </Link>
        </div>

        <div className="grid content-start gap-4">
          <span className="text-xs uppercase tracking-[0.24em] text-[#E31F29]">
            Contatti
          </span>
          <div className="grid gap-3 text-sm text-white/80">
            <a
              className="transition hover:text-white"
              href="mailto:info@opendecks.it"
            >
              info@opendecks.it
            </a>
            <a className="transition hover:text-white" href="tel:+393343461942">
              +39 334 346 1942
            </a>
          </div>
          <div className="flex flex-wrap gap-3">
            <a
              href="https://www.instagram.com/opendecks.italia/"
              target="_blank"
              rel="noreferrer"
              aria-label="Instagram OpenDecks Italia"
              className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-[#E31F29]/35 text-white transition hover:bg-[#E31F29]/10"
            >
              <InstagramIcon />
            </a>
            <a
              href="https://t.me/opendecksitalia?utm_source=ig&utm_medium=social&utm_content=link_in_bio&fbclid=PAZXh0bgNhZW0CMTEAc3J0YwZhcHBfaWQMMjU2MjgxMDQwNTU4AAGnpj7YXBWihu6z5LbMl71a-JWR8ghi42oUKWpR9Nc3u-WHwwuaRgo_yUVLaFM_aem_aX73IYbUVPrT6RnEeVirAA"
              target="_blank"
              rel="noreferrer"
              aria-label="Telegram OpenDecks Italia"
              className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-[#E31F29]/35 text-white transition hover:bg-[#E31F29]/10"
            >
              <TelegramIcon />
            </a>
            <a
              href="https://soundcloud.com/open-decks-107831124?utm_source=clipboard&utm_medium=text&utm_campaign=social_sharing"
              target="_blank"
              rel="noreferrer"
              aria-label="SoundCloud OpenDecks Italia"
              className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-[#E31F29]/35 text-white transition hover:bg-[#E31F29]/10"
            >
              <SoundCloudIcon />
            </a>
          </div>
          <Link
            href="/privacy-policy"
            className="w-fit text-sm text-white/66 underline decoration-[#E31F29]/55 underline-offset-4 transition hover:text-white"
          >
            Privacy Policy
          </Link>
        </div>

        <div className="grid content-start gap-4">
          <span className="text-xs uppercase tracking-[0.24em] text-[#E31F29]">
            Ultimi eventi
          </span>
          <div className="grid gap-3 text-sm text-white/80">
            {latestEvents.map((event) => (
              <Link
                key={event.id}
                href={`/eventi/${event.slug}`}
                className="transition hover:text-white"
              >
                {event.title}
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-[1240px] flex-col items-start justify-between gap-3 border-t border-[#E31F29]/20 px-4 py-5 text-sm text-white/55 md:flex-row md:items-center md:px-6">
        <p>Copyright © 2026 OpenDecks Italia.</p>
        <Link
          href="https://www.instagram.com/marettax_/"
          className="transition hover:text-white/80"
          target="_blank"
        >
          ❤️ ☠️ 🧠by Marettax
        </Link>
      </div>
    </footer>
  );
}

function InstagramIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <rect
        x="3.75"
        y="3.75"
        width="16.5"
        height="16.5"
        rx="4.5"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <circle cx="12" cy="12" r="3.6" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="17.3" cy="6.7" r="1.05" fill="currentColor" />
    </svg>
  );
}

function TelegramIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M21.07 4.93a1.6 1.6 0 0 0-1.64-.22L3.72 11.1a1.3 1.3 0 0 0 .1 2.44l4.02 1.42 1.45 4.64a1.28 1.28 0 0 0 2.17.54l2.25-2.31 4.42 3.24a1.61 1.61 0 0 0 2.54-.93l2.3-13.55a1.59 1.59 0 0 0-.9-1.66ZM10.28 18.2l-.97-3.12 7.92-6.96a.38.38 0 0 0-.5-.57l-9.55 5.86-2.34-.83 14.5-5.9-1.96 11.58-3.99-2.93a1.27 1.27 0 0 0-1.64.12l-1.47 1.5Z" />
    </svg>
  );
}

function SoundCloudIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M10.88 8.83a5.28 5.28 0 0 1 7.92 4.58h.7a3.5 3.5 0 1 1 0 7H4.62a.62.62 0 0 1-.62-.62V10.1c0-.34.28-.62.62-.62s.62.28.62.62v9.06h.9V8.66c0-.34.28-.62.62-.62s.62.28.62.62v10.5h.9V7.87c0-.34.28-.62.62-.62s.62.28.62.62v11.29h.9V8.83Zm9.42 10.33a2.25 2.25 0 0 0-.8-4.35h-1.93v-1.4a4.03 4.03 0 0 0-6.04-3.49v9.24h8.77Z" />
    </svg>
  );
}
