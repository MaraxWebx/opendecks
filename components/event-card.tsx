import Link from "next/link";

import { EventRecord, TagRecord } from "@/lib/types";

type EventCardProps = {
  event: EventRecord;
  tags: TagRecord[];
};

export function EventCard({ event, tags }: EventCardProps) {
  const eventTags = tags.filter((tag) => event.tagIds.includes(tag.id));

  return (
    <article className="overflow-hidden rounded-2xl border border-[#E31F29]/15 bg-white/[0.03]">
      <div className="overflow-hidden bg-[#111]">
        <img
          className="aspect-[4/3] w-full object-cover transition duration-300 hover:scale-[1.02]"
          src={event.coverImage}
          alt={event.coverAlt}
        />
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
              className="inline-flex rounded-[0.45rem] border border-[#E31F29]/60 bg-[#E31F29]/16 px-3 py-1.5 text-[0.78rem] uppercase tracking-[0.08em] text-white"
            >
              {tag.label}
            </span>
          ))}
        </div>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            className="inline-flex min-h-11 items-center justify-center rounded-xl border border-[#E31F29]/35 px-4 py-3 text-sm font-medium text-[#f7f3ee] transition hover:bg-[#E31F29]/10"
            href={`/eventi/${event.slug}`}
          >
            Vedi evento
          </Link>
          {event.applicationsOpen ? (
            <Link
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-[#E31F29] bg-[#E31F29] px-4 py-3 text-sm font-medium text-white transition hover:border-[#c91922] hover:bg-[#c91922]"
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
