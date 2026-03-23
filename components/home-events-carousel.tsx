"use client";

import { useRef } from "react";
import Link from "next/link";

import { EventRecord } from "@/lib/types";

type HomeEventsCarouselProps = {
  events: EventRecord[];
};

export function HomeEventsCarousel({ events }: HomeEventsCarouselProps) {
  const trackRef = useRef<HTMLDivElement | null>(null);

  function scrollByAmount(direction: "prev" | "next") {
    const track = trackRef.current;

    if (!track) {
      return;
    }

    const amount = track.clientWidth * 0.82;
    track.scrollBy({
      left: direction === "next" ? amount : -amount,
      behavior: "smooth"
    });
  }

  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between gap-4">
        <span className="text-xs uppercase tracking-[0.24em] text-[#E31F29]">Eventi</span>
        <div className="flex gap-2">
          <button
            type="button"
            className="inline-flex min-h-11 min-w-20 items-center justify-center border border-[#E31F29]/35 px-4 py-3 text-sm text-white transition hover:bg-[#E31F29]/14"
            onClick={() => scrollByAmount("prev")}
          >
            Indietro
          </button>
          <button
            type="button"
            className="inline-flex min-h-11 min-w-20 items-center justify-center border border-[#E31F29]/35 px-4 py-3 text-sm text-white transition hover:bg-[#E31F29]/14"
            onClick={() => scrollByAmount("next")}
          >
            Avanti
          </button>
        </div>
      </div>

      <div
        className="grid auto-cols-[minmax(19rem,28rem)] grid-flow-col gap-3 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        ref={trackRef}
      >
        {events.map((event) => (
          <Link
            key={event.id}
            href={`/eventi/${event.slug}`}
            className="group relative min-h-[22rem] overflow-hidden rounded-2xl bg-[#111] md:min-h-[29rem]"
          >
            <img
              className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
              src={event.coverImage}
              alt={event.coverAlt}
            />
            <div className="absolute inset-x-0 bottom-0 grid gap-2 bg-gradient-to-t from-black/80 to-transparent p-5">
              <span className="text-xs uppercase tracking-[0.18em] text-white/72">
                {event.venue}, {event.city}
              </span>
              <h3 className="text-2xl font-semibold tracking-[-0.03em] text-white">
                {event.title}
              </h3>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
