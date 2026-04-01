import { AdminLocationsPageContent } from "@/components/admin-locations-page-content";
import { getLocations } from "@/lib/data";

export default async function AdminLocationsPage() {
  const locations = await getLocations();

  return (
    <section className="py-8 md:py-10">
      <AdminLocationsPageContent locations={locations} />
    </section>
  );
}
