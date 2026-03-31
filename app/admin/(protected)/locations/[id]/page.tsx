import Link from "next/link";
import { notFound } from "next/navigation";

import { AdminLocationDetailEditor } from "@/components/admin-location-detail-editor";
import { SectionHeading } from "@/components/section-heading";
import { getEvents, getLocationById } from "@/lib/data";
import { ui } from "@/lib/ui";

type AdminLocationDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function AdminLocationDetailPage({
  params
}: AdminLocationDetailPageProps) {
  const { id } = await params;
  const [location, events] = await Promise.all([getLocationById(id), getEvents()]);

  if (!location) {
    notFound();
  }

  const relatedEvents = events
    .filter((event) => event.locationId === location.id)
    .sort((a, b) => a.date.localeCompare(b.date));

  return (
    <section className={ui.layout.sectionCompact}>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <SectionHeading
            eyebrow="Location"
            title={location.name}
            description="Scheda privata location con modifica dati, link rapidi ed eventi collegati."
          />
        </div>
        <Link href="/admin/locations" className={ui.action.secondary}>
          Torna alle locations
        </Link>
      </div>

      <AdminLocationDetailEditor location={location} relatedEvents={relatedEvents} />
    </section>
  );
}
