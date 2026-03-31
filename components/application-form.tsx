"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

import { EventRecord } from "@/lib/types";
import { ui } from "@/lib/ui";
import { GlobalLoader } from "@/components/global-loader";

type ApplicationFormProps = {
  events: EventRecord[];
  initialSlug?: string;
};

type FormState = {
  eventSlug: string;
  name: string;
  city: string;
  province: string;
  region: string;
  email: string;
  phone: string;
  photoUrl: string;
  instagram: string;
  setLink: string;
  bio: string;
};

type MunicipalityOption = {
  code: string;
  city: string;
  province: string;
  provinceCode: string;
  region: string;
  label: string;
};

const initialState: FormState = {
  eventSlug: "",
  name: "",
  city: "",
  province: "",
  region: "",
  email: "",
  phone: "",
  photoUrl: "",
  instagram: "",
  setLink: "",
  bio: "",
};

const fieldClass =
  "w-full rounded-xl border border-[#E31F29]/20 bg-white/[0.04] px-4 py-3 text-white outline-none transition placeholder:text-white/35 focus:border-[#E31F29]/60";

export function ApplicationForm({ events, initialSlug }: ApplicationFormProps) {
  const [form, setForm] = useState<FormState>({
    ...initialState,
    eventSlug: initialSlug || events[0]?.slug || "",
  });
  const [cityQuery, setCityQuery] = useState("");
  const [cityOptions, setCityOptions] = useState<MunicipalityOption[]>([]);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [status, setStatus] = useState<{
    type: "idle" | "ok" | "error";
    message: string;
  }>({
    type: "idle",
    message: "",
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const normalizedQuery = cityQuery.trim();

    if (normalizedQuery.length < 2) {
      setCityOptions([]);
      return;
    }

    let active = true;
    const timeoutId = window.setTimeout(async () => {
      try {
        const response = await fetch(
          `/api/municipalities?q=${encodeURIComponent(normalizedQuery)}`,
        );
        const result = (await response.json()) as {
          municipalities?: MunicipalityOption[];
        };

        if (!active) {
          return;
        }

        setCityOptions(result.municipalities || []);
      } catch {
        if (active) {
          setCityOptions([]);
        }
      }
    }, 150);

    return () => {
      active = false;
      window.clearTimeout(timeoutId);
    };
  }, [cityQuery]);

  async function uploadPhoto(file: File | null) {
    if (!file) {
      throw new Error("Carica una foto personale.");
    }

    const uploadData = new FormData();
    uploadData.append("file", file);

    const uploadResponse = await fetch("/api/uploads/application-photo", {
      method: "POST",
      body: uploadData,
    });

    if (!uploadResponse.ok) {
      const payload = (await uploadResponse.json().catch(() => null)) as {
        error?: string;
      } | null;
      throw new Error(payload?.error || "Upload foto non riuscito.");
    }

    const result = (await uploadResponse.json()) as { url: string };
    return result.url;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setStatus({ type: "idle", message: "" });

    try {
      const selectedEvent = events.find((item) => item.slug === form.eventSlug);

      if (!selectedEvent) {
        throw new Error("Seleziona un evento valido.");
      }

      if (!form.province) {
        throw new Error("Seleziona una citta valida dall'autocomplete.");
      }

      const photoUrl = await uploadPhoto(photoFile);

      const response = await fetch("/api/applications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          eventId: selectedEvent.id,
          eventTitle: selectedEvent.title,
          name: form.name,
          city: form.city,
          province: form.province,
          region: form.region,
          email: form.email,
          phone: form.phone,
          photoUrl,
          instagram: form.instagram,
          setLink: form.setLink,
          bio: form.bio,
        }),
      });

      const result = (await response.json().catch(() => null)) as {
        error?: string;
      } | null;

      if (!response.ok) {
        throw new Error(result?.error || "Invio non riuscito.");
      }

      setForm({
        ...initialState,
        eventSlug: selectedEvent.slug,
      });
      setCityQuery("");
      setPhotoFile(null);
      setStatus({ type: "ok", message: "Candidatura inviata correttamente." });
    } catch (error) {
      setStatus({
        type: "error",
        message:
          error instanceof Error ? error.message : "Si e verificato un errore.",
      });
    } finally {
      setLoading(false);
    }
  }

  function updateField<Key extends keyof FormState>(
    key: Key,
    value: FormState[Key],
  ) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  }

  return (
    <div className="rounded-2xl border border-[#E31F29]/18 bg-white/[0.03] p-6">
      {loading ? (
        <GlobalLoader
          compact
          eyebrow="Invio candidatura"
          title="Stiamo facendo girare il vinile"
          description="La tua candidatura viene salvata e collegata all'evento selezionato."
        />
      ) : status.type === "error" ? (
        <div className="grid gap-6 rounded-[1.75rem] border border-[#E31F29]/24 bg-[linear-gradient(180deg,rgba(227,31,41,0.1)_0%,rgba(255,255,255,0.03)_100%)] p-6 md:p-8">
          <div className="flex flex-col items-start gap-5">
            <div className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3">
              <Image
                src="/img/loghi/LOGO-OPEN-DECKS_bianco.png"
                alt="OpenDecks"
                width={180}
                height={42}
                className="h-auto w-[140px] md:w-[180px]"
              />
            </div>
            <div className="grid gap-3">
              <span className="text-xs uppercase tracking-[0.24em] text-[#ff8b92]">
                Invio non completato
              </span>
              <h2 className="text-[clamp(1.9rem,4vw,3rem)] font-semibold leading-none tracking-[-0.03em] text-[#f7f3ee]">
                Non siamo riusciti a registrare la candidatura.
              </h2>
              <p className="max-w-[42rem] text-base leading-7 text-white/76">
                {status.message}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              className={ui.action.secondary}
              onClick={() => setStatus({ type: "idle", message: "" })}
            >
              Invia un'altra candidatura
            </button>
            <Link href="/contatti" className={ui.action.secondary}>
              Hai bisogno di supporto? Contattaci
            </Link>
          </div>
        </div>
      ) : status.type === "ok" ? (
        <div className="grid gap-6 rounded-[1.75rem] border border-emerald-500/22 bg-[linear-gradient(180deg,rgba(16,185,129,0.08)_0%,rgba(255,255,255,0.03)_100%)] p-6 md:p-8">
          <div className="flex flex-col items-start gap-5">
            <div className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3">
              <Image
                src="/img/loghi/LOGO-OPEN-DECKS_bianco.png"
                alt="OpenDecks"
                width={180}
                height={42}
                className="h-auto w-[140px] md:w-[180px]"
              />
            </div>
            <div className="grid gap-3">
              <span className="text-xs uppercase tracking-[0.24em] text-emerald-300">
                Invio completato
              </span>
              <h2 className="text-[clamp(1.9rem,4vw,3rem)] font-semibold leading-none tracking-[-0.03em] text-[#f7f3ee]">
                Candidatura inviata con successo.
              </h2>
              <p className="max-w-[42rem] text-base leading-7 text-white/76">
                Verrai ricontattato per la selezione. Controlla la tua casella
                email nei prossimi giorni.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              className={ui.action.secondary}
              onClick={() => setStatus({ type: "idle", message: "" })}
            >
              Invia un'altra candidatura
            </button>
            <Link href="/contatti" className={ui.action.secondary}>
              Hai bisogno di supporto? Contattaci
            </Link>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="grid gap-6">
          <div className="grid gap-3">
            <span className="text-xs uppercase tracking-[0.24em] text-[#E31F29]">
              Candidatura DJ
            </span>
            <h2 className="text-2xl font-semibold tracking-[-0.03em] text-[#f7f3ee]">
              Invia il tuo set
            </h2>
            <p className="max-w-3xl text-sm leading-7 text-white/70">
              Form base gia collegato agli eventi. Quando sara attivo MongoDB, i
              dati verranno salvati sul database senza cambiare la UI.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2 md:col-span-2">
              <label
                htmlFor="eventSlug"
                className="text-xs uppercase tracking-[0.18em] text-white/70"
              >
                Evento
              </label>
              <select
                id="eventSlug"
                className={ui.form.select}
                value={form.eventSlug}
                onChange={(event) =>
                  updateField("eventSlug", event.target.value)
                }
              >
                {events.map((item) => (
                  <option key={item.id} value={item.slug}>
                    {item.title} / {item.locationName} /{" "}
                    {new Date(item.date).toLocaleDateString("it-IT")}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-2">
              <label
                htmlFor="name"
                className="text-xs uppercase tracking-[0.18em] text-white/70"
              >
                Nome DJ
              </label>
              <input
                id="name"
                className={fieldClass}
                value={form.name}
                onChange={(event) => updateField("name", event.target.value)}
                required
              />
            </div>

            <div className="grid gap-2">
              <label
                htmlFor="city"
                className="text-xs uppercase tracking-[0.18em] text-white/70"
              >
                Citta
              </label>
              <input
                id="city"
                list="application-cities"
                className={fieldClass}
                value={cityQuery}
                onChange={(event) => {
                  const nextQuery = event.target.value;
                  const matchedMunicipality = cityOptions.find(
                    (municipality) => municipality.label === nextQuery,
                  );

                  setCityQuery(nextQuery);

                  if (!matchedMunicipality) {
                    setForm((current) => ({
                      ...current,
                      city: "",
                      province: "",
                      region: "",
                    }));
                    return;
                  }

                  setForm((current) => ({
                    ...current,
                    city: matchedMunicipality.city,
                    province: matchedMunicipality.provinceCode,
                    region: matchedMunicipality.region,
                  }));
                }}
                placeholder="Scrivi e seleziona il comune, es. Roma (RM)"
                required
              />
              <datalist id="application-cities">
                {cityOptions.map((municipality) => (
                  <option key={municipality.code} value={municipality.label} />
                ))}
              </datalist>
              {/*   <span className="text-xs text-white/45">
                Cerca il comune e selezionalo dall&apos;elenco. Provincia e regione vengono compilate automaticamente.
              </span> */}
            </div>

            <div className="grid gap-2">
              <label
                htmlFor="instagram"
                className="text-xs uppercase tracking-[0.18em] text-white/70"
              >
                Link Instagram
              </label>
              <input
                id="instagram"
                type="url"
                className={fieldClass}
                value={form.instagram}
                onChange={(event) =>
                  updateField("instagram", event.target.value)
                }
                placeholder="https://instagram.com/..."
                required
              />
            </div>

            <div className="grid gap-2">
              <label
                htmlFor="email"
                className="text-xs uppercase tracking-[0.18em] text-white/70"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                className={fieldClass}
                value={form.email}
                onChange={(event) => updateField("email", event.target.value)}
                placeholder="nome@email.com"
                required
              />
            </div>

            <div className="grid gap-2">
              <label
                htmlFor="phone"
                className="text-xs uppercase tracking-[0.18em] text-white/70"
              >
                Numero di telefono
              </label>
              <input
                id="phone"
                type="tel"
                className={fieldClass}
                value={form.phone}
                onChange={(event) => updateField("phone", event.target.value)}
                placeholder="+39 ..."
                required
              />
            </div>

            <div className="grid gap-2">
              <label
                htmlFor="photo"
                className="text-xs uppercase tracking-[0.18em] text-white/70"
              >
                Foto personale
              </label>
              <input
                id="photo"
                type="file"
                accept="image/png,image/jpeg,image/webp,image/avif"
                className={fieldClass}
                onChange={(event) =>
                  setPhotoFile(event.target.files?.[0] || null)
                }
                required
              />
              <span className="text-xs text-white/45">
                Carica una foto chiara del profilo. Formati supportati: JPG,
                PNG, WEBP, AVIF.
              </span>
            </div>

            <div className="grid gap-2">
              <label
                htmlFor="setLink"
                className="text-xs uppercase tracking-[0.18em] text-white/70"
              >
                Link set
              </label>
              <input
                id="setLink"
                type="url"
                className={fieldClass}
                value={form.setLink}
                onChange={(event) => updateField("setLink", event.target.value)}
                placeholder="https://..."
                required
              />
              <span className="text-xs leading-6 text-white/45">
                Inserisci un link al set tramite SoundCloud, Mixcloud, Drive,
                Dropbox o WeTransfer temporaneo se necessario.
              </span>
            </div>

            <div className="grid gap-2 md:col-span-2">
              <label
                htmlFor="bio"
                className="text-xs uppercase tracking-[0.18em] text-white/70"
              >
                Bio breve
              </label>
              <textarea
                id="bio"
                className={`${fieldClass} min-h-32 resize-y`}
                value={form.bio}
                onChange={(event) => updateField("bio", event.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-[#E31F29] bg-[#E31F29] px-5 py-3 text-sm font-medium text-white transition hover:border-[#c91922] hover:bg-[#c91922]"
              type="submit"
              disabled={loading}
            >
              Invia candidatura
            </button>
            <span className="text-sm text-white/60">
              Campi richiesti: nome, citta, email, telefono, foto, IG, set.
            </span>
          </div>
        </form>
      )}
    </div>
  );
}
