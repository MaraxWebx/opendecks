import { AdminDjRosterManager } from "@/components/admin-dj-roster-manager";
import { SectionHeading } from "@/components/section-heading";
import { getDjRosterEntries } from "@/lib/data";

export default async function AdminDjPage() {
  const roster = await getDjRosterEntries();

  return (
    <section className="py-8 md:py-10">
      <SectionHeading
        eyebrow="DJ roster"
        title="DJ approvati"
        description="Elenco di tutti i DJ passati in roster dopo l'approvazione candidatura, con gestione membership card."
      />
      <AdminDjRosterManager initialRoster={roster} />
    </section>
  );
}
