import Link from "next/link";
import { notFound } from "next/navigation";

import { SectionHeading } from "@/components/section-heading";
import { getDjRosterEntries, getEventBySlug, getTags } from "@/lib/data";

export const dynamic = "force-dynamic";

type EventDetailPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function EventDetailPage({ params }: EventDetailPageProps) {
  const { slug } = await params;
  const [event, djRoster, tags] = await Promise.all([
    getEventBySlug(slug),
    getDjRosterEntries(),
    getTags()
  ]);

  if (!event) {
    notFound();
  }

  const approvedRoster = djRoster.filter((record) => record.eventId === event.id);
  const eventTags = tags.filter((tag) => event.tagIds.includes(tag.id));

  return (
    <div className="mx-auto w-full max-w-[1240px] px-4 md:px-6">
      <section className="py-16 md:py-20">
        <span className="text-xs uppercase tracking-[0.24em] text-[#E31F29]">{event.city}</span>
        <h1 className="mt-3 text-[clamp(1.9rem,4vw,3.1rem)] font-semibold leading-none tracking-[-0.03em] text-[#f7f3ee]">
          {event.title}
        </h1>
        <p className="mt-4 max-w-[42rem] text-lg leading-8 text-white/76">{event.description}</p>
        <div className="mt-6 flex flex-wrap gap-3">
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

      <section className="pb-10 md:pb-12">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-[#E31F29]/18 bg-white/[0.03] p-6">
            <span className="text-xs uppercase tracking-[0.24em] text-[#E31F29]">Dettagli evento</span>
            <div className="mt-4 grid gap-4">
              <div className="rounded-xl border border-[#E31F29]/14 bg-white/[0.03] p-5">
                <h3 className="mb-2 text-lg font-semibold text-[#f7f3ee]">Quando</h3>
                <p className="text-sm leading-7 text-white/74">
                  {new Date(event.date).toLocaleDateString("it-IT")} / {event.time}
                </p>
              </div>
              <div className="rounded-xl border border-[#E31F29]/14 bg-white/[0.03] p-5">
                <h3 className="mb-2 text-lg font-semibold text-[#f7f3ee]">Dove</h3>
                <p className="text-sm leading-7 text-white/74">
                  {event.venue}, {event.city}
                </p>
              </div>
              <div className="rounded-xl border border-[#E31F29]/14 bg-white/[0.03] p-5">
                <h3 className="mb-2 text-lg font-semibold text-[#f7f3ee]">Capienza</h3>
                <p className="text-sm leading-7 text-white/74">{event.capacity} persone</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-[#E31F29]/18 bg-white/[0.03] p-6">
            <span className="text-xs uppercase tracking-[0.24em] text-[#E31F29]">
              Tag evento
            </span>
            <div className="my-4 flex flex-wrap gap-2">
              {eventTags.map((tag) => (
                <span
                  className="inline-flex rounded-[0.45rem] border border-[#E31F29]/60 bg-[#E31F29]/16 px-3 py-1.5 text-[0.78rem] uppercase tracking-[0.08em] text-white"
                  key={tag.id}
                >
                  {tag.label}
                </span>
              ))}
            </div>
            <p className="text-base leading-8 text-white/74">
              Questa scheda evento e gia pronta per essere arricchita con visual ufficiali,
              partner, mappa, timetable e contenuti editoriali dedicati.
            </p>
          </div>
        </div>
      </section>

      <section className="pb-14 md:pb-16">
        <SectionHeading
          eyebrow="Call"
          title="Candidature collegate all'evento"
          description="Il form della piattaforma puo gia agganciare le candidature alla singola data, cosi l'admin vede subito il contesto corretto."
        />
        <div className="rounded-2xl border border-[#E31F29]/18 bg-white/[0.03] p-6 text-sm leading-7 text-white/74">
          <p>
            Stato candidature:{" "}
            <strong className="text-white">{event.applicationsOpen ? "aperte" : "chiuse"}</strong>.
            In questa base UI il collegamento avviene tramite evento selezionato nel form e API
            dedicata.
          </p>

          <div className="mt-5">
            <span className="text-xs uppercase tracking-[0.24em] text-[#E31F29]">
              DJ approvati
            </span>
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
        </div>
      </section>
    </div>
  );
}
