import { ArchiveMediaTile } from "@/components/archive-media-tile";
import { getArchiveEntries } from "@/lib/data";

export default async function ArchivePage() {
  const archive = await getArchiveEntries();

  return (
    <div className="bg-black">
      <section className="px-4 py-12 md:px-6 md:py-16">
        <div className="mx-auto max-w-[1240px]">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div className="max-w-[52rem]">
              <span className="text-xs uppercase tracking-[0.24em] text-[#E31F29]">
                Archivio
              </span>
              <h1 className="mt-3 text-[clamp(1.9rem,4vw,3.1rem)] font-semibold leading-none tracking-[-0.03em] text-[#f7f3ee]">
                Un frammento della serata con i nostri selectors.
              </h1>
              <p className="mt-4 max-w-[42rem] text-lg leading-8 text-white/76">
                Una pagina più visiva, vicina a un moodboard fotografico:
                quattro colonne, ritmo irregolare, contenuti media misti e testo
                ridotto al minimo.
              </p>
            </div>

            <a
              href="https://t.me/opendecksitalia?utm_source=ig&utm_medium=social&utm_content=link_in_bio&fbclid=PAZXh0bgNhZW0CMTEAc3J0YwZhcHBfaWQMMjU2MjgxMDQwNTU4AAGnpj7YXBWihu6z5LbMl71a-JWR8ghi42oUKWpR9Nc3u-WHwwuaRgo_yUVLaFM_aem_aX73IYbUVPrT6RnEeVirAA"
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#E31F29]/35 px-5 py-3 text-sm font-medium text-[#f3efe5] transition hover:bg-[#E31F29]/10"
            >
              <TelegramIcon />
              Vedi gli scatti su Telegram
            </a>
          </div>
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

function TelegramIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M21.07 4.93a1.6 1.6 0 0 0-1.64-.22L3.72 11.1a1.3 1.3 0 0 0 .1 2.44l4.02 1.42 1.45 4.64a1.28 1.28 0 0 0 2.17.54l2.25-2.31 4.42 3.24a1.61 1.61 0 0 0 2.54-.93l2.3-13.55a1.59 1.59 0 0 0-.9-1.66ZM10.28 18.2l-.97-3.12 7.92-6.96a.38.38 0 0 0-.5-.57l-9.55 5.86-2.34-.83 14.5-5.9-1.96 11.58-3.99-2.93a1.27 1.27 0 0 0-1.64.12l-1.47 1.5Z" />
    </svg>
  );
}
