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
      <div className="mb-6 grid gap-3 sm:flex sm:items-start sm:justify-between">
        <Link
          href="/admin/locations"
          className={`${ui.action.secondary} gap-2 justify-self-end sm:order-2 sm:self-start`}
        >
          <ArrowLeftIcon />
          Torna alle locations
        </Link>
        <div className="sm:order-1">
          <SectionHeading
            eyebrow="Location"
            title={location.name}
            description="Scheda privata location con modifica dati, link rapidi ed eventi collegati."
          />
        </div>
      </div>

      <AdminLocationDetailEditor location={location} relatedEvents={relatedEvents} />
    </section>
  );
}

function ArrowLeftIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M14.5 5.5 8 12l6.5 6.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
