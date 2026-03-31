"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

import { BodyScrollLock } from "@/components/body-scroll-lock";
import { getDjEventHistory } from "@/lib/dj-roster";
import { DjRosterRecord, EventRecord } from "@/lib/types";
import { ui } from "@/lib/ui";

type AdminDjRosterManagerProps = {
  initialRoster: DjRosterRecord[];
  events: EventRecord[];
};

export function AdminDjRosterManager({
  initialRoster,
  events,
}: AdminDjRosterManagerProps) {
  const [roster, setRoster] = useState(initialRoster);
  const [query, setQuery] = useState("");
  const [selectedDj, setSelectedDj] = useState<DjRosterRecord | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState("");

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
        item.eventTitle,
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

  return (
    <div className="grid gap-4">
      <div className={ui.surface.panel}>
        <div className="grid gap-2">
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
        <p className="mt-4 min-h-6 text-sm text-white/65">{message}</p>
      </div>

      <div className={ui.surface.panel}>
        <div className="mb-4 flex items-center justify-between gap-3">
          <p className="text-sm text-white/65">
            {filteredRoster.length} DJ nel roster
          </p>
        </div>

        <div className="grid gap-4">
          {filteredRoster.map((entry) => (
            <article key={entry.id} className={ui.surface.card}>
              <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-start">
                <div className="grid gap-2">
                  <div className="flex flex-wrap items-center gap-2 text-sm text-white/58">
                    {/* <span>{entry.eventTitle}</span> */}
                    <span>{formatCityProvince(entry.city, entry.province)}</span>
                    <span>
                      {new Date(entry.approvedAt).toLocaleDateString("it-IT")}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-[#f7f3ee]">
                    {entry.name}
                  </h3>
                  <p className="text-sm text-white/70">{entry.email}</p>
                  <p className="text-sm text-white/55">{entry.phone}</p>
                  <p className="text-sm text-white/55">{entry.instagram}</p>
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
          ))}
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
                  ) : null}

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
                        value={selectedDj.email}
                        href={`mailto:${selectedDj.email}`}
                      />
                      <InfoRow
                        icon={<PhoneIcon />}
                        label="Telefono"
                        value={selectedDj.phone}
                        href={`tel:${selectedDj.phone}`}
                      />
                      <InfoRow
                        icon={<InstagramIcon />}
                        label="Instagram"
                        value={selectedDj.instagram}
                        href={selectedDj.instagram}
                      />
                    </div>
                  </div>
                </div>

                <div className="grid gap-4">
                  <div className="grid gap-3">
                    <DetailItem label="Evento" value={selectedDj.eventTitle} />
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
                      <a
                        href={selectedDj.setLink}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-2 block break-all text-sm text-[#f7f3ee] underline decoration-[color:var(--color-brand)] underline-offset-4"
                      >
                        {selectedDj.setLink}
                      </a>
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
                  {selectedDj.bio}
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
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
