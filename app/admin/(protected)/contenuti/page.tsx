import { ArchiveAdminManager } from "@/components/archive-admin-manager";
import { SectionHeading } from "@/components/section-heading";
import { getArchiveEntries } from "@/lib/data";

export default async function AdminContentsPage() {
  const archive = await getArchiveEntries();

  return (
    <section className="py-8 md:py-10">
      <SectionHeading
        eyebrow="Contenuti"
        title="Gestione gallery da admin"
        description="Pannello base per aggiungere e modificare elementi della gallery editoriale. Ogni item supporta foto, video o gif."
      />
      <ArchiveAdminManager initialItems={archive} />
    </section>
  );
}
