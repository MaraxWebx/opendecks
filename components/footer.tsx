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
            className="inline-flex w-fit items-center rounded-[0.55rem] border border-[#E31F29]/35 bg-[#E31F29]/10 px-3 py-2 text-white transition hover:bg-[#E31F29]/16"
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
            <a
              className="transition hover:text-white"
              href="https://www.instagram.com/opendecks.italia/"
              target="_blank"
              rel="noreferrer"
            >
              Instagram
            </a>
            <span>Italia</span>
          </div>
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
        >
          by Marettax
        </Link>
      </div>
    </footer>
  );
}
