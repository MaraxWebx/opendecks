import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto w-full max-w-[1240px] px-4 md:px-6">
      <section className="py-16 md:py-20">
        <span className="text-xs uppercase tracking-[0.24em] text-[#E31F29]">404</span>
        <h1 className="mt-3 text-[clamp(1.9rem,4vw,3.1rem)] font-semibold leading-none tracking-[-0.03em] text-[#f7f3ee]">
          Pagina non trovata.
        </h1>
        <p className="mt-4 max-w-[42rem] text-lg leading-8 text-white/76">
          La struttura base esiste, ma questo percorso non e stato definito.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex min-h-11 items-center justify-center rounded-xl border border-[#E31F29] bg-[#E31F29] px-5 py-3 text-sm font-medium text-white transition hover:border-[#c91922] hover:bg-[#c91922]"
        >
          Torna alla home
        </Link>
      </section>
    </div>
  );
}
