import { AdminLocationsManager } from "@/components/admin-locations-manager";
import { SectionHeading } from "@/components/section-heading";
import { getLocations } from "@/lib/data";

export default async function AdminLocationsPage() {
  const locations = await getLocations();

  return (
    <section className="py-8 md:py-10">
      <SectionHeading
        eyebrow="Locations"
        title="Gestione locations"
        description="Crea e organizza gli spazi da collegare agli eventi."
      />
      <AdminLocationsManager initialLocations={locations} />
    </section>
  );
}
