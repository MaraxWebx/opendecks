import { SectionHeading } from "@/components/section-heading";
import { getEvents } from "@/lib/data";

const cityPinMap: Record<string, { top: string; left: string }> = {
  milano: { top: "24%", left: "39%" },
  torino: { top: "22%", left: "30%" },
  bologna: { top: "34%", left: "43%" },
  firenze: { top: "40%", left: "46%" },
  roma: { top: "52%", left: "50%" },
  napoli: { top: "63%", left: "55%" },
  caserta: { top: "60%", left: "53%" },
  salerno: { top: "68%", left: "58%" },
  bari: { top: "60%", left: "69%" },
  palermo: { top: "84%", left: "38%" },
  catania: { top: "86%", left: "49%" }
};

const manifestoParagraphs = [
  "OpenDecks Italia nasce per creare uno spazio accessibile dove artisti emergenti, collezionisti e appassionati possano esibirsi, incontrarsi e costruire una scena reale attorno alla musica.",
  "L'obiettivo non è solo organizzare serate, ma far crescere una rete nazionale fatta di eventi, call aperte, documentazione editoriale e connessioni tra città diverse."
];

export default async function ProjectPage() {
  const events = await getEvents();
  const places = buildPlaces(events);

  return (
    <div className="mx-auto w-full max-w-[1240px] px-4 md:px-6">
      <section className="py-16 md:py-20">
        <span className="text-xs uppercase tracking-[0.24em] text-[#E31F29]">
          Il progetto
        </span>
        <h1 className="mt-3 text-[clamp(1.9rem,4vw,3.1rem)] font-semibold leading-none tracking-[-0.03em] text-[#f7f3ee]">
          Una piattaforma per dare continuità alla scena.
        </h1>
        <p className="mt-4 max-w-[42rem] text-lg leading-8 text-white/76">
          OpenDecks Italia nasce per ampliare il valore dell&apos;evento: non solo serate, ma
          una rete nazionale che raccoglie talenti, documenta contenuti e costruisce un
          linguaggio riconoscibile.
        </p>
      </section>

      <section className="pb-14 md:pb-16">
        <SectionHeading
          eyebrow="Identità"
          title="Manifesto essenziale"
          description="Una base culturale e operativa che mette al centro accessibilità, call aperte, scena locale e costruzione di una rete editoriale attorno alla musica."
        />
        <div className="grid gap-6 md:grid-cols-2">
          {manifestoParagraphs.map((paragraph, index) => (
            <div
              key={index}
              className="rounded-2xl border border-[#E31F29]/18 bg-white/[0.03] p-6 text-sm leading-7 text-white/74"
            >
              <p>{paragraph}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="pb-16 md:pb-20">
        <SectionHeading
          eyebrow="Mappa"
          title="Una rete che gira, si espande e si connette."
          description="Invece di una cartina rigida, qui la rete è mostrata come un globo editoriale: una scena che si muove, si allarga e tocca città diverse."
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
                  key={place.city}
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
                          {place.city}
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
                    key={place.city}
                    className="rounded-xl border border-[#E31F29]/14 bg-black/30 p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="text-base font-medium text-[#f7f3ee]">{place.city}</h3>
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

function buildPlaces(events: Awaited<ReturnType<typeof getEvents>>) {
  const grouped = new Map<
    string,
    { city: string; count: number; titles: string[]; top: string; left: string }
  >();

  for (const event of events) {
    const key = normalizeCity(event.city);
    const pin = cityPinMap[key];

    if (!pin) {
      continue;
    }

    const current = grouped.get(key);

    if (current) {
      current.count += 1;
      current.titles.push(event.title);
      continue;
    }

    grouped.set(key, {
      city: event.city,
      count: 1,
      titles: [event.title],
      top: pin.top,
      left: pin.left
    });
  }

  return [...grouped.values()].sort((a, b) => a.city.localeCompare(b.city, "it"));
}

function normalizeCity(city: string) {
  return city
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}
