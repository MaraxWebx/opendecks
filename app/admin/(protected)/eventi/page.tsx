import { AdminEventsPageContent } from "@/components/admin-events-page-content";
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
      <AdminEventsPageContent
        events={events}
        djRoster={djRoster}
        tags={tags}
        locations={locations}
      />
    </section>
  );
}
