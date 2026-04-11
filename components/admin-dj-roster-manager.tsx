"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import { BodyScrollLock } from "@/components/body-scroll-lock";
import { getDjEventHistory } from "@/lib/dj-roster";
import { DjRosterRecord, EventRecord } from "@/lib/types";
import { ui } from "@/lib/ui";

type AdminDjRosterManagerProps = {
  initialRoster: DjRosterRecord[];
  events: EventRecord[];
};

type ManualDjFormState = {
  eventId: string;
  name: string;
  city: string;
  province: string;
  region: string;
  email: string;
  phone: string;
  instagram: string;
  setLink: string;
  photoUrl: string;
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

const fieldClass =
  "w-full rounded-xl border border-[#E31F29]/20 bg-white/[0.04] px-4 py-3 text-white outline-none transition placeholder:text-white/35 focus:border-[#E31F29]/60";

export function AdminDjRosterManager({
  initialRoster,
  events,
}: AdminDjRosterManagerProps) {
  const [roster, setRoster] = useState(initialRoster);
  const [query, setQuery] = useState("");
  const [selectedDj, setSelectedDj] = useState<DjRosterRecord | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [manualForm, setManualForm] = useState<ManualDjFormState>(() =>
    createInitialManualForm(events),
  );
  const [cityQuery, setCityQuery] = useState("");
  const [cityOptions, setCityOptions] = useState<MunicipalityOption[]>([]);
  const [cityMenuOpen, setCityMenuOpen] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);

  const filteredRoster = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return roster.filter((item) => {
      if (!normalizedQuery) {
        return true;
      }

      return [
        item.name,
        formatCityProvince(item.city, item.province),
        item.region || "",
        item.email,
        item.phone,
        item.instagram,
        item.eventTitle || "",
        item.membershipCardId || "",
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery);
    });
  }, [query, roster]);

  const selectedDjHistory = useMemo(() => {
    if (!selectedDj) {
      return [];
    }

    return getDjEventHistory(selectedDj, events, roster);
  }, [events, roster, selectedDj]);

  function applyMunicipalitySelection(municipality: MunicipalityOption | null) {
    if (!municipality) {
      setManualForm((current) => ({
        ...current,
        city: "",
        province: "",
        region: "",
      }));
      return;
    }

    setCityQuery(municipality.label);
    setManualForm((current) => ({
      ...current,
      city: municipality.city,
      province: municipality.provinceCode,
      region: municipality.region,
    }));
  }

  async function resolveMunicipalityFromQuery(label: string) {
    const normalizedLabel = label.trim();

    if (!normalizedLabel) {
      applyMunicipalitySelection(null);
      return null;
    }

    const localMatch =
      cityOptions.find((municipality) => municipality.label === normalizedLabel) ||
      null;

    if (localMatch) {
      applyMunicipalitySelection(localMatch);
      return localMatch;
    }

    try {
      const response = await fetch(
        `/api/municipalities?q=${encodeURIComponent(normalizedLabel)}&exact=1`,
      );
      const result = (await response.json()) as {
        municipality?: MunicipalityOption | null;
      };
      const municipality = result.municipality || null;
      applyMunicipalitySelection(municipality);
      return municipality;
    } catch {
      applyMunicipalitySelection(null);
      return null;
    }
  }

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
        setCityMenuOpen(Boolean((result.municipalities || []).length));
      } catch {
        if (active) {
          setCityOptions([]);
          setCityMenuOpen(false);
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

  async function toggleMembership(entry: DjRosterRecord, enabled: boolean) {
    setBusyId(entry.id);
    setMessage("");

    try {
      const response = await fetch(`/api/dj-roster/${entry.id}/membership`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled }),
      });

      const result = (await response.json()) as {
        rosterEntry?: DjRosterRecord;
        error?: string;
      };

      if (!response.ok || !result.rosterEntry) {
        throw new Error(
          result.error || "Aggiornamento membership non riuscito.",
        );
      }

      setRoster((current) =>
        current.map((item) =>
          item.id === result.rosterEntry?.id ? result.rosterEntry : item,
        ),
      );
      setSelectedDj((current) =>
        current?.id === result.rosterEntry?.id
          ? (result.rosterEntry ?? null)
          : current,
      );
      setMessage(
        enabled
          ? "Membership card attivata e inviata via email."
          : "Membership card disattivata.",
      );
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Errore membership.");
    } finally {
      setBusyId(null);
    }
  }

  async function handleCreateManualDj(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsCreating(true);
    setMessage("");

    try {
      if (!manualForm.province) {
        const resolvedMunicipality = await resolveMunicipalityFromQuery(cityQuery);

        if (!resolvedMunicipality) {
          throw new Error("Seleziona una citta valida dall'autocomplete.");
        }
      }

      const photoUrl = await uploadPhoto(photoFile);

      const response = await fetch("/api/dj-roster", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...manualForm,
          photoUrl,
        }),
      });

      const result = (await response.json()) as {
        rosterEntry?: DjRosterRecord;
        error?: string;
      };

      if (!response.ok || !result.rosterEntry) {
        throw new Error(result.error || "Creazione DJ non riuscita.");
      }

      setRoster((current) => [result.rosterEntry!, ...current]);
      setSelectedDj(result.rosterEntry);
      setManualForm(createInitialManualForm(events));
      setCityQuery("");
      setCityOptions([]);
      setCityMenuOpen(false);
      setPhotoFile(null);
      setIsCreateOpen(false);
      setMessage("DJ aggiunto manualmente al roster.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Errore creazione DJ.");
    } finally {
      setIsCreating(false);
    }
  }

  function updateManualForm<K extends keyof ManualDjFormState>(
    key: K,
    value: ManualDjFormState[K],
  ) {
    setManualForm((current) => ({ ...current, [key]: value }));
  }

  return (
    <div className="grid min-w-0 gap-4">
      <div className="grid gap-4 px-1 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="grid flex-1 gap-2">
            <label htmlFor="dj-roster-query" className={ui.form.label}>
              Cerca DJ
            </label>
            <input
              id="dj-roster-query"
              className={ui.form.field}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Nome, citta, email, telefono, evento..."
            />
          </div>
          <button
            type="button"
            className={isCreateOpen ? ui.action.secondary : ui.action.primary}
            onClick={() => {
              setMessage("");
              setIsCreateOpen((current) => !current);
            }}
          >
            {isCreateOpen ? "Chiudi form" : "Aggiungi DJ manualmente"}
          </button>
        </div>

        {isCreateOpen ? (
          <form className={ui.surface.card} onSubmit={handleCreateManualDj}>
            <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
              <div className="grid gap-2">
                <span className={ui.text.eyebrow}>Inserimento manuale</span>
                <p className="max-w-2xl text-sm leading-7 text-white/70">
                  Usa questo form per aggiungere nel roster un DJ che non ha
                  inviato candidatura dal sito.
                </p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Evento" htmlFor="manual-dj-event">
                <select
                  id="manual-dj-event"
                  className={ui.form.select}
                  value={manualForm.eventId}
                  onChange={(event) =>
                    updateManualForm("eventId", event.target.value)
                  }
                >
                  <option value="">Nessun evento associato</option>
                  {events.map((entry) => (
                    <option key={entry.id} value={entry.id}>
                      {entry.title} /{" "}
                      {new Date(entry.date).toLocaleDateString("it-IT")}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Nome DJ" htmlFor="manual-dj-name">
                <input
                  id="manual-dj-name"
                  className={fieldClass}
                  value={manualForm.name}
                  onChange={(event) =>
                    updateManualForm("name", event.target.value)
                  }
                  required
                />
              </Field>

              <Field label="Citta" htmlFor="manual-dj-city">
                <div className="relative">
                  <input
                    id="manual-dj-city"
                    className={fieldClass}
                    value={cityQuery}
                    onChange={(event) => {
                      const nextQuery = event.target.value;
                      setCityQuery(nextQuery);
                      setCityMenuOpen(true);
                      void resolveMunicipalityFromQuery(nextQuery);
                    }}
                    onFocus={() => {
                      if (cityOptions.length) {
                        setCityMenuOpen(true);
                      }
                    }}
                    onBlur={() => {
                      window.setTimeout(() => {
                        setCityMenuOpen(false);
                        void resolveMunicipalityFromQuery(cityQuery);
                      }, 120);
                    }}
                    placeholder="Scrivi e seleziona il comune, es. Roma - (RM)"
                    autoComplete="off"
                    required
                  />
                  {cityMenuOpen && cityOptions.length ? (
                    <div className="absolute z-20 mt-2 max-h-64 w-full overflow-auto rounded-xl border border-[#E31F29]/20 bg-[#0b0b0c] p-2 shadow-[0_18px_50px_rgba(0,0,0,0.45)]">
                      {cityOptions.map((municipality) => (
                        <button
                          key={municipality.code}
                          type="button"
                          className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm text-white/82 transition hover:bg-white/6"
                          onMouseDown={(event) => {
                            event.preventDefault();
                            applyMunicipalitySelection(municipality);
                            setCityMenuOpen(false);
                          }}
                        >
                          <span>{municipality.label}</span>
                          <span className="text-xs uppercase tracking-[0.14em] text-white/45">
                            {municipality.region}
                          </span>
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
              </Field>

              <Field label="Email" htmlFor="manual-dj-email">
                <input
                  id="manual-dj-email"
                  type="email"
                  className={fieldClass}
                  value={manualForm.email}
                  onChange={(event) =>
                    updateManualForm("email", event.target.value)
                  }
                  required
                />
              </Field>

              <Field label="Telefono" htmlFor="manual-dj-phone">
                <input
                  id="manual-dj-phone"
                  type="tel"
                  className={fieldClass}
                  value={manualForm.phone}
                  onChange={(event) =>
                    updateManualForm("phone", event.target.value)
                  }
                  required
                />
              </Field>

              <Field label="Link Instagram" htmlFor="manual-dj-instagram">
                <input
                  id="manual-dj-instagram"
                  type="url"
                  className={fieldClass}
                  value={manualForm.instagram}
                  onChange={(event) =>
                    updateManualForm("instagram", event.target.value)
                  }
                  placeholder="https://instagram.com/..."
                  required
                />
              </Field>

              <Field label="Link set" htmlFor="manual-dj-set-link">
                <input
                  id="manual-dj-set-link"
                  type="url"
                  className={fieldClass}
                  value={manualForm.setLink}
                  onChange={(event) =>
                    updateManualForm("setLink", event.target.value)
                  }
                  required
                />
              </Field>

              <Field label="Foto personale" htmlFor="manual-dj-photo">
                <input
                  id="manual-dj-photo"
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
              </Field>

              <Field label="Bio" htmlFor="manual-dj-bio" full>
                <textarea
                  id="manual-dj-bio"
                  className={`${fieldClass} min-h-32 resize-y`}
                  value={manualForm.bio}
                  onChange={(event) =>
                    updateManualForm("bio", event.target.value)
                  }
                />
              </Field>
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              <button
                type="submit"
                className={ui.action.primary}
                disabled={isCreating}
              >
                {isCreating ? "Salvataggio..." : "Salva DJ"}
              </button>
              <button
                type="button"
                className={ui.action.secondary}
                onClick={() => {
                  setManualForm(createInitialManualForm(events));
                  setCityQuery("");
                  setCityOptions([]);
                  setCityMenuOpen(false);
                  setPhotoFile(null);
                  setMessage("");
                }}
                disabled={isCreating}
              >
                Reset form
              </button>
            </div>
          </form>
        ) : null}

        {message ? <p className="text-sm text-white/65">{message}</p> : null}
      </div>

      <div className={`${ui.surface.panel} min-w-0`}>
        <div className="mb-4 flex items-center justify-between gap-3">
          <p className="text-sm text-white/65">
            {filteredRoster.length} DJ nel roster
          </p>
        </div>

        <div className="grid gap-4">
          {filteredRoster.length ? (
            filteredRoster.map((entry) => (
              <article key={entry.id} className={`${ui.surface.card} min-w-0`}>
                <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-start">
                  <div className="grid min-w-0 gap-2">
                    <div className="flex flex-wrap items-center gap-2 text-sm text-white/58">
                      <span>{entry.eventTitle || "Nessun evento associato"}</span>
                      <span>{formatCityProvince(entry.city, entry.province)}</span>
                      <span>
                        {new Date(entry.approvedAt).toLocaleDateString("it-IT")}
                      </span>
                      {!entry.applicationId ? (
                        <span className="inline-flex rounded-md border border-[color:var(--color-brand-20)] px-2.5 py-1 text-[0.68rem] uppercase tracking-[0.16em] text-white/75">
                          Manuale
                        </span>
                      ) : null}
                    </div>
                    <h3 className="break-words text-lg font-semibold text-[#f7f3ee]">
                      {entry.name}
                    </h3>
                    <p className="break-words text-sm text-white/70">
                      {entry.email}
                    </p>
                    <p className="break-words text-sm text-white/55">
                      {entry.phone}
                    </p>
                    <p className="break-words text-sm text-white/55">
                      {entry.instagram}
                    </p>
                    <div className="flex flex-wrap gap-2 pt-1">
                      {entry.membershipCardEnabled ? (
                        <span className="inline-flex rounded-md bg-emerald-500/15 px-3 py-1.5 text-xs uppercase tracking-[0.12em] text-emerald-300">
                          Card attiva
                        </span>
                      ) : (
                        <span className="inline-flex rounded-md bg-[color:var(--color-brand-12)] px-3 py-1.5 text-xs uppercase tracking-[0.12em] text-white">
                          Nessuna card
                        </span>
                      )}
                      {entry.membershipCardId ? (
                        <span className="inline-flex rounded-md border border-[color:var(--color-brand-20)] px-3 py-1.5 text-xs uppercase tracking-[0.12em] text-white/75">
                          {entry.membershipCardId}
                        </span>
                      ) : null}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      className={ui.action.secondary}
                      onClick={() => setSelectedDj(entry)}
                    >
                      Dettagli
                    </button>
                    <button
                      type="button"
                      className={
                        entry.membershipCardEnabled
                          ? ui.action.secondary
                          : ui.action.primary
                      }
                      disabled={busyId === entry.id}
                      onClick={() =>
                        toggleMembership(entry, !entry.membershipCardEnabled)
                      }
                    >
                      {busyId === entry.id
                        ? "Invio..."
                        : entry.membershipCardEnabled
                          ? "Disattiva card"
                          : "Abilita card"}
                    </button>
                  </div>
                </div>
              </article>
            ))
          ) : (
            <div className={ui.surface.card}>
              <p className="text-sm text-white/60">
                Nessun DJ trovato con i filtri attivi.
              </p>
            </div>
          )}
        </div>
      </div>

      {selectedDj ? (
        <div className="fixed inset-0 z-50 grid place-items-center p-4">
          <BodyScrollLock />
          <div
            className="absolute inset-0 bg-black/72"
            onClick={() => setSelectedDj(null)}
          />
          <div className={`${ui.surface.modal} max-w-[54rem]`}>
            <div className="mb-5 flex items-start justify-between gap-4">
              <div className="grid gap-2">
                <span className={ui.text.eyebrow}>DJ roster</span>
                <h3 className="text-2xl font-semibold tracking-[-0.03em] text-[#f7f3ee]">
                  {selectedDj.name}
                </h3>
              </div>
              <button
                type="button"
                className={ui.action.secondary}
                onClick={() => setSelectedDj(null)}
              >
                Chiudi
              </button>
            </div>

            <div className="grid gap-4">
              <div className="grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)] lg:items-start">
                <div className={ui.surface.card}>
                  {selectedDj.photoUrl ? (
                    <>
                      <span className={ui.form.label}>Foto profilo</span>
                      <div className="relative mt-3">
                        <img
                          src={selectedDj.photoUrl}
                          alt={selectedDj.name}
                          className="h-64 w-full rounded-xl object-cover lg:h-72"
                        />
                        <div className="absolute bottom-3 right-3 inline-flex items-center rounded-full border border-white/15 bg-black/72 px-3 py-1.5 text-[0.68rem] font-medium uppercase tracking-[0.18em] text-white shadow-[0_10px_30px_rgba(0,0,0,0.32)] backdrop-blur-sm">
                          <span className="mr-2 h-2 w-2 rounded-full bg-[color:var(--color-brand)]" />
                          OpenDecks
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="rounded-xl border border-dashed border-white/12 px-4 py-6 text-sm text-white/45">
                      Nessuna foto profilo disponibile.
                    </div>
                  )}

                  <div className="mt-5 grid gap-4">
                    <span className={ui.form.label}>Info anagrafiche</span>
                    <div className="grid gap-3 text-sm text-[#f7f3ee]">
                      <InfoRow
                        icon={<PinIcon />}
                        label="Citta"
                        value={formatCityProvince(
                          selectedDj.city,
                          selectedDj.province,
                        )}
                      />
                      <InfoRow
                        icon={<PinIcon />}
                        label="Regione"
                        value={selectedDj.region || "Non definita"}
                      />
                      <InfoRow
                        icon={<MailIcon />}
                        label="Email"
                        value={selectedDj.email || "Non disponibile"}
                        href={
                          selectedDj.email
                            ? `mailto:${selectedDj.email}`
                            : undefined
                        }
                      />
                      <InfoRow
                        icon={<PhoneIcon />}
                        label="Telefono"
                        value={selectedDj.phone || "Non disponibile"}
                        href={
                          selectedDj.phone
                            ? `tel:${selectedDj.phone}`
                            : undefined
                        }
                      />
                      <InfoRow
                        icon={<InstagramIcon />}
                        label="Instagram"
                        value={selectedDj.instagram || "Non disponibile"}
                        href={normalizeExternalHref(selectedDj.instagram)}
                      />
                    </div>
                  </div>
                </div>

                <div className="grid gap-4">
                  <div className="grid gap-3">
                    <DetailItem
                      label="Evento"
                      value={selectedDj.eventTitle || "Nessun evento associato"}
                    />
                    <DetailItem
                      label="Origine"
                      value={
                        selectedDj.applicationId
                          ? "Da candidatura approvata"
                          : "Inserimento manuale"
                      }
                    />
                    <DetailItem
                      label="Approvato il"
                      value={new Date(selectedDj.approvedAt).toLocaleString(
                        "it-IT",
                      )}
                    />
                    <div className={ui.surface.card}>
                      <span className={ui.form.label}>Membership</span>
                      <div className="mt-3 flex flex-wrap items-center gap-3">
                        <span
                          className={`inline-flex rounded-md px-3 py-1.5 text-xs uppercase tracking-[0.12em] ${
                            selectedDj.membershipCardEnabled
                              ? "bg-emerald-500/15 text-emerald-300"
                              : "bg-[color:var(--color-brand-12)] text-white"
                          }`}
                        >
                          {selectedDj.membershipCardEnabled
                            ? "Attiva"
                            : "Non attiva"}
                        </span>
                        <span className="text-sm text-white/70">
                          Card ID: {selectedDj.membershipCardId || "Non emessa"}
                        </span>
                      </div>
                    </div>
                    <div className={ui.surface.card}>
                      <span className={ui.form.label}>Link set</span>
                      {selectedDj.setLink ? (
                        <a
                          href={selectedDj.setLink}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-2 block break-all text-sm text-[#f7f3ee] underline decoration-[color:var(--color-brand)] underline-offset-4"
                        >
                          {selectedDj.setLink}
                        </a>
                      ) : (
                        <p className="mt-2 text-sm text-white/50">
                          Nessun link set disponibile.
                        </p>
                      )}
                    </div>
                    <div className={ui.surface.card}>
                      <span className={ui.form.label}>Storico eventi</span>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {selectedDjHistory.length ? (
                          selectedDjHistory.map((event) => (
                            <Link
                              key={event.id}
                              href={`/admin/eventi/${event.slug}`}
                              className="inline-flex rounded-md border border-[color:var(--color-brand-20)] px-3 py-1.5 text-xs uppercase tracking-[0.12em] text-white/75"
                            >
                              {event.title} /{" "}
                              {new Date(event.date).toLocaleDateString("it-IT")}
                            </Link>
                          ))
                        ) : (
                          <span className="text-sm text-white/50">
                            Nessun evento collegato in storico.
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className={ui.surface.card}>
                <span className={ui.form.label}>Bio</span>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-white/74">
                  {selectedDj.bio || "Nessuna bio disponibile."}
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function Field({
  label,
  htmlFor,
  full,
  children,
}: {
  label: string;
  htmlFor: string;
  full?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className={`grid gap-2 ${full ? "md:col-span-2" : ""}`}
    >
      <span className={ui.form.label}>{label}</span>
      {children}
    </label>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div className={ui.surface.card}>
      <span className={ui.form.label}>{label}</span>
      <p className="mt-2 break-all text-sm leading-7 text-[#f7f3ee]">{value}</p>
    </div>
  );
}

function InfoRow({
  icon,
  label,
  value,
  href,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  href?: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 text-[#E31F29]">{icon}</span>
      <div className="grid gap-1">
        <span className="text-[0.68rem] uppercase tracking-[0.18em] text-white/48">
          {label}
        </span>
        {href ? (
          <a
            href={href}
            target={href.startsWith("http") ? "_blank" : undefined}
            rel={href.startsWith("http") ? "noreferrer" : undefined}
            className="break-all leading-6 text-[#f7f3ee] underline decoration-[#E31F29]/55 underline-offset-4"
          >
            {value}
          </a>
        ) : (
          <p className="leading-6 text-[#f7f3ee]">{value}</p>
        )}
      </div>
    </div>
  );
}

function createInitialManualForm(events: EventRecord[]): ManualDjFormState {
  return {
    eventId: "",
    name: "",
    city: "",
    province: "",
    region: "",
    email: "",
    phone: "",
    instagram: "",
    setLink: "",
    photoUrl: "",
    bio: "",
  };
}

function normalizeExternalHref(value: string) {
  if (!value) {
    return undefined;
  }

  if (value.startsWith("http://") || value.startsWith("https://")) {
    return value;
  }

  if (value.startsWith("@")) {
    return `https://instagram.com/${value.slice(1)}`;
  }

  return `https://instagram.com/${value}`;
}

function PinIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M12 21s6-5.33 6-11a6 6 0 1 0-12 0c0 5.67 6 11 6 11Z"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <circle cx="12" cy="10" r="2.5" fill="currentColor" />
    </svg>
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
        d="M4 7.5 12 13l8-5.5M5 6h14a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1Z"
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
        d="M7.2 4h3L11 7.8c.1.5 0 1-.4 1.4l-1.5 1.5a15 15 0 0 0 4.9 4.9l1.5-1.5c.4-.4.9-.5 1.4-.4L20 14.8v3c0 .7-.6 1.2-1.3 1.2A15.8 15.8 0 0 1 5 5.3C5 4.6 5.5 4 6.2 4h1Z"
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

function formatCityProvince(city: string, province?: string) {
  return province ? `${city} (${province})` : city;
}
