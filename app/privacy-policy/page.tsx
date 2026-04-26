import Link from "next/link";

import { buildMetadata } from "@/lib/seo";
import { ui } from "@/lib/ui";

export const metadata = buildMetadata({
  title: "Privacy Policy",
  path: "/privacy-policy",
  description:
    "Informativa privacy e cookie policy di OpenDecks Italia per contatti, candidature e utilizzo del sito.",
  keywords: ["privacy policy", "cookie policy", "opendecks", "gdpr"],
});

const gaMeasurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

const cookieRows = [
  {
    name: "opendecks_cookie_consent",
    provider: "OpenDecks Italia",
    category: "Necessari",
    purpose:
      "Memorizza le preferenze di consenso dell'utente per evitare la riproposizione continua del banner.",
    duration: "182 giorni",
  },
  {
    name: "_ga, _ga_*",
    provider: "Google Analytics 4",
    category: "Analytics",
    purpose:
      "Misura visite, pagine visualizzate, interazioni aggregate e prestazioni del sito in ambiente di produzione, solo previo consenso.",
    duration: "Fino a 2 anni, secondo la configurazione di Google Analytics",
  },
  {
    name: "Nessun cookie lato utente",
    provider: "Google Search Console",
    category: "Nessuno",
    purpose:
      "Search Console è usato dal titolare del sito per monitorare indicizzazione, copertura e performance organica nei risultati di ricerca. Non installa cookie sul browser dell'utente solo per la presenza del sito nella piattaforma.",
    duration: "Non applicabile",
  },
  {
    name: "Google reCAPTCHA / identificatori tecnici associati",
    provider: "Google",
    category: "Necessari",
    purpose:
      "Protezione anti-spam e anti-abuso dei form pubblici del sito tramite verifica automatizzata del traffico.",
    duration: "Variabile secondo il servizio Google",
  },
  {
    name: "opendecks_admin_session, opendecks_admin_username, opendecks_admin_display_name",
    provider: "OpenDecks Italia",
    category: "Necessari",
    purpose:
      "Gestiscono l'accesso e la sessione dell'area amministrativa riservata.",
    duration: "Sessione o durata tecnica limitata",
  },
];

export default function PrivacyPolicyPage() {
  return (
    <section className={ui.layout.section}>
      <div className="mx-auto grid w-full max-w-[1240px] gap-8 px-4 md:px-6">
        <div className="grid gap-3">
          <span className={ui.text.eyebrow}>Privacy & Cookie Policy</span>
          <h1 className="text-[clamp(2.2rem,5vw,4.2rem)] font-semibold leading-none tracking-[-0.04em] text-[#f7f3ee]">
            Informativa privacy
          </h1>
          <p className="max-w-3xl text-base leading-8 text-white/72">
            Questa pagina descrive in modo sintetico come OpenDecks Italia
            gestisce i dati inviati tramite sito, candidature DJ, richieste di
            contatto e strumenti cookie o analytics collegati al sito.
          </p>
        </div>

        <div className="grid gap-5">
          <PolicyBlock
            title="Titolare del trattamento"
            content="OpenDecks Italia. Per richieste privacy o gestione dati puoi scrivere a info@opendecksitalia.it."
          />
          <PolicyBlock
            title="Dati raccolti"
            content="Possiamo raccogliere dati di contatto, dati candidatura, foto profilo, link social, link set, messaggi inviati dal form contatti, dati di sessione amministrativa e dati tecnici strettamente necessari al funzionamento del sito."
          />
          <PolicyBlock
            title={"Finalit\u00e0"}
            content="I dati vengono trattati per gestire candidature DJ, contatti, organizzazione eventi, roster artisti, comunicazioni operative, sicurezza, accesso all'area amministrativa e funzionamento tecnico del sito. In produzione, previo consenso, possiamo utilizzare strumenti analytics per misurare utilizzo e prestazioni del sito."
          />
          <PolicyBlock
            title="Base giuridica"
            content="Il trattamento avviene sulla base del consenso espresso tramite i form o tramite il banner cookie per gli strumenti analytics, dell'esecuzione di misure precontrattuali richieste dall'utente e del legittimo interesse per sicurezza, manutenzione e funzionamento tecnico della piattaforma."
          />
          <PolicyBlock
            title="Servizi tecnici utilizzati"
            content="Il sito utilizza infrastruttura Vercel, database MongoDB Atlas, Vercel Blob per upload file, SMTP per invio email operative, Google Search Console per monitoraggio indicizzazione e performance organica del sito, Google reCAPTCHA Invisible per la protezione dei form pubblici e, in ambiente di produzione e solo previo consenso, Google Analytics 4."
          />
          <PolicyBlock
            title="Google reCAPTCHA Invisible"
            content="I form pubblici del sito possono utilizzare Google reCAPTCHA Invisible come misura tecnica di sicurezza per ridurre spam, invii automatici e abusi. Il servizio viene attivato al momento dell'invio dei form pubblici e può comportare trattamento di dati tecnici del browser o dispositivo e altri segnali necessari alla verifica anti-bot da parte di Google. La base giuridica del relativo trattamento è il legittimo interesse del titolare alla sicurezza del sito e alla prevenzione degli abusi."
          />
          <PolicyBlock
            title="Google Analytics 4"
            content={`Se l'utente presta il consenso alla categoria analytics, il sito pu\u00f2 attivare Google Analytics 4 (Google LLC) esclusivamente in ambiente di produzione${gaMeasurementId ? ` con ID di misurazione ${gaMeasurementId}` : ""}. Lo strumento viene usato per raccogliere statistiche aggregate su visite, pagine visualizzate, utilizzo del sito e prestazioni tecniche. La base giuridica \u00e8 il consenso. Il servizio pu\u00f2 comportare trattamento di identificativi online, dati tecnici del browser o dispositivo, pagine visitate, interazioni e indirizzo IP in forma trattata dal servizio. L'utente pu\u00f2 revocare o modificare il consenso in qualsiasi momento dal link Preferenze cookie presente nel footer.`}
          />
          <PolicyBlock
            title="Google Search Console"
            content="OpenDecks Italia utilizza anche Google Search Console come strumento di monitoraggio tecnico SEO e indicizzazione del sito. Search Console, di per sé, non comporta l'installazione di cookie sul browser dell'utente per il solo fatto che il sito sia registrato o verificato nella piattaforma. Per questo motivo non viene trattato come strumento analytics/cookie lato utente al pari di Google Analytics 4."
          />
          <PolicyBlock
            title="Cookie"
            content="Il sito utilizza cookie o strumenti tecnici strettamente necessari al funzionamento e, solo in produzione e previo consenso, strumenti analytics per misurare l'utilizzo del sito. Il banner consente di accettare o rifiutare le categorie opzionali e di modificare successivamente la scelta."
          />
          <PolicyBlock
            title="Conservazione dei dati"
            content="I dati inviati tramite form vengono conservati per il tempo necessario alla gestione operativa del progetto, delle candidature, del roster e degli obblighi tecnici o amministrativi connessi. Le preferenze cookie vengono memorizzate per 182 giorni. Gli eventuali tempi di conservazione dei dati analytics dipendono dalla configurazione del servizio Google Analytics."
          />
          <PolicyBlock
            title="Trasferimenti e terze parti"
            content="Alcuni fornitori tecnici utilizzati dal sito possono trattare dati anche al di fuori dello Spazio Economico Europeo secondo le rispettive basi giuridiche e misure contrattuali. Per Google Analytics 4 si rinvia anche alla documentazione e informativa di Google in merito al servizio."
          />
          <PolicyBlock
            title="Diritti dell'utente"
            content="Puoi chiedere accesso, rettifica, aggiornamento, cancellazione, limitazione del trattamento o revoca del consenso scrivendo a info@opendecksitalia.it, nei limiti previsti dalla normativa applicabile."
          />
        </div>

        <div className="grid gap-4">
          <h2 className="text-lg font-semibold tracking-[-0.02em] text-[#f7f3ee]">
            Cookie e strumenti utilizzati
          </h2>
          <div className="overflow-x-auto rounded-xl border border-[#E31F29]/16 bg-white/[0.03]">
            <table className="min-w-full border-collapse text-left text-sm text-white/74">
              <thead className="bg-white/[0.04] text-white/88">
                <tr>
                  <th className="px-4 py-3 font-medium">Nome</th>
                  <th className="px-4 py-3 font-medium">Fornitore</th>
                  <th className="px-4 py-3 font-medium">Categoria</th>
                  <th className="px-4 py-3 font-medium">
                    {"Finalit\u00e0"}
                  </th>
                  <th className="px-4 py-3 font-medium">Durata</th>
                </tr>
              </thead>
              <tbody>
                {cookieRows.map((row) => (
                  <tr
                    key={row.name}
                    className="border-t border-[#E31F29]/10 align-top"
                  >
                    <td className="px-4 py-3 font-mono text-xs text-white/78">
                      {row.name}
                    </td>
                    <td className="px-4 py-3">{row.provider}</td>
                    <td className="px-4 py-3">{row.category}</td>
                    <td className="px-4 py-3">{row.purpose}</td>
                    <td className="px-4 py-3">{row.duration}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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

function PolicyBlock({ title, content }: { title: string; content: string }) {
  return (
    <div className="rounded-xl border border-[#E31F29]/16 bg-white/[0.03] p-6">
      <h2 className="text-lg font-semibold tracking-[-0.02em] text-[#f7f3ee]">
        {title}
      </h2>
      <p className="mt-3 text-sm leading-7 text-white/74">{content}</p>
    </div>
  );
}
