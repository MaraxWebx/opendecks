"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

import { EventRecord } from "@/lib/types";

type HomeEventsCarouselProps = {
  events: EventRecord[];
};

export function HomeEventsCarousel({ events }: HomeEventsCarouselProps) {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(events.length > 0);

  function updateScrollState() {
    const track = trackRef.current;

    if (!track) {
      return;
    }

    const maxScrollLeft = track.scrollWidth - track.clientWidth;
    setCanScrollPrev(track.scrollLeft > 8);
    setCanScrollNext(track.scrollLeft < maxScrollLeft - 8);
  }

  useEffect(() => {
    updateScrollState();

    const track = trackRef.current;

    if (!track) {
      return;
    }

    track.addEventListener("scroll", updateScrollState, { passive: true });
    window.addEventListener("resize", updateScrollState);

    return () => {
      track.removeEventListener("scroll", updateScrollState);
      window.removeEventListener("resize", updateScrollState);
    };
  }, [events.length]);

  function scrollByAmount(direction: "prev" | "next") {
    const track = trackRef.current;

    if (!track) {
      return;
    }

    const firstCard = track.firstElementChild as HTMLElement | null;
    const gap = Number.parseFloat(
      window.getComputedStyle(track).columnGap || "12",
    );
    const cardWidth = firstCard?.clientWidth || track.clientWidth;
    const cardsPerView =
      window.innerWidth >= 1024 ? 3 : window.innerWidth >= 768 ? 2 : 1;
    const amount = cardWidth * cardsPerView + gap * (cardsPerView - 1);

    track.scrollBy({
      left: direction === "next" ? amount : -amount,
      behavior: "smooth",
    });
  }

  return (
    <div className="grid min-w-0 gap-4 overflow-x-hidden">
      <div className="flex items-center justify-between gap-4">
        <span className="text-xs uppercase tracking-[0.24em] text-[#E31F29]">
          Eventi
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-[#E31F29]/35 text-white transition hover:bg-[#E31F29]/14 disabled:cursor-not-allowed disabled:border-white/10 disabled:text-white/25 disabled:hover:bg-transparent"
            onClick={() => scrollByAmount("prev")}
            disabled={!canScrollPrev}
            aria-label="Evento precedente"
          >
            <span aria-hidden="true" className="text-lg leading-none">
              &larr;
            </span>
          </button>
          <button
            type="button"
            className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-[#E31F29]/35 text-white transition hover:bg-[#E31F29]/14 disabled:cursor-not-allowed disabled:border-white/10 disabled:text-white/25 disabled:hover:bg-transparent"
            onClick={() => scrollByAmount("next")}
            disabled={!canScrollNext}
            aria-label="Evento successivo"
          >
            <span aria-hidden="true" className="text-lg leading-none">
              &rarr;
            </span>
          </button>
        </div>
      </div>

      <div
        className="grid w-full auto-cols-[88%] grid-flow-col gap-3 overflow-x-auto pb-2 [scrollbar-width:none] md:auto-cols-[calc((100%-0.75rem)/2)] lg:auto-cols-[calc((100%-1.5rem)/3)] [&::-webkit-scrollbar]:hidden"
        ref={trackRef}
      >
        {events.map((event) => (
          <Link
            key={event.id}
            href={`/eventi/${event.slug}`}
            className="group relative aspect-[4/5] overflow-hidden rounded-2xl bg-[#111] md:h-[24rem] md:aspect-auto lg:h-[22rem]"
          >
            <img
              className="h-full w-full bg-[#111] object-cover transition duration-300 group-hover:scale-[1.01] md:object-contain"
              src={event.coverImage}
              alt={event.coverAlt}
            />
            {/*    <div className="absolute inset-x-0 bottom-0 grid gap-2 bg-gradient-to-t from-black/80 to-transparent p-5">
              <span className="text-xs uppercase tracking-[0.18em] text-white/72">
                {event.venue}, {event.city}
              </span>
              <h3 className="text-2xl font-semibold tracking-[-0.03em] text-white">
                {event.title}
              </h3>
            </div> */}
          </Link>
        ))}
      </div>
    </div>
  );
}
