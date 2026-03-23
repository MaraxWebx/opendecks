import { ArchiveMediaTile } from "@/components/archive-media-tile";
import { getArchiveEntries } from "@/lib/data";

export default async function ArchivePage() {
  const archive = await getArchiveEntries();

  return (
    <div className="bg-black">
      <section className="px-4 py-12 md:px-6 md:py-16">
        <div className="mx-auto max-w-[1240px]">
          <span className="text-xs uppercase tracking-[0.24em] text-[#E31F29]">
            Archivio
          </span>
          <h1 className="mt-3 text-[clamp(1.9rem,4vw,3.1rem)] font-semibold leading-none tracking-[-0.03em] text-[#f7f3ee]">
            Un frammento della serata con i nostri selectors.
          </h1>
          <p className="mt-4 max-w-[42rem] text-lg leading-8 text-white/76">
            Una pagina piu visiva, vicina a un moodboard fotografico: quattro
            colonne, ritmo irregolare, contenuti media misti e testo ridotto al
            minimo.
          </p>
        </div>
      </section>

      <section className="px-4 pb-10 md:px-6 md:pb-16">
        <div className="mx-auto columns-1 gap-2 md:max-w-[1240px] md:columns-2 xl:columns-4">
          {archive.map((item) => (
            <ArchiveMediaTile key={item.id} item={item} variant="editorial" />
          ))}
        </div>
      </section>
    </div>
  );
}
