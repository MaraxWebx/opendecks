import Link from "next/link";
import { notFound } from "next/navigation";

import { AdminEventDetailEditor } from "@/components/admin-event-detail-editor";
import { SectionHeading } from "@/components/section-heading";
import { getApplications, getDjRosterEntries, getEventBySlug, getLocations, getTags } from "@/lib/data";
import { ui } from "@/lib/ui";

type AdminEventDetailPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function AdminEventDetailPage({
  params
}: AdminEventDetailPageProps) {
  const { slug } = await params;
  const [event, djRoster, tags, locations, applications] = await Promise.all([
    getEventBySlug(slug),
    getDjRosterEntries(),
    getTags(),
    getLocations(),
    getApplications()
  ]);

  if (!event) {
    notFound();
  }

  return (
    <section className={ui.layout.sectionCompact}>
      <div className="mb-6 grid gap-3 sm:flex sm:items-start sm:justify-between">
        <Link
          href="/admin/eventi"
          className={`${ui.action.secondary} gap-2 justify-self-end sm:order-2 sm:self-start`}
        >
          <ArrowLeftIcon />
          Torna agli eventi
        </Link>
        <div className="sm:order-1">
          <SectionHeading
            eyebrow="Evento"
            title={event.title}
            description="Scheda privata evento con dettagli, roster approvato e modifica contenuti."
          />
        </div>
      </div>

      <AdminEventDetailEditor
        event={event}
        djRoster={djRoster}
        relatedApplications={applications.filter((application) => application.eventId === event.id)}
        availableTags={tags}
        availableLocations={locations}
      />
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
