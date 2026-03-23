import {
  getApplications,
  getArchiveEntries,
  getDjRosterEntries,
  getEvents,
} from "@/lib/data";
import Link from "next/link";

export default async function AdminPage() {
  const [events, applications, archive, djRoster] = await Promise.all([
    getEvents(),
    getApplications(),
    getArchiveEntries(),
    getDjRosterEntries(),
  ]);
  const newApplications = applications.filter(
    (application) => application.status === "new",
  );
  const activeMembershipCards = djRoster.filter(
    (item) => item.membershipCardEnabled,
  ).length;

  return (
    <div>
      <section className="py-8 md:py-10">
        <span className="text-xs uppercase tracking-[0.24em] text-[#E31F29]">
          Admin base
        </span>
        <h1 className="mt-3 text-[clamp(1.9rem,4vw,3.1rem)] font-semibold leading-none tracking-[-0.03em] text-[#f7f3ee]">
          Controllo operativo essenziale.
        </h1>
        <p className="mt-4 max-w-[42rem] text-lg leading-8 text-white/76">
          Qui c&apos;e una vista base per leggere eventi, candidature e
          contenuti. In questa fase serve come riferimento funzionale per la
          futura dashboard vera.
        </p>
      </section>

      <section className="pb-10 md:pb-12">
        <div className="grid gap-4 grid-cols-2 md:grid-cols-2 lg:grid-cols-5 xl:grid-cols-5">
          <div className="rounded-2xl border border-[#E31F29]/18 bg-white/[0.04] p-4">
            <span className="text-xs uppercase tracking-[0.24em] text-[#E31F29]">
              Eventi
            </span>
            <h3 className="mt-2  text-2xl font-semibold text-[#f7f3ee]">
              {events.length}
            </h3>
          </div>
          <div className="rounded-2xl border border-[#E31F29]/18 bg-white/[0.04] p-4">
            <span className="text-xs uppercase tracking-[0.24em] text-[#E31F29]">
              Candidature
            </span>
            <h3 className="mt-2 text-2xl font-semibold text-[#f7f3ee]">
              {applications.length}
            </h3>
          </div>
          <div className="rounded-2xl border border-[#E31F29]/18 bg-white/[0.04] p-4">
            <span className="text-xs uppercase tracking-[0.24em] text-[#E31F29]">
              Archivio
            </span>
            <h3 className="mt-2 text-2xl font-semibold text-[#f7f3ee]">
              {archive.length}
            </h3>
          </div>
          <div className="rounded-2xl border border-[#E31F29]/18 bg-white/[0.04] p-4">
            <span className="text-xs uppercase tracking-[0.24em] text-[#E31F29]">
              DJ roster
            </span>
            <h3 className="mt-2 text-2xl font-semibold text-[#f7f3ee]">
              {djRoster.length}
            </h3>
          </div>
          <div className="rounded-2xl border border-[#E31F29]/18 bg-white/[0.04] p-4">
            <span className="text-xs uppercase tracking-[0.24em] text-[#E31F29]">
              Membership
            </span>
            <h3 className="mt-2 text-2xl font-semibold text-[#f7f3ee]">
              {activeMembershipCards}
            </h3>
          </div>
        </div>
      </section>

      <section className="pb-10 md:pb-12">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <span className="text-xs uppercase tracking-[0.24em] text-[#E31F29]">
              Live feed
            </span>
            <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-[#f7f3ee]">
              Nuove candidature ricevute
            </h2>
          </div>
          <Link
            href="/admin/candidature"
            className="inline-flex min-h-11 items-center justify-center rounded-xl border border-[#E31F29]/35 px-4 py-3 text-sm font-medium text-[#f7f3ee] transition hover:bg-[#E31F29]/10"
          >
            Vedi tutte
          </Link>
        </div>

        <div className="grid gap-4">
          {newApplications.slice(0, 5).map((application) => (
            <article
              key={application.id}
              className="rounded-2xl border border-[#E31F29]/18 bg-white/[0.04] p-5"
            >
              <div className="mb-3 flex flex-wrap items-center gap-2 text-sm text-white/58">
                <span>{application.eventTitle}</span>
                <span
                  className={`inline-flex rounded-md px-2 py-1 text-xs uppercase tracking-[0.12em] ${
                    application.status === "selected"
                      ? "bg-emerald-500/15 text-emerald-300"
                      : application.status === "reviewing"
                        ? "bg-amber-500/15 text-amber-200"
                        : "bg-[#E31F29]/14 text-white"
                  }`}
                >
                  {formatApplicationStatus(application.status)}
                </span>
                <span>
                  {new Date(application.submittedAt).toLocaleString("it-IT")}
                </span>
              </div>

              <div className="grid gap-2">
                <h3 className="text-lg font-semibold text-[#f7f3ee]">
                  {application.name}
                </h3>
                <p className="text-sm text-white/70">
                  {application.city} / {application.instagram}
                </p>
                <p className="text-sm text-white/55">{application.email}</p>
              </div>
            </article>
          ))}
          {!newApplications.length ? (
            <article className="rounded-2xl border border-[#E31F29]/18 bg-white/[0.04] p-5">
              <p className="text-sm text-white/65">
                Nessuna candidatura nuova al momento.
              </p>
            </article>
          ) : null}
        </div>
      </section>
    </div>
  );
}

function formatApplicationStatus(status: "new" | "reviewing" | "selected") {
  if (status === "new") {
    return "Nuova";
  }

  if (status === "reviewing") {
    return "In review";
  }

  return "Approvata";
}
