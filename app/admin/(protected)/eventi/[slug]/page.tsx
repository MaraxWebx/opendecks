import Link from "next/link";
import { notFound } from "next/navigation";

import { AdminEventDetailEditor } from "@/components/admin-event-detail-editor";
import { SectionHeading } from "@/components/section-heading";
import { getDjRosterEntries, getEventBySlug, getTags } from "@/lib/data";
import { ui } from "@/lib/ui";

type AdminEventDetailPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function AdminEventDetailPage({
  params
}: AdminEventDetailPageProps) {
  const { slug } = await params;
  const [event, djRoster, tags] = await Promise.all([
    getEventBySlug(slug),
    getDjRosterEntries(),
    getTags()
  ]);

  if (!event) {
    notFound();
  }

  const approvedDjs = djRoster.filter((record) => record.eventId === event.id);

  return (
    <section className={ui.layout.sectionCompact}>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <SectionHeading
            eyebrow="Evento"
            title={event.title}
            description="Scheda privata evento con dettagli, roster approvato e modifica contenuti."
          />
        </div>
        <Link href="/admin/eventi" className={ui.action.secondary}>
          Torna agli eventi
        </Link>
      </div>

      <AdminEventDetailEditor event={event} approvedDjs={approvedDjs} availableTags={tags} />
    </section>
  );
}
