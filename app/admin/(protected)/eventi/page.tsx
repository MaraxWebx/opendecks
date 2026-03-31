import { AdminEventsManager } from "@/components/admin-events-manager";
import { SectionHeading } from "@/components/section-heading";
import { getDjRosterEntries, getEvents, getLocations, getTags } from "@/lib/data";

export default async function AdminEventsPage() {
  const [events, djRoster, tags, locations] = await Promise.all([
    getEvents(),
    getDjRosterEntries(),
    getTags(),
    getLocations()
  ]);

  return (
    <section className="py-8 md:py-10">
      <SectionHeading
        eyebrow="Eventi"
        title="Gestione eventi"
        description="Qui tieni sotto controllo calendario, stato delle date e sedi."
      />
      <AdminEventsManager initialEvents={events} djRoster={djRoster} availableTags={tags} availableLocations={locations} />
    </section>
  );
}
