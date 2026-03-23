import { AdminEventsManager } from "@/components/admin-events-manager";
import { SectionHeading } from "@/components/section-heading";
import { getDjRosterEntries, getEvents, getTags } from "@/lib/data";

export default async function AdminEventsPage() {
  const [events, djRoster, tags] = await Promise.all([
    getEvents(),
    getDjRosterEntries(),
    getTags()
  ]);

  return (
    <section className="py-8 md:py-10">
      <SectionHeading
        eyebrow="Eventi"
        title="Gestione eventi"
        description="Qui tieni sotto controllo calendario, stato delle date e sedi."
      />
      <AdminEventsManager initialEvents={events} djRoster={djRoster} availableTags={tags} />
    </section>
  );
}
