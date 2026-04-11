import { AdminDjRosterManager } from "@/components/admin-dj-roster-manager";
import { SectionHeading } from "@/components/section-heading";
import { getDjRosterEntries, getEvents } from "@/lib/data";

export default async function AdminDjPage() {
  const [roster, events] = await Promise.all([getDjRosterEntries(), getEvents()]);

  return (
    <section className="py-8 md:py-10">
      <SectionHeading
        eyebrow="DJ roster"
        title="DJ approvati"
        description="Elenco dei DJ presenti nel roster, sia da candidatura approvata sia da inserimento manuale, con gestione membership card."
      />
      <AdminDjRosterManager initialRoster={roster} events={events} />
    </section>
  );
}
