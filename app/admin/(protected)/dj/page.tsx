import { AdminDjRosterManager } from "@/components/admin-dj-roster-manager";
import { SectionHeading } from "@/components/section-heading";
import { getDjRosterEntries, getEvents } from "@/lib/data";

type AdminDjPageProps = {
  searchParams?: Promise<{ djId?: string }>;
};

export default async function AdminDjPage({ searchParams }: AdminDjPageProps) {
  const [roster, events] = await Promise.all([getDjRosterEntries(), getEvents()]);
  const resolvedSearchParams = searchParams ? await searchParams : undefined;

  return (
    <section className="py-8 md:py-10">
      <SectionHeading
        eyebrow="DJ roster"
        title="DJ approvati"
        description="Elenco dei DJ presenti nel roster, sia da candidatura approvata sia da inserimento manuale, con gestione membership card."
      />
      <AdminDjRosterManager
        initialRoster={roster}
        events={events}
        initialSelectedId={resolvedSearchParams?.djId}
      />
    </section>
  );
}
