import Link from "next/link";

import { buildMetadata } from "@/lib/seo";
import { ui } from "@/lib/ui";

export const metadata = buildMetadata({
  title: "Privacy Policy",
  path: "/privacy-policy",
  description:
    "Informativa privacy di OpenDecks Italia per contatti, candidature e utilizzo del sito.",
  keywords: ["privacy policy", "opendecks", "cookies", "gdpr"],
});

export default function PrivacyPolicyPage() {
  return (
    <section className={ui.layout.section}>
      <div className="mx-auto grid w-full max-w-[1240px] gap-8 px-4 md:px-6">
        <div className="grid gap-3">
          <span className={ui.text.eyebrow}>Privacy Policy</span>
          <h1 className="text-[clamp(2.2rem,5vw,4.2rem)] font-semibold leading-none tracking-[-0.04em] text-[#f7f3ee]">
            Informativa privacy
          </h1>
          <p className="max-w-3xl text-base leading-8 text-white/72">
            Questa pagina descrive in modo sintetico come OpenDecks Italia
            gestisce i dati inviati tramite sito, candidature DJ e richieste di
            contatto. E una base statica iniziale e andra aggiornata quando
            verranno collegati nuovi servizi esterni.
          </p>
        </div>

        <div className="grid gap-5">
          <PolicyBlock
            title="Titolare del trattamento"
            content="OpenDecks Italia. Per richieste privacy o gestione dati puoi scrivere a info@opendecks.it."
          />
          <PolicyBlock
            title="Dati raccolti"
            content="Possiamo raccogliere dati di contatto, dati candidatura, foto profilo, link social, link set, messaggi inviati dal form contatti e dati tecnici strettamente necessari al funzionamento del sito."
          />
          <PolicyBlock
            title="Finalita"
            content="I dati vengono trattati per gestire candidature DJ, contatti, organizzazione eventi, roster artisti, comunicazioni operative e funzionamento tecnico del sito."
          />
          <PolicyBlock
            title="Base giuridica"
            content="Il trattamento avviene sulla base del consenso espresso tramite i form, dell'esecuzione di misure precontrattuali richieste dall'utente e del legittimo interesse per la sicurezza e il funzionamento della piattaforma."
          />
          <PolicyBlock
            title="Servizi tecnici utilizzati"
            content="Il sito utilizza attualmente infrastruttura Vercel, database MongoDB Atlas, Vercel Blob per upload file e SMTP per invio email operative. Eventuali ulteriori servizi come analytics, reCAPTCHA o strumenti marketing verranno aggiunti a questa informativa quando saranno attivati."
          />
          <PolicyBlock
            title="Cookie"
            content="Attualmente il sito utilizza cookie o strumenti tecnici strettamente necessari al funzionamento. Se verranno attivati servizi di analytics o marketing, il banner e questa pagina saranno aggiornati di conseguenza."
          />
          <PolicyBlock
            title="Conservazione dei dati"
            content="I dati vengono conservati per il tempo necessario alla gestione operativa del progetto, delle candidature, del roster e degli obblighi tecnici o amministrativi connessi."
          />
          <PolicyBlock
            title="Diritti dell'utente"
            content="Puoi chiedere accesso, rettifica, aggiornamento o cancellazione dei dati scrivendo a info@opendecks.it, nei limiti previsti dalla normativa applicabile."
          />
        </div>

        <div className="flex flex-wrap gap-3">
          <Link href="/contatti" className={ui.action.secondary}>
            Contattaci
          </Link>
          <Link href="/" className={ui.action.secondary}>
            Torna al sito
          </Link>
        </div>
      </div>
    </section>
  );
}

function PolicyBlock({
  title,
  content,
}: {
  title: string;
  content: string;
}) {
  return (
    <div className="rounded-xl border border-[#E31F29]/16 bg-white/[0.03] p-6">
      <h2 className="text-lg font-semibold tracking-[-0.02em] text-[#f7f3ee]">
        {title}
      </h2>
      <p className="mt-3 text-sm leading-7 text-white/74">{content}</p>
    </div>
  );
}
