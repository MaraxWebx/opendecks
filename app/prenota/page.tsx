import { ApplicationForm } from "@/components/application-form";
import { SectionHeading } from "@/components/section-heading";
import { getEvents } from "@/lib/data";

type BookingPageProps = {
  searchParams: Promise<{ event?: string }>;
};

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
          Prenota il tuo set
        </span>
        <h1 className="mt-3 text-[clamp(1.9rem,4vw,3.1rem)] font-semibold leading-none tracking-[-0.03em] text-[#f7f3ee]">
          Invio candidatura
        </h1>
        <p className="mt-4 max-w-[42rem] text-lg leading-8 text-white/76">
          La candidatura raccoglie nome, citta, email, Instagram, link al set e bio.
          Ogni invio viene collegato automaticamente all'evento scelto.
        </p>
      </section>

      <section className="pb-14 md:pb-16">
        {/*    <SectionHeading
          eyebrow="Form"
          title="Invio candidatura"
          description="La candidatura raccoglie nome, citta, Instagram, link al set e bio. Ogni invio viene collegato automaticamente all'evento scelto."
        /> */}
        <ApplicationForm events={openEvents} initialSlug={eventSlug} />
      </section>
    </div>
  );
}
