import Link from "next/link";

import { EventRecord, TagRecord } from "@/lib/types";

type EventCardProps = {
  event: EventRecord;
  tags: TagRecord[];
};

export function EventCard({ event, tags }: EventCardProps) {
  const eventTags = tags.filter((tag) => event.tagIds.includes(tag.id));
  const statusBadge = event.applicationsOpen
    ? {
        label: "Slot open",
        className:
          "border-emerald-300/70 bg-emerald-500 text-white shadow-[0_14px_28px_rgba(16,185,129,0.28)]",
      }
    : event.status === "past"
      ? {
          label: "Event passed",
          className:
            "border-amber-200/80 bg-amber-400 text-white shadow-[0_14px_28px_rgba(251,191,36,0.28)]",
        }
      : {
          label: "Slot closed",
          className:
            "border-red-300/75 bg-[#E31F29] text-white shadow-[0_14px_28px_rgba(227,31,41,0.28)]",
        };

  return (
    <article className="overflow-hidden rounded-xl border border-[#E31F29]/15 bg-white/[0.03]">
      <div className="relative overflow-hidden bg-[#111]">
        <img
          className="aspect-[4/3] w-full object-cover transition duration-300 hover:scale-[1.02]"
          src={event.coverImage}
          alt={event.coverAlt}
        />
        <div
          className={`absolute -right-11 top-6 z-10 inline-flex min-w-[12.5rem] rotate-[42deg] items-center justify-center border px-3 py-2 text-center text-[0.68rem] font-semibold uppercase tracking-[0.16em] ${statusBadge.className}`}
        >
          {statusBadge.label}
        </div>
      </div>
      <div className="p-5">
        <div className="mb-3 flex flex-wrap gap-2 text-sm text-white/55">
          <span>{new Date(event.date).toLocaleDateString("it-IT")}</span>
          <span>{event.locationName}</span>
        </div>
        <h3 className="mb-3 text-xl font-semibold tracking-[-0.03em] text-[#f7f3ee]">
          {event.title}
        </h3>
        <div className="mt-4 flex flex-wrap gap-2">
          {eventTags.map((tag) => (
            <span
              key={tag.id}
              className="inline-flex rounded-md border border-[#E31F29]/60 bg-[#E31F29]/16 px-3 py-1.5 text-[0.78rem] uppercase tracking-[0.08em] text-white"
            >
              {tag.label}
            </span>
          ))}
        </div>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            className="inline-flex min-h-11 items-center justify-center rounded-lg border border-[#E31F29]/35 px-4 py-3 text-sm font-medium text-[#f7f3ee] transition hover:bg-[#E31F29]/10"
            href={`/eventi/${event.slug}`}
          >
            Vedi evento
          </Link>
          {event.applicationsOpen ? (
            <Link
              className="inline-flex min-h-11 items-center justify-center rounded-lg border border-[#E31F29] bg-[#E31F29] px-4 py-3 text-sm font-medium text-white transition hover:border-[#c91922] hover:bg-[#c91922]"
              href={`/prenota?event=${event.slug}`}
            >
              Candidati
            </Link>
          ) : null}
        </div>
      </div>
    </article>
  );
}
