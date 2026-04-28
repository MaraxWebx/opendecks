import type { Metadata } from "next";
import Link from "next/link";

import { membershipHomeCopy } from "@/content/membership-copy";
import { brandClaim, homeCopy } from "@/content/site-copy";
import { HomeEventsCarousel } from "@/components/home-events-carousel";
import { HomeHeroVideo } from "@/components/home-hero-video";
import { getArchiveEntries, getEvents, getUpcomingEvent } from "@/lib/data";
import { buildMetadata } from "@/lib/seo";
import { ArchiveRecord } from "@/lib/types";

export const metadata: Metadata = buildMetadata({
  title: homeCopy.seoTitle,
  description: homeCopy.seoDescription,
  path: "/",
});

export default async function HomePage() {
  const [nextEvent, events, archive] = await Promise.all([
    getUpcomingEvent(),
    getEvents(),
    getArchiveEntries(),
  ]);
  const homeShots = pickRandomArchiveShots(archive, 4);

  return (
    <div className="overflow-x-hidden bg-[#050505] text-[#f7f3ee]">
      <section className="pb-5">
        <div className="relative w-full overflow-hidden bg-[#101010]">
          <HomeHeroVideo
            className="h-[82vh] min-h-[32rem] w-full object-cover brightness-[0.38] contrast-105 saturate-[0.82]"
            src="/video/OpendecksVideo.webm"
          />
          <div className="absolute inset-0 grid place-items-center px-6 text-center">
            <div className="grid justify-items-center gap-5">
              <span className="text-sm uppercase tracking-[0.32em] text-[#E31F29]">
                {brandClaim.compact}
              </span>
              <h1 className="text-[clamp(2.8rem,8vw,5.6rem)] font-semibold uppercase leading-none tracking-[-0.06em] text-[#f7f2e8]">
                {homeCopy.title}
              </h1>
              <p className="max-w-3xl text-sm leading-7 text-white/76 md:text-base">
                {homeCopy.description}
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                <Link
                  href="/eventi"
                  className="inline-flex min-h-12 w-full max-w-[20rem] items-center justify-center rounded-lg border border-[#E31F29] bg-[#E31F29] px-6 py-3 text-sm font-semibold uppercase tracking-[0.08em] text-white transition hover:border-[#c91922] hover:bg-[#c91922] sm:w-auto sm:min-w-72"
                >
                  {homeCopy.primaryCta}
                </Link>
                <Link
                  href="/progetto"
                  className="inline-flex min-h-12 w-full max-w-[20rem] items-center justify-center rounded-lg border border-[#E31F29]/35 px-6 py-3 text-sm font-semibold uppercase tracking-[0.08em] text-white transition hover:bg-[#E31F29]/10 sm:w-auto sm:min-w-72"
                >
                  {homeCopy.secondaryCta}
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
              className="relative block min-h-[16rem] w-full max-w-full overflow-hidden rounded-xl bg-[#111] md:h-[26rem] md:w-fit"
            >
              <img
                src={nextEvent.coverImage}
                alt={nextEvent.coverAlt}
                className="block h-full w-full max-w-full bg-[#111] object-contain"
              />
              <div className="absolute left-4 top-4 inline-flex rounded-md border border-[#E31F29] bg-[#E31F29]/90 px-3 py-2 text-[0.72rem] uppercase tracking-[0.12em] text-white">
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
                {nextEvent.description}
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
                    {nextEvent.locationName}
                  </strong>
                </div>
                <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-start gap-4 border-b border-[#E31F29]/15 py-3">
                  <span className="text-xs uppercase tracking-[0.12em] text-white/50">
                    Orario
                  </span>
                  <strong className="break-words text-right text-white">
                    {nextEvent.time}
                  </strong>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-3">
                <Link
                  href={`/eventi/${nextEvent.slug}`}
                  className="inline-flex min-h-11 flex-1 items-center justify-center rounded-lg border border-[#E31F29] bg-[#E31F29] px-5 py-3 text-sm font-medium text-white transition hover:border-[#c91922] hover:bg-[#c91922] sm:flex-none"
                >
                  Scheda evento
                </Link>
                <Link
                  href={`/prenota?event=${nextEvent.slug}`}
                  className="inline-flex min-h-11 flex-1 items-center justify-center rounded-lg border border-[#E31F29]/35 px-5 py-3 text-sm font-medium text-[#f3efe5] transition hover:bg-[#E31F29]/10 sm:flex-none"
                >
                  Candidati ora
                </Link>
              </div>
            </div>
          </div>
        </section>
      ) : null}

      <section className="px-4 py-4 md:px-6">
        <div className="mx-auto grid min-w-0 max-w-[1240px] gap-5">
          <div className="grid gap-4 p-4 md:grid-cols-[minmax(0,1fr)_minmax(0,520px)] md:items-center md:gap-8 md:p-6">
            <div className="order-2 grid gap-4 md:order-1">
              <span className="text-xs uppercase tracking-[0.24em] text-[#E31F29]">
                Ultima sessione
              </span>
              <h2 className="text-[clamp(1.5rem,2.8vw,2.3rem)] font-semibold leading-none tracking-[-0.04em] text-[#f7f2e8]">
                {homeCopy.latestSetTitle}
              </h2>
              <p className="max-w-2xl text-sm leading-7 text-white/72 md:text-base">
                {homeCopy.latestSetDescription}
              </p>
              <div className="flex flex-wrap gap-3">
                <a
                  href="https://soundcloud.com/open-decks-107831124?utm_source=clipboard&utm_medium=text&utm_campaign=social_sharing"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-[#E31F29] bg-[#E31F29] px-5 py-3 text-sm font-medium text-white transition hover:border-[#c91922] hover:bg-[#c91922]"
                >
                  <SoundCloudIcon />
                  Ascolta su SoundCloud
                </a>
              </div>
            </div>

            <div className="order-1 overflow-hidden rounded-xl bg-[#111] md:order-2">
              <div className="flex flex-col gap-3 w-full">
                <iframe
                  width="100%"
                  height="166"
                  scrolling="no"
                  frameBorder="no"
                  allow="autoplay"
                  src="https://w.soundcloud.com/player/?url=https://soundcloud.com/open-decks-107831124"
                  className="rounded-lg"
                ></iframe>
              </div>
              {/*  <img
                src="/img/home/home-session-art.svg"
                alt="OpenDecks session visual"
                className="aspect-[4/3] w-full object-cover"
              /> */}
            </div>
          </div>

          <div className="grid gap-4 p-4 md:grid-cols-[minmax(0,520px)_minmax(0,1fr)] md:items-center md:gap-8 md:p-6">
            <ShotsStack items={homeShots} />

            <div className="grid gap-4">
              <span className="text-xs uppercase tracking-[0.24em] text-[#E31F29]">
                Ultimi scatti
              </span>
              <h2 className="text-[clamp(1.5rem,2.8vw,2.3rem)] font-semibold leading-none tracking-[-0.04em] text-[#f7f2e8]">
                {homeCopy.latestShotsTitle}
              </h2>
              <p className="max-w-2xl text-sm leading-7 text-white/72 md:text-base">
                {homeCopy.latestShotsDescription}
              </p>
              <div className="flex flex-wrap gap-3">
                <a
                  href="https://t.me/opendecksitalia?utm_source=ig&utm_medium=social&utm_content=link_in_bio&fbclid=PAZXh0bgNhZW0CMTEAc3J0YwZhcHBfaWQMMjU2MjgxMDQwNTU4AAGnpj7YXBWihu6z5LbMl71a-JWR8ghi42oUKWpR9Nc3u-WHwwuaRgo_yUVLaFM_aem_aX73IYbUVPrT6RnEeVirAA"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-[#E31F29] bg-[#E31F29] px-5 py-3 text-sm font-medium text-white transition hover:border-[#c91922] hover:bg-[#c91922]"
                >
                  <TelegramIcon />
                  Apri Telegram
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-6 md:px-6 md:py-8">
        <div className="mx-auto grid max-w-[1240px] gap-6 border-y border-[#E31F29]/18 py-8 md:grid-cols-[minmax(0,1fr)_minmax(280px,420px)] md:items-center md:gap-10">
          <div className="grid gap-4">
            <span className="text-xs uppercase tracking-[0.24em] text-[#E31F29]">
              {membershipHomeCopy.eyebrow}
            </span>
            <h2 className="max-w-2xl text-[clamp(1.5rem,3vw,2.5rem)] font-semibold leading-none tracking-[-0.04em] text-[#f7f2e8]">
              {membershipHomeCopy.title}
            </h2>
            <p className="max-w-2xl text-sm leading-7 text-white/72 md:text-base">
              {membershipHomeCopy.description}
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/progetto#membership-card"
                className="inline-flex min-h-11 items-center justify-center rounded-lg border border-[#E31F29] bg-[#E31F29] px-5 py-3 text-sm font-medium text-white transition hover:border-[#c91922] hover:bg-[#c91922]"
              >
                {membershipHomeCopy.cta}
              </Link>
            </div>
          </div>

          <MembershipCardPreview />
        </div>
      </section>
      <section className="px-4 py-4 pb-12 md:px-6">
        <div className="mx-auto min-w-0 max-w-[1240px]">
          <HomeEventsCarousel events={events.slice(0, 6)} />
        </div>
      </section>
    </div>
  );
}

function MembershipCardPreview() {
  return (
    <div className="relative mx-auto aspect-[1.58/1] w-full max-w-[420px] overflow-hidden rounded-xl border border-[#E31F29]/35 bg-[#0d0d0d] p-5 shadow-[0_24px_70px_rgba(0,0,0,0.34)]">
      <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(227,31,41,0.28),transparent_42%),radial-gradient(circle_at_88%_16%,rgba(255,255,255,0.13),transparent_24%)]" />
      <div className="relative flex h-full flex-col justify-between">
        <div className="flex items-start justify-between gap-4">
          <div>
            <span className="text-[0.66rem] uppercase tracking-[0.26em] text-[#ff7e86]">
              Open Decks Italia
            </span>
            <h3 className="mt-3 text-2xl font-semibold uppercase leading-none tracking-[-0.04em] text-[#f7f2e8]">
              Membership Card
            </h3>
          </div>
          <span className="rounded-md border border-white/14 bg-white/8 px-2.5 py-1 text-[0.66rem] uppercase tracking-[0.18em] text-white/78">
            Digital
          </span>
        </div>

        <div className="grid gap-3">
          <div className="h-px bg-[#E31F29]/45" />
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-[0.68rem] uppercase tracking-[0.2em] text-white/50">
                Community access
              </p>
              <p className="mt-1 text-sm font-medium text-white/88">
                Slot / eventi / showcase
              </p>
            </div>
            <p className="text-right text-[0.68rem] uppercase tracking-[0.18em] text-white/52">
              OD-2026
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function ShotsStack({ items }: { items: ArchiveRecord[] }) {
  const offsets = [
    "left-0 top-0 rotate-[-8deg]",
    "left-5 top-2 rotate-[-3deg]",
    "left-10 top-4 rotate-[4deg]",
    "left-14 top-7 rotate-[8deg]",
  ];

  return (
    <div className="relative mx-auto aspect-[4/3] w-full max-w-[540px]">
      {items.map((item, index) => (
        <div
          key={item.id}
          className={`absolute h-[88%] w-[74%] overflow-hidden rounded-xl bg-[#111] shadow-[0_18px_50px_rgba(0,0,0,0.28)] ${offsets[index] || offsets[offsets.length - 1]}`}
        >
          {item.mediaType === "video" ? (
            <video
              src={item.mediaUrl}
              poster={item.thumbnailUrl}
              className="h-full w-full object-cover"
              autoPlay
              loop
              muted
              playsInline
            />
          ) : (
            <img
              src={item.thumbnailUrl || item.mediaUrl}
              alt={item.alt || item.title || `OpenDecks shot ${index + 1}`}
              className="h-full w-full object-cover"
            />
          )}
        </div>
      ))}
    </div>
  );
}

function pickRandomArchiveShots(items: ArchiveRecord[], count: number) {
  return [...items]
    .sort(() => Math.random() - 0.5)
    .slice(0, count);
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
