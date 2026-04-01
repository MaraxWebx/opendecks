import type { Metadata } from "next";

import { bookingPageCopy } from "@/content/site-copy";
import { ApplicationForm } from "@/components/application-form";
import { getEvents } from "@/lib/data";
import { buildMetadata } from "@/lib/seo";

type BookingPageProps = {
  searchParams: Promise<{ event?: string }>;
};

export const metadata: Metadata = buildMetadata({
  title: bookingPageCopy.seoTitle,
  description: bookingPageCopy.seoDescription,
  path: "/prenota",
});

export default async function BookingPage({ searchParams }: BookingPageProps) {
  const [{ event: eventSlug }, events] = await Promise.all([
    searchParams,
    getEvents(),
  ]);
  const openEvents = events.filter((item) => item.applicationsOpen);

  return (
    <div className="mx-auto w-full max-w-[1240px] px-4 md:px-6">
      <section className="py-16 md:py-20">
        <span className="text-xs uppercase tracking-[0.24em] text-[#E31F29]">
          {bookingPageCopy.eyebrow}
        </span>
        <h1 className="mt-3 text-[clamp(1.9rem,4vw,3.1rem)] font-semibold leading-none tracking-[-0.03em] text-[#f7f3ee]">
          {bookingPageCopy.title}
        </h1>
        <p className="mt-4 max-w-[42rem] text-lg leading-8 text-white/76">
          {bookingPageCopy.description}
        </p>
      </section>

      <section className="pb-14 md:pb-16">
        <ApplicationForm events={openEvents} initialSlug={eventSlug} />
      </section>
    </div>
  );
}
