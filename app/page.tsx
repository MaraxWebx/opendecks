import Link from "next/link";

import { HomeEventsCarousel } from "@/components/home-events-carousel";
import { HomeHeroVideo } from "@/components/home-hero-video";
import { getEvents, getUpcomingEvent } from "@/lib/data";

export default async function HomePage() {
  const [nextEvent, events] = await Promise.all([
    getUpcomingEvent(),
    getEvents(),
  ]);

  return (
    <div className="overflow-x-hidden bg-[#050505] text-[#f7f3ee]">
      <section className="pb-5">
        <div className="relative w-full overflow-hidden bg-[#101010]">
          <HomeHeroVideo
            className="h-[82vh] min-h-[32rem] w-full object-cover brightness-[0.38] contrast-105 saturate-[0.82]"
            src="/video/home-banner.mp4"
          />
          <div className="absolute inset-0 grid place-items-center px-6 text-center">
            <div className="grid justify-items-center gap-5">
              <span className="text-sm uppercase tracking-[0.32em] text-[#E31F29]">
                La scena non si aspetta. Si costruisce. Porta la tua musica
              </span>
              <h1 className="text-[clamp(2.8rem,8vw,5.6rem)] font-semibold uppercase leading-none tracking-[-0.06em] text-[#f7f2e8]">
                OpenDecks Italia
              </h1>
              <div className="flex flex-wrap justify-center gap-3">
                <Link
                  href="/eventi"
                  className="inline-flex min-h-12 w-full max-w-[20rem] items-center justify-center rounded-xl border border-[#E31F29] bg-[#E31F29] px-6 py-3 text-sm font-semibold uppercase tracking-[0.08em] text-white transition hover:border-[#c91922] hover:bg-[#c91922] sm:w-auto sm:min-w-72"
                >
                  Scopri gli eventi
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {nextEvent ? (
        <section className="px-4 py-3 md:px-6 md:py-4">
          <div className="mx-auto grid max-w-[1240px] min-w-0 gap-4 md:grid-cols-[auto_minmax(0,1fr)] md:items-start">
            <Link
              href={`/eventi/${nextEvent.slug}`}
              className="relative block min-h-[16rem] w-full max-w-full overflow-hidden rounded-2xl bg-[#111] md:h-[26rem] md:w-fit"
            >
              <img
                src={nextEvent.coverImage}
                alt={nextEvent.coverAlt}
                className="block h-full w-full max-w-full bg-[#111] object-contain"
              />
              <div className="absolute left-4 top-4 inline-flex rounded-[0.55rem] border border-[#E31F29] bg-[#E31F29]/90 px-3 py-2 text-[0.72rem] uppercase tracking-[0.12em] text-white">
                Prossimo evento
              </div>
            </Link>

            <div className="min-w-0 border-t border-[#E31F29]/20 pt-4">
              <span className="text-xs uppercase tracking-[0.24em] text-[#E31F29]">
                In arrivo
              </span>
              <h2 className="mt-2 break-words text-[clamp(1.35rem,2.4vw,1.9rem)] font-semibold leading-none tracking-[-0.03em] text-[#f5f2ea]">
                {nextEvent.title}
              </h2>
              <p className="mt-3 max-w-2xl break-words text-sm leading-6 text-white/72 md:text-[0.96rem]">
                {nextEvent.excerpt}
              </p>

              <div className="mt-5 grid gap-0">
                <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-start gap-4 border-b border-[#E31F29]/15 py-3">
                  <span className="text-xs uppercase tracking-[0.12em] text-white/50">
                    Data
                  </span>
                  <strong className="break-words text-right text-white">
                    {new Date(nextEvent.date).toLocaleDateString("it-IT")}
                  </strong>
                </div>
                <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-start gap-4 border-b border-[#E31F29]/15 py-3">
                  <span className="text-xs uppercase tracking-[0.12em] text-white/50">
                    Luogo
                  </span>
                  <strong className="max-w-[11rem] break-words text-right text-white sm:max-w-none">
                    {nextEvent.venue}, {nextEvent.city}
                  </strong>
                </div>
                <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-start gap-4 border-b border-[#E31F29]/15 py-3">
                  <span className="text-xs uppercase tracking-[0.12em] text-white/50">
                    Orario
                  </span>
                  <strong className="break-words text-right text-white">{nextEvent.time}</strong>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-3">
                <Link
                  href={`/eventi/${nextEvent.slug}`}
                  className="inline-flex min-h-11 flex-1 items-center justify-center rounded-xl border border-[#E31F29] bg-[#E31F29] px-5 py-3 text-sm font-medium text-white transition hover:border-[#c91922] hover:bg-[#c91922] sm:flex-none"
                >
                  Scheda evento
                </Link>
                <Link
                  href={`/prenota?event=${nextEvent.slug}`}
                  className="inline-flex min-h-11 flex-1 items-center justify-center rounded-xl border border-[#E31F29]/35 px-5 py-3 text-sm font-medium text-[#f3efe5] transition hover:bg-[#E31F29]/10 sm:flex-none"
                >
                  Candidati ora
                </Link>
              </div>
            </div>
          </div>
        </section>
      ) : null}

      <section className="px-4 py-4 pb-12 md:px-6">
        <div className="mx-auto min-w-0 max-w-[1240px]">
          <HomeEventsCarousel events={events.slice(1, 6)} />
        </div>
      </section>
    </div>
  );
}
