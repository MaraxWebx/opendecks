import { ArchiveAdminManager } from "@/components/archive-admin-manager";
import { SectionHeading } from "@/components/section-heading";
import { getArchiveEntries, getEvents } from "@/lib/data";

export default async function AdminContentsPage() {
  const [archive, events] = await Promise.all([getArchiveEntries(), getEvents()]);

  return (
    <section className="py-8 md:py-10">
      <SectionHeading
        eyebrow="Gallery"
        title="Gestione gallery da admin"
        description="Carica media su Blob, collegali a un evento e gestisci la gallery editoriale in modo più rapido."
      />
      <ArchiveAdminManager initialItems={archive} events={events} />
    </section>
  );
}
