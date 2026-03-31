import Link from "next/link";
import { notFound } from "next/navigation";

import { SectionHeading } from "@/components/section-heading";
import { getDjRosterEntries, getEventBySlug, getTags } from "@/lib/data";
import { getEventLineupDjs } from "@/lib/dj-roster";

export const dynamic = "force-dynamic";

type EventDetailPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function EventDetailPage({
  params,
}: EventDetailPageProps) {
  const { slug } = await params;
  const [event, djRoster, tags] = await Promise.all([
    getEventBySlug(slug),
    getDjRosterEntries(),
    getTags(),
  ]);

  if (!event) {
    notFound();
  }

  const approvedRoster = getEventLineupDjs(event, djRoster);
  const eventTags = tags.filter((tag) => event.tagIds.includes(tag.id));

  return (
    <div className="mx-auto w-full max-w-[1240px] px-4 md:px-6">
      <section className="py-10 md:py-12">
        <span className="text-xs uppercase tracking-[0.24em] text-[#E31F29]">
          {event.locationName}
        </span>
        <h1 className="mt-2 text-[clamp(1.9rem,4vw,2.8rem)] font-semibold leading-none tracking-[-0.04em] text-[#f7f3ee]">
          {event.title}
        </h1>
        <p className="mt-3 max-w-[42rem] text-base leading-7 text-white/76">
          {event.description}
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          {event.applicationsOpen ? (
            <Link
              href={`/prenota?event=${event.slug}`}
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-[#E31F29] bg-[#E31F29] px-5 py-3 text-sm font-medium text-white transition hover:border-[#c91922] hover:bg-[#c91922]"
            >
              Prenota il tuo set
            </Link>
          ) : null}
          <Link
            href="/eventi"
            className="inline-flex min-h-11 items-center justify-center rounded-xl border border-[#E31F29]/35 px-5 py-3 text-sm font-medium text-[#f7f3ee] transition hover:bg-[#E31F29]/10"
          >
            Torna al calendario
          </Link>
        </div>
      </section>

      <section className="pb-8 md:pb-10">
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1.05fr)_400px]">
          <div className="order-2 rounded-2xl border border-[#E31F29]/18 bg-white/[0.03] p-5 lg:order-1">
            <span className="text-xs uppercase tracking-[0.24em] text-[#E31F29]">
              Dettagli evento
            </span>
            <div className="mt-4 grid gap-3">
              <div className="rounded-xl border border-[#E31F29]/14 bg-white/[0.03] p-4">
                <h3 className="mb-2 text-base font-semibold text-[#f7f3ee]">
                  Quando
                </h3>
                <p className="text-sm leading-7 text-white/74">
                  {new Date(event.date).toLocaleDateString("it-IT")} /{" "}
                  {event.time}
                </p>
              </div>
              <div className="rounded-xl border border-[#E31F29]/14 bg-white/[0.03] p-4">
                <h3 className="mb-2 text-base font-semibold text-[#f7f3ee]">
                  Dove
                </h3>
                <p className="text-sm leading-7 text-white/74">
                  {event.locationName}
                </p>
                <a
                  href={buildGoogleMapsDirectionsLink(event.locationAddress)}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm leading-7 text-white/55 underline decoration-[#E31F29]/55 underline-offset-4 transition hover:text-white/78"
                >
                  {event.locationAddress}
                </a>
              </div>

              {event.lineupPublished ? (
                <div className="rounded-xl border border-[#E31F29]/14 bg-white/[0.03] p-4">
                  <h3 className="mb-2 text-base font-semibold text-[#f7f3ee]">
                    Line Up
                  </h3>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {approvedRoster.length ? (
                      approvedRoster.map((record) => (
                        <span
                          key={record.id}
                          className="inline-flex rounded-md bg-emerald-500/15 px-3 py-1.5 text-xs uppercase tracking-[0.12em] text-emerald-300"
                        >
                          {record.name}
                        </span>
                      ))
                    ) : (
                      <span className="text-sm text-white/50">
                        Nessun DJ ancora approvato per questo evento.
                      </span>
                    )}
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          <div className="order-1 grid gap-4 lg:order-2">
            <div className="overflow-hidden rounded-2xl border border-[#E31F29]/18 bg-white/[0.03]">
              <img
                src={event.coverImage}
                alt={event.coverAlt}
                className="w-full object-cover"
              />
            </div>
            <div className="rounded-2xl border border-[#E31F29]/18 bg-white/[0.03] p-5">
              <span className="text-xs uppercase tracking-[0.24em] text-[#E31F29]">
                Tag evento
              </span>
              <div className="mt-4 flex flex-wrap gap-2">
                {eventTags.length ? (
                  eventTags.map((tag) => (
                    <span
                      className="inline-flex rounded-[0.45rem] border border-[#E31F29]/60 bg-[#E31F29]/16 px-3 py-1.5 text-[0.78rem] uppercase tracking-[0.08em] text-white"
                      key={tag.id}
                    >
                      {tag.label}
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-white/50">
                    Nessun tag associato.
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function buildGoogleMapsDirectionsLink(address: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
}
