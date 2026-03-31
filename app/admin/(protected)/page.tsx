import Link from "next/link";

import {
  getApplications,
  getArchiveEntries,
  getDjRosterEntries,
  getEvents,
} from "@/lib/data";

type ChartItem = {
  label: string;
  count: number;
};

type DualChartItem = {
  label: string;
  applications: number;
  selectedDjs: number;
};

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
  const eventsByLocation = buildCounts(
    events.map((event) => event.locationName),
  );
  const eventsByProvince = buildCounts(
    events.map((event) => resolveEventGeo(event.locationAddress).province),
  );
  const applicationsByProvince = buildCounts(
    applications.map((application) => application.province || "Non definita"),
  );
  const applicationsByRegion = buildCounts(
    applications.map((application) => application.region || "Non definita"),
  );
  const djByProvince = buildCounts(
    djRoster.map((entry) => entry.province || "Non definita"),
  );
  const djByRegion = buildCounts(
    djRoster.map((entry) => entry.region || "Non definita"),
  );
  const recentPerformance = buildRecentEventPerformance(
    events,
    applications,
    djRoster,
  );

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
        <div className="grid grid-cols-2 gap-4 md:grid-cols-2 lg:grid-cols-5 xl:grid-cols-5">
          <MetricCard label="Eventi" value={events.length} />
          <MetricCard label="Candidature" value={applications.length} />
          <MetricCard label="Archivio" value={archive.length} />
          <MetricCard label="DJ roster" value={djRoster.length} />
          <MetricCard label="Membership" value={activeMembershipCards} />
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
              </div>
              <div className="mb-3 flex flex-wrap items-center gap-2 text-sm text-white/58">
                <span>{application.eventTitle}</span>

                <span>
                  {new Date(application.submittedAt).toLocaleString("it-IT")}
                </span>
              </div>

              <div className="grid gap-2">
                <h3 className="text-lg font-semibold text-[#f7f3ee]">
                  {application.name}
                </h3>
                <p className="text-sm text-white/70">
                  {formatCityProvince(application.city, application.province)} / {application.instagram}
                </p>
                <p className="text-sm text-white/55">{application.email}</p>
              </div>
              <div className="mt-4 flex flex-wrap gap-3">
                <Link
                  href={`/admin/candidature?applicationId=${application.id}`}
                  className="inline-flex min-h-11 items-center justify-center rounded-xl border border-[#E31F29]/35 px-4 py-3 text-sm font-medium text-[#f7f3ee] transition hover:bg-[#E31F29]/10"
                >
                  Dettagli
                </Link>
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

      <section className="pb-10 md:pb-12">
        <div className="mb-4">
          <span className="text-xs uppercase tracking-[0.24em] text-[#E31F29]">
            Statistiche
          </span>
          <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-[#f7f3ee]">
            Performance eventi
          </h2>
        </div>
        <div className="gap-4 flex flex-col">
          <div className="grid gap-4 xl:grid-cols-2">
            <DualStatsChart
              title="Candidature e DJ selezionati per evento"
              subtitle={`Eventi nell'ultimo mese disponibile: ${recentPerformance.rangeLabel}.`}
              items={recentPerformance.events}
            />
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <StatsChart
              title="Eventi per locale"
              subtitle="Quanti eventi sono stati caricati per ogni location."
              items={eventsByLocation}
            />
            <StatsChart
              title="Eventi per provincia"
              subtitle="Distribuzione geografica allineata alla lettura usata in Il progetto."
              items={eventsByProvince}
            />
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <StatsChart
              title="Candidature per provincia"
              subtitle="Quante candidature hai raccolto per provincia."
              items={applicationsByProvince}
            />
            <StatsChart
              title="Candidature per regione"
              subtitle="Quante candidature hai raccolto per regione."
              items={applicationsByRegion}
            />
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <StatsChart
              title="DJ roster per provincia"
              subtitle="Quanti DJ approvati hai per provincia."
              items={djByProvince}
            />
            <StatsChart
              title="DJ roster per regione"
              subtitle="Quanti DJ approvati hai per regione."
              items={djByRegion}
            />
          </div>
        </div>
      </section>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-[#E31F29]/18 bg-white/[0.04] p-4">
      <span className="text-xs uppercase tracking-[0.24em] text-[#E31F29]">
        {label}
      </span>
      <h3 className="mt-2 text-2xl font-semibold text-[#f7f3ee]">{value}</h3>
    </div>
  );
}

function StatsChart({
  title,
  subtitle,
  items,
}: {
  title: string;
  subtitle: string;
  items: ChartItem[];
}) {
  const max = items[0]?.count || 1;

  return (
    <div className="rounded-2xl border border-[#E31F29]/18 bg-white/[0.04] p-5">
      <span className="text-xs uppercase tracking-[0.24em] text-[#E31F29]">
        Dashboard
      </span>
      <h3 className="mt-2 text-xl font-semibold text-[#f7f3ee]">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-white/62">{subtitle}</p>

      <div className="mt-5 grid gap-3">
        {items.length ? (
          items.map((item) => (
            <div key={item.label} className="grid gap-2">
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="text-white/78">{item.label}</span>
                <span className="rounded-md bg-white/6 px-2 py-1 text-xs uppercase tracking-[0.14em] text-white/84">
                  {item.count}
                </span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-white/8">
                <div
                  className="h-full rounded-full bg-[linear-gradient(90deg,#ff676f_0%,#E31F29_100%)]"
                  style={{ width: `${Math.max((item.count / max) * 100, 8)}%` }}
                />
              </div>
            </div>
          ))
        ) : (
          <p className="text-sm text-white/55">Nessun dato disponibile.</p>
        )}
      </div>
    </div>
  );
}

function DualStatsChart({
  title,
  subtitle,
  items,
}: {
  title: string;
  subtitle: string;
  items: DualChartItem[];
}) {
  const max = items.reduce(
    (currentMax, item) =>
      Math.max(currentMax, item.applications + item.selectedDjs),
    1,
  );

  return (
    <div className="rounded-2xl border border-[#E31F29]/18 bg-white/[0.04] p-5 xl:col-span-2">
      <span className="text-xs uppercase tracking-[0.24em] text-[#E31F29]">
        Ultimo Mese
      </span>
      <h3 className="mt-2 text-xl font-semibold text-[#f7f3ee]">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-white/62">{subtitle}</p>

      <div className="mt-4 flex flex-wrap gap-4 text-xs uppercase tracking-[0.14em] text-white/68">
        <span className="inline-flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-[#E31F29]" />
          Candidature
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
          DJ selezionati
        </span>
      </div>

      <div className="mt-5 grid gap-4">
        {items.length ? (
          items.map((item) => (
            <div key={item.label} className="grid gap-2">
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="text-white/78">{item.label}</span>
                <span className="text-white/58">
                  {item.applications} candidature / {item.selectedDjs} DJ
                </span>
              </div>
              <div className="h-4 overflow-hidden rounded-full bg-white/8">
                <div
                  className="flex h-full overflow-hidden rounded-full"
                  style={{
                    width: `${Math.max(((item.applications + item.selectedDjs) / max) * 100, item.applications || item.selectedDjs ? 8 : 0)}%`,
                  }}
                >
                  <div
                    className="h-full shrink-0 bg-[linear-gradient(90deg,#ff676f_0%,#E31F29_100%)]"
                    style={{
                      width: `${(item.applications / Math.max(item.applications + item.selectedDjs, 1)) * 100}%`,
                    }}
                  />
                  <div
                    className="h-full shrink-0 bg-[linear-gradient(90deg,#6ee7b7_0%,#10b981_100%)]"
                    style={{
                      width: `${(item.selectedDjs / Math.max(item.applications + item.selectedDjs, 1)) * 100}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          ))
        ) : (
          <p className="text-sm text-white/55">Nessun dato disponibile.</p>
        )}
      </div>
    </div>
  );
}

function buildCounts(values: string[]) {
  const counts = new Map<string, number>();

  for (const value of values) {
    const label = value || "Non definita";
    counts.set(label, (counts.get(label) || 0) + 1);
  }

  return [...counts.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, "it"))
    .slice(0, 8);
}

function buildRecentEventPerformance(
  events: Awaited<ReturnType<typeof getEvents>>,
  applications: Awaited<ReturnType<typeof getApplications>>,
  djRoster: Awaited<ReturnType<typeof getDjRosterEntries>>,
) {
  if (!events.length) {
    return {
      rangeLabel: "nessun evento",
      events: [] as DualChartItem[],
    };
  }

  const latestEventDate = [...events]
    .map((event) => event.date)
    .sort((a, b) => b.localeCompare(a))[0];
  const latestDate = new Date(`${latestEventDate}T00:00:00`);
  const rangeStart = new Date(latestDate);
  rangeStart.setDate(rangeStart.getDate() - 30);

  const recentEvents = events
    .filter((event) => {
      const eventDate = new Date(`${event.date}T00:00:00`);
      return eventDate >= rangeStart && eventDate <= latestDate;
    })
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 8);

  const chartEvents = recentEvents.map((event) => ({
    label: buildEventChartLabel(event),
    applications: applications.filter(
      (application) => application.eventId === event.id,
    ).length,
    selectedDjs: djRoster.filter((record) => record.eventId === event.id)
      .length,
  }));

  return {
    rangeLabel: `${rangeStart.toLocaleDateString("it-IT")} - ${latestDate.toLocaleDateString("it-IT")}`,
    events: chartEvents,
  };
}

function buildEventChartLabel(
  event: Awaited<ReturnType<typeof getEvents>>[number],
) {
  return `#${event.eventNumber} ${event.title}`;
}

function resolveEventGeo(address: string) {
  const cleaned = normalizeText(address);
  const parts = cleaned
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);

  const city = inferCity(parts);
  const province = inferProvince(parts, city);

  return {
    city: city || "Non definita",
    province: province || "Non definita",
  };
}

function inferCity(parts: string[]) {
  const candidates = [...parts].reverse();

  for (const part of candidates) {
    const withoutZip = part.replace(/\b\d{5}\b/g, "").trim();

    if (!withoutZip || ignoredGeoLabels.has(withoutZip)) {
      continue;
    }

    const cityWithProvince = withoutZip.match(/^(.+?)\s*\(([a-z]{2})\)$/i);

    if (cityWithProvince?.[1]) {
      return cityWithProvince[1].trim();
    }

    const cityAndCode = withoutZip.match(/^(.+?)\s+([a-z]{2})$/i);

    if (cityAndCode?.[1] && provinceDictionary[cityAndCode[2].toUpperCase()]) {
      return cityAndCode[1].trim();
    }

    if (/[a-z]{3,}/i.test(withoutZip)) {
      return withoutZip;
    }
  }

  return "";
}

function inferProvince(parts: string[], city: string) {
  const candidates = [...parts].reverse();

  for (const part of candidates) {
    const cleanPart = part.trim();

    if (ignoredGeoLabels.has(cleanPart)) {
      continue;
    }

    const provinceMatch = cleanPart.match(/\(([a-z]{2})\)/i);

    if (provinceMatch?.[1]) {
      return provinceFromCode(provinceMatch[1].toUpperCase());
    }

    const inlineProvinceMatch = cleanPart.match(/\b([a-z]{2})\b/i);

    if (
      inlineProvinceMatch?.[1] &&
      provinceDictionary[inlineProvinceMatch[1].toUpperCase()]
    ) {
      return provinceFromCode(inlineProvinceMatch[1].toUpperCase());
    }
  }

  return provinceFromCity(city);
}

function provinceFromCode(code: string) {
  return provinceDictionary[code] || code;
}

function provinceFromCity(city: string) {
  const normalized = normalizeText(city);
  return cityProvinceDictionary[normalized] || "";
}

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
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

function formatCityProvince(city: string, province?: string) {
  return province ? `${city} (${province})` : city;
}

const ignoredGeoLabels = new Set(["italia", "italy"]);

const provinceDictionary: Record<string, string> = {
  AN: "Ancona",
  BA: "Bari",
  BG: "Bergamo",
  BO: "Bologna",
  BS: "Brescia",
  CA: "Cagliari",
  CT: "Catania",
  CZ: "Catanzaro",
  FI: "Firenze",
  GE: "Genova",
  LE: "Lecce",
  MI: "Milano",
  NA: "Napoli",
  PA: "Palermo",
  PD: "Padova",
  PG: "Perugia",
  RC: "Reggio Calabria",
  RM: "Roma",
  TO: "Torino",
  VE: "Venezia",
  VR: "Verona",
};

const cityProvinceDictionary: Record<string, string> = {
  ancona: "Ancona",
  bari: "Bari",
  bergamo: "Bergamo",
  bologna: "Bologna",
  brescia: "Brescia",
  cagliari: "Cagliari",
  catania: "Catania",
  catanzaro: "Catanzaro",
  firenze: "Firenze",
  genova: "Genova",
  lecce: "Lecce",
  milano: "Milano",
  napoli: "Napoli",
  palermo: "Palermo",
  padova: "Padova",
  perugia: "Perugia",
  "reggio calabria": "Reggio Calabria",
  roma: "Roma",
  torino: "Torino",
  venezia: "Venezia",
  verona: "Verona",
};
