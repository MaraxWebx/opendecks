import type { Metadata } from "next";

import { eventsPageCopy } from "@/content/site-copy";
import { EventCard } from "@/components/event-card";
import { getEvents, getTags } from "@/lib/data";
import { buildMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildMetadata({
  title: eventsPageCopy.seoTitle,
  description: eventsPageCopy.seoDescription,
  path: "/eventi",
});

export default async function EventsPage() {
  const [events, tags] = await Promise.all([getEvents(), getTags()]);

  return (
    <div className="mx-auto w-full max-w-[1240px] px-4 md:px-6">
      <section className="py-16 md:py-20">
        <span className="text-xs uppercase tracking-[0.24em] text-[#E31F29]">
          {eventsPageCopy.eyebrow}
        </span>
        <h1 className="mt-3 text-[clamp(1.9rem,4vw,3.1rem)] font-semibold leading-none tracking-[-0.03em] text-[#f7f3ee]">
          {eventsPageCopy.title}
        </h1>
        <p className="mt-4 max-w-[42rem] text-lg leading-8 text-white/76">
          {eventsPageCopy.description}
        </p>
      </section>

      <section className="pb-14 md:pb-16">
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {events.map((event) => (
            <EventCard key={event.id} event={event} tags={tags} />
          ))}
        </div>
      </section>
    </div>
  );
}
