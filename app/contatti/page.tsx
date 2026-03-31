import type { ReactNode } from "react";

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
              Se vuoi proporre una collaborazione, un venue, un format o
              semplicemente entrare in contatto con OpenDecks Italia, usa questo
              spazio.
            </p>
          </div>

          <ContactForm />
        </div>

        <div className="grid gap-4 content-start">
          <ContactCard
            title="Email"
            value="info@opendecks.it"
            href="mailto:info@opendecks.it"
            icon={<MailIcon />}
          />
          <ContactCard
            title="Telefono"
            value="+39 334 346 1942"
            href="tel:+393343461942"
            icon={<PhoneIcon />}
          />
          <SocialCard />
        </div>
      </section>
    </div>
  );
}

function ContactCard({
  title,
  value,
  href,
  icon,
}: {
  title: string;
  value: string;
  href: string;
  icon: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-[#E31F29]/18 bg-white/[0.03] p-5">
      <div className="flex items-center gap-3">
        <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-[#E31F29]/35 bg-[#E31F29]/10 text-white">
          {icon}
        </span>
        <span className="text-xs uppercase tracking-[0.24em] text-[#E31F29]">
          {title}
        </span>
      </div>
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

function SocialCard() {
  return (
    <div className="rounded-2xl border border-[#E31F29]/18 bg-white/[0.03] p-5">
      <div className="flex items-center gap-3">
        <span className="text-xs uppercase tracking-[0.24em] text-[#E31F29]">
          Social
        </span>
      </div>
      <div className="mt-4 flex flex-wrap gap-3">
        <a
          href="https://www.instagram.com/opendecks.italia/"
          target="_blank"
          rel="noreferrer"
          aria-label="Instagram OpenDecks Italia"
          className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-[#E31F29]/35 text-white transition hover:bg-[#E31F29]/10"
        >
          <InstagramIcon />
        </a>
        <a
          href="https://t.me/opendecksitalia?utm_source=ig&utm_medium=social&utm_content=link_in_bio&fbclid=PAZXh0bgNhZW0CMTEAc3J0YwZhcHBfaWQMMjU2MjgxMDQwNTU4AAGnpj7YXBWihu6z5LbMl71a-JWR8ghi42oUKWpR9Nc3u-WHwwuaRgo_yUVLaFM_aem_aX73IYbUVPrT6RnEeVirAA"
          target="_blank"
          rel="noreferrer"
          aria-label="Telegram OpenDecks Italia"
          className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-[#E31F29]/35 text-white transition hover:bg-[#E31F29]/10"
        >
          <TelegramIcon />
        </a>
        <a
          href="https://soundcloud.com/open-decks-107831124?utm_source=clipboard&utm_medium=text&utm_campaign=social_sharing"
          target="_blank"
          rel="noreferrer"
          aria-label="SoundCloud OpenDecks Italia"
          className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-[#E31F29]/35 text-white transition hover:bg-[#E31F29]/10"
        >
          <SoundCloudIcon />
        </a>
      </div>
      <p className="mt-4 text-sm leading-7 text-white/72">
        Seguici su Instagram, ascolta i set su SoundCloud e resta aggiornato sul
        canale Telegram.
      </p>
    </div>
  );
}

function MailIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M4.5 6.75h15a1.5 1.5 0 0 1 1.5 1.5v7.5a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 15.75v-7.5a1.5 1.5 0 0 1 1.5-1.5Z"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="m4.5 8.25 7.03 5.03a.8.8 0 0 0 .94 0l7.03-5.03"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M6.92 4.5h2.08a1.5 1.5 0 0 1 1.47 1.2l.45 2.2a1.5 1.5 0 0 1-.43 1.38l-1.2 1.2a13.5 13.5 0 0 0 4.23 4.23l1.2-1.2a1.5 1.5 0 0 1 1.38-.43l2.2.45a1.5 1.5 0 0 1 1.2 1.47v2.08a1.5 1.5 0 0 1-1.63 1.5C10.86 18.3 5.7 13.14 5.42 6.13A1.5 1.5 0 0 1 6.92 4.5Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <rect
        x="3.75"
        y="3.75"
        width="16.5"
        height="16.5"
        rx="4.5"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <circle cx="12" cy="12" r="3.6" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="17.3" cy="6.7" r="1.05" fill="currentColor" />
    </svg>
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

function SoundCloudIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M10.88 8.83a5.28 5.28 0 0 1 7.92 4.58h.7a3.5 3.5 0 1 1 0 7H4.62a.62.62 0 0 1-.62-.62V10.1c0-.34.28-.62.62-.62s.62.28.62.62v9.06h.9V8.66c0-.34.28-.62.62-.62s.62.28.62.62v10.5h.9V7.87c0-.34.28-.62.62-.62s.62.28.62.62v11.29h.9V8.83Zm9.42 10.33a2.25 2.25 0 0 0-.8-4.35h-1.93v-1.4a4.03 4.03 0 0 0-6.04-3.49v9.24h8.77Z" />
    </svg>
  );
}
