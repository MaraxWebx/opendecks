import { ContactForm } from "@/components/contact-form";

export default function ContactPage() {
  return (
    <div className="mx-auto w-full max-w-[1240px] px-4 py-10 md:px-6 md:py-12">
      <section className="grid gap-8 lg:grid-cols-[minmax(0,1.1fr)_360px]">
        <div className="grid gap-5 rounded-2xl border border-[#E31F29]/18 bg-white/[0.03] p-5 md:p-6">
          <div className="grid gap-3">
            <span className="text-xs uppercase tracking-[0.24em] text-[#E31F29]">
              Contatti
            </span>
            <h1 className="text-[clamp(1.9rem,4vw,3rem)] font-semibold leading-none tracking-[-0.03em] text-[#f7f3ee]">
              Scrivici per eventi, partnership e booking.
            </h1>
            <p className="max-w-[42rem] text-base leading-7 text-white/74">
              Se vuoi proporre una collaborazione, un venue, un format o semplicemente entrare in contatto con OpenDecks Italia, usa questo spazio.
            </p>
          </div>

          <ContactForm />
        </div>

        <div className="grid gap-4 content-start">
          <ContactCard
            title="Email"
            value="info@opendecks.it"
            href="mailto:info@opendecks.it"
          />
          <ContactCard
            title="Instagram"
            value="@opendecks.italia"
            href="https://www.instagram.com/opendecks.italia/"
          />
          <ContactCard
            title="Telegram"
            value="Canale OpenDecks Italia"
            href="https://t.me/opendecksitalia?utm_source=ig&utm_medium=social&utm_content=link_in_bio&fbclid=PAZXh0bgNhZW0CMTEAc3J0YwZhcHBfaWQMMjU2MjgxMDQwNTU4AAGnpj7YXBWihu6z5LbMl71a-JWR8ghi42oUKWpR9Nc3u-WHwwuaRgo_yUVLaFM_aem_aX73IYbUVPrT6RnEeVirAA"
          />
          <ContactCard
            title="SoundCloud"
            value="OpenDecks Italia"
            href="https://soundcloud.com/open-decks-107831124?utm_source=clipboard&utm_medium=text&utm_campaign=social_sharing"
          />
        </div>
      </section>
    </div>
  );
}

function ContactCard({
  title,
  value,
  href,
}: {
  title: string;
  value: string;
  href: string;
}) {
  return (
    <div className="rounded-2xl border border-[#E31F29]/18 bg-white/[0.03] p-5">
      <span className="text-xs uppercase tracking-[0.24em] text-[#E31F29]">
        {title}
      </span>
      <a
        href={href}
        target={href.startsWith("http") ? "_blank" : undefined}
        rel={href.startsWith("http") ? "noreferrer" : undefined}
        className="mt-3 block text-base leading-7 text-[#f7f3ee] transition hover:text-white/78"
      >
        {value}
      </a>
    </div>
  );
}
