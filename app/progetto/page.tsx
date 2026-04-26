import type { Metadata } from "next";

import { membershipInfoSections } from "@/content/membership-copy";
import {
  hubPillars,
  manifestoParagraphs,
  projectPageCopy,
} from "@/content/project-copy";
import { SectionHeading } from "@/components/section-heading";
import { getEvents } from "@/lib/data";
import { buildMetadata } from "@/lib/seo";

const provincePositions: Array<{
  label: string;
  displayName: string;
  keywords: string[];
  top: string;
  left: string;
}> = [
  {
    label: "TO",
    displayName: "Torino",
    keywords: [" torino ", " to "],
    top: "23%",
    left: "29%",
  },
  {
    label: "MI",
    displayName: "Milano",
    keywords: [" milano ", " mi "],
    top: "20%",
    left: "34%",
  },
  {
    label: "BG",
    displayName: "Bergamo",
    keywords: [" bergamo ", " bg "],
    top: "22%",
    left: "37%",
  },
  {
    label: "BS",
    displayName: "Brescia",
    keywords: [" brescia ", " bs "],
    top: "22%",
    left: "39%",
  },
  {
    label: "VR",
    displayName: "Verona",
    keywords: [" verona ", " vr "],
    top: "23%",
    left: "42%",
  },
  {
    label: "PD",
    displayName: "Padova",
    keywords: [" padova ", " pd "],
    top: "23%",
    left: "45%",
  },
  {
    label: "VE",
    displayName: "Venezia",
    keywords: [" venezia ", " ve "],
    top: "22%",
    left: "48%",
  },
  {
    label: "BO",
    displayName: "Bologna",
    keywords: [" bologna ", " bo "],
    top: "31%",
    left: "40%",
  },
  {
    label: "FI",
    displayName: "Firenze",
    keywords: [" firenze ", " fi "],
    top: "39%",
    left: "39%",
  },
  {
    label: "GE",
    displayName: "Genova",
    keywords: [" genova ", " ge "],
    top: "29%",
    left: "30%",
  },
  {
    label: "AN",
    displayName: "Ancona",
    keywords: [" ancona ", " an "],
    top: "38%",
    left: "49%",
  },
  {
    label: "PG",
    displayName: "Perugia",
    keywords: [" perugia ", " pg "],
    top: "44%",
    left: "45%",
  },
  {
    label: "RM",
    displayName: "Roma",
    keywords: [" roma ", " rm "],
    top: "50%",
    left: "46%",
  },
  {
    label: "NA",
    displayName: "Napoli",
    keywords: [" napoli ", " napli ", " na "],
    top: "65%",
    left: "50%",
  },
  {
    label: "BA",
    displayName: "Bari",
    keywords: [" bari ", " ba "],
    top: "64%",
    left: "64%",
  },
  {
    label: "TA",
    displayName: "Taranto",
    keywords: [" taranto ", " ta "],
    top: "72%",
    left: "60%",
  },
  {
    label: "LE",
    displayName: "Lecce",
    keywords: [" lecce ", " le "],
    top: "79%",
    left: "61%",
  },
  {
    label: "CZ",
    displayName: "Catanzaro",
    keywords: [" catanzaro ", " cz "],
    top: "81%",
    left: "54%",
  },
  {
    label: "RC",
    displayName: "Reggio Calabria",
    keywords: [" reggio calabria ", " rc "],
    top: "86%",
    left: "53%",
  },
  {
    label: "PA",
    displayName: "Palermo",
    keywords: [" palermo ", " pa "],
    top: "90%",
    left: "38%",
  },
  {
    label: "CT",
    displayName: "Catania",
    keywords: [" catania ", " ct "],
    top: "88%",
    left: "47%",
  },
  {
    label: "CA",
    displayName: "Cagliari",
    keywords: [" cagliari ", " ca "],
    top: "74%",
    left: "26%",
  },
];

const fallbackPositions = [
  { top: "24%", left: "39%" },
  { top: "34%", left: "43%" },
  { top: "40%", left: "46%" },
  { top: "52%", left: "50%" },
  { top: "63%", left: "55%" },
  { top: "60%", left: "69%" },
  { top: "84%", left: "38%" },
];

export const metadata: Metadata = buildMetadata({
  title: projectPageCopy.seoTitle,
  description: projectPageCopy.seoDescription,
  path: "/progetto",
});

export default async function ProjectPage() {
  const events = await getEvents();
  const places = buildPlaces(events);

  return (
    <div className="mx-auto w-full max-w-[1240px] px-4 md:px-6">
      <section className="py-16 md:py-20">
        <span className="text-xs uppercase tracking-[0.24em] text-[#E31F29]">
          {projectPageCopy.eyebrow}
        </span>
        <h1 className="mt-3 text-[clamp(1.9rem,4vw,3.1rem)] font-semibold leading-none tracking-[-0.03em] text-[#f7f3ee]">
          {projectPageCopy.title}
        </h1>
        <p className="mt-4 max-w-[42rem] text-lg leading-8 text-white/76">
          {projectPageCopy.description}
        </p>
      </section>

      <section className="pb-14 md:pb-16">
        <SectionHeading
          eyebrow="Manifesto"
          title="Non solo una serata. Una rete."
          description="La visione è semplice: selezionare, documentare, connettere. OpenDecks non deve produrre solo intrattenimento, ma movimento culturale reale."
        />
        <div className="grid gap-6 md:grid-cols-2">
          {manifestoParagraphs.map((paragraph) => (
            <div
              key={paragraph}
              className="rounded-2xl border border-[#E31F29]/18 bg-white/[0.03] p-6 text-sm leading-7 text-white/74"
            >
              <p>{paragraph}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="membership-card" className="scroll-mt-24 pb-14 md:pb-16">
        <SectionHeading
          eyebrow="Membership Card"
          title="Accesso alla community attiva Open Decks."
          description="La card digitale non è una classifica: è lo strumento con cui il progetto riconosce chi partecipa, resta in contatto con la rete e può essere coinvolto nelle prossime tappe."
        />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {membershipInfoSections.map((section) => (
            <article
              key={section.title}
              className="rounded-2xl border border-[#E31F29]/18 bg-white/[0.03] p-5"
            >
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[#E31F29]/35 bg-[#E31F29]/12 text-sm font-semibold text-[#ff7e86]">
                {membershipInfoSections.indexOf(section) + 1}
              </span>
              <h3 className="mt-3 text-xl font-semibold tracking-[-0.03em] text-[#f7f3ee]">
                {section.title}
              </h3>
              <p className="mt-3 text-sm leading-7 text-white/72">
                {section.body}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="pb-14 md:pb-16">
        <SectionHeading
          eyebrow="Hub"
          title="Cosa significa essere un hub"
          description="Un hub è un punto centrale di connessione. Non è il posto dove si suona e si va via: è il punto in cui persone, opportunità, contenuti e collaborazioni iniziano a muoversi da sole."
        />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {hubPillars.map((pillar) => (
            <article
              key={pillar.title}
              className="rounded-2xl border border-[#E31F29]/18 bg-white/[0.03] p-5"
            >
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-[#E31F29]/35 bg-[#E31F29]/12 text-[#ff7e86]">
                <HubPillarIcon title={pillar.title} />
              </span>
              <h3 className="mt-3 text-xl font-semibold tracking-[-0.03em] text-[#f7f3ee]">
                {pillar.title}
              </h3>
              <p className="mt-3 text-sm leading-7 text-white/72">
                {pillar.description}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="pb-16 md:pb-20">
        <SectionHeading
          eyebrow="Mappa"
          title="Una rete che gira, si espande e si connette."
          description="Invece di una cartina rigida, qui la rete appare come un globo editoriale: una scena che si muove, si allarga e comincia a lasciare tracce in più territori."
        />

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_360px]">
          <div className="relative overflow-hidden rounded-3xl border border-[#E31F29]/18 bg-[radial-gradient(circle_at_top,rgba(227,31,41,0.15),transparent_24%),rgba(255,255,255,0.03)] p-4 sm:p-6">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-[linear-gradient(180deg,rgba(227,31,41,0.07),transparent)]" />
            <div className="pointer-events-none absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#E31F29]/10 blur-3xl" />

            <div className="relative mx-auto aspect-square w-full max-w-[560px]">
              <div className="absolute inset-[7%] rounded-full border border-[#E31F29]/24 bg-[radial-gradient(circle_at_30%_28%,rgba(255,255,255,0.12),rgba(255,255,255,0.03)_32%,rgba(0,0,0,0.18)_70%,rgba(0,0,0,0.48)_100%)] shadow-[0_0_40px_rgba(227,31,41,0.16),inset_0_0_50px_rgba(227,31,41,0.08)]" />
              <div className="pointer-events-none absolute inset-[7%] rounded-full border border-white/8" />
              <div className="pointer-events-none absolute inset-[7%] rounded-full">
                <span className="absolute left-[18%] top-0 h-full w-px bg-white/7" />
                <span className="absolute left-[34%] top-0 h-full w-px bg-white/7" />
                <span className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-[#E31F29]/16" />
                <span className="absolute right-[34%] top-0 h-full w-px bg-white/7" />
                <span className="absolute right-[18%] top-0 h-full w-px bg-white/7" />
                <span className="absolute left-0 top-[22%] h-px w-full bg-white/7" />
                <span className="absolute left-0 top-[38%] h-px w-full bg-white/7" />
                <span className="absolute left-0 top-1/2 h-px w-full -translate-y-1/2 bg-[#E31F29]/14" />
                <span className="absolute left-0 top-[62%] h-px w-full bg-white/7" />
                <span className="absolute left-0 top-[78%] h-px w-full bg-white/7" />
              </div>
              <div className="pointer-events-none absolute inset-[10%] rounded-full border border-[#E31F29]/12" />
              <div className="pointer-events-none absolute inset-[16%] rounded-full border border-[#E31F29]/10" />

              {places.map((place) => (
                <div
                  key={place.name}
                  className="absolute -translate-x-1/2 -translate-y-1/2"
                  style={{ top: place.top, left: place.left }}
                >
                  <div className="relative">
                    <span className="absolute left-1/2 top-full h-10 w-px -translate-x-1/2 bg-[#E31F29]/58" />
                    <span className="absolute left-1/2 top-[38px] h-2.5 w-2.5 -translate-x-1/2 rounded-full bg-[#E31F29] shadow-[0_0_12px_rgba(227,31,41,0.95)]" />
                    <div className="rounded-md border border-[#ff6b73]/45 bg-[#E31F29]/17 px-3 py-2 shadow-[0_0_20px_rgba(227,31,41,0.18)] backdrop-blur-sm">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex h-2.5 w-2.5 rounded-full bg-[#E31F29] shadow-[0_0_12px_rgba(227,31,41,0.95)]" />
                        <span className="text-[0.72rem] font-medium uppercase tracking-[0.18em] text-white">
                          {place.name}
                        </span>
                      </div>
                      <p className="mt-1 text-[0.7rem] text-white/68">
                        {place.count} {place.count === 1 ? "evento" : "eventi"}
                      </p>
                    </div>
                  </div>
                </div>
              ))}

              <div className="pointer-events-none absolute bottom-[16%] left-[19%] h-24 w-24 rounded-full border border-white/6" />
              <div className="pointer-events-none absolute right-[18%] top-[18%] h-16 w-16 rounded-full border border-white/6" />
            </div>
          </div>

          <div className="grid content-start gap-4">
            <div className="rounded-2xl border border-[#E31F29]/18 bg-white/[0.03] p-5">
              <span className="text-xs uppercase tracking-[0.24em] text-[#E31F29]">
                Luoghi attivi
              </span>
              <div className="mt-4 grid gap-3">
                {places.map((place) => (
                  <div
                    key={place.name}
                    className="rounded-xl border border-[#E31F29]/14 bg-black/30 p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="text-base font-medium text-[#f7f3ee]">
                        {place.name}
                      </h3>
                      <span className="rounded-md border border-[#E31F29]/25 bg-[#E31F29]/10 px-2 py-1 text-[0.68rem] uppercase tracking-[0.18em] text-white/84">
                        {place.count}
                      </span>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-white/62">
                      {place.titles.join(" / ")}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function HubPillarIcon({ title }: { title: string }) {
  const className = "h-5 w-5";

  if (title.includes("talenti")) {
    return (
      <svg
        className={className}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M12 14.5a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" />
        <path d="M4.5 20.5a7.5 7.5 0 0 1 15 0" />
        <path d="M18.5 5.5h2" />
        <path d="M19.5 4.5v2" />
      </svg>
    );
  }

  if (title.includes("contenuto")) {
    return (
      <svg
        className={className}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M6 5.5h12a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-9a2 2 0 0 1 2-2Z" />
        <path d="m10.5 9 4 3-4 3V9Z" />
      </svg>
    );
  }

  if (title.includes("collaborazioni")) {
    return (
      <svg
        className={className}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M8.5 12.5 6.8 14a2.8 2.8 0 0 1-4-4l3.4-3.4a3.2 3.2 0 0 1 4.3-.2l.8.6" />
        <path d="m15.5 11.5 1.7-1.5a2.8 2.8 0 0 1 4 4l-3.4 3.4a3.2 3.2 0 0 1-4.3.2l-.8-.6" />
        <path d="m8.5 15.5 7-7" />
      </svg>
    );
  }

  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M4.5 12a7.5 7.5 0 0 1 12.8-5.3" />
      <path d="M17.5 4.5v4h-4" />
      <path d="M19.5 12a7.5 7.5 0 0 1-12.8 5.3" />
      <path d="M6.5 19.5v-4h4" />
    </svg>
  );
}

function buildPlaces(events: Awaited<ReturnType<typeof getEvents>>) {
  const grouped = new Map<
    string,
    { name: string; count: number; titles: string[]; top: string; left: string }
  >();

  for (const event of events) {
    const province = resolveProvince(event.locationName, event.locationAddress);
    const key = province.label;

    const current = grouped.get(key);

    if (current) {
      current.count += 1;
      current.titles.push(event.title);
      continue;
    }

    const position =
      province.position ||
      fallbackPositions[grouped.size % fallbackPositions.length];

    grouped.set(key, {
      name: province.displayName,
      count: 1,
      titles: [event.title],
      top: position.top,
      left: position.left,
    });
  }

  return [...grouped.values()].sort((a, b) =>
    a.name.localeCompare(b.name, "it"),
  );
}

function resolveProvince(name: string, address: string) {
  const haystack = ` ${normalizeLocationName(`${name} ${address}`)} `;
  const matchedProvince = provincePositions.find((province) =>
    province.keywords.some((keyword) => haystack.includes(keyword)),
  );

  if (matchedProvince) {
    return {
      label: matchedProvince.label,
      displayName: matchedProvince.displayName,
      position: matchedProvince,
    };
  }

  return {
    label: "ND",
    displayName: "Non definita",
    position: null,
  };
}

function normalizeLocationName(name: string) {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, " ")
    .trim()
    .toLowerCase();
}
