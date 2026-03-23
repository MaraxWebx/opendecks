import { AdminApplicationsManager } from "@/components/admin-applications-manager";
import { SectionHeading } from "@/components/section-heading";
import { getApplications } from "@/lib/data";

export default async function AdminApplicationsPage() {
  const applications = await getApplications();

  return (
    <section className="py-8 md:py-10">
      <SectionHeading
        eyebrow="Candidature"
        title="Gestione candidature"
        description="Panoramica delle richieste ricevute, con evento associato e stato."
      />
      <AdminApplicationsManager initialApplications={applications} />
    </section>
  );
}
