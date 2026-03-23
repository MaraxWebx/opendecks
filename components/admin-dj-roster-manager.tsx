"use client";

import { useMemo, useState } from "react";

import { DjRosterRecord } from "@/lib/types";
import { ui } from "@/lib/ui";

type AdminDjRosterManagerProps = {
  initialRoster: DjRosterRecord[];
};

export function AdminDjRosterManager({ initialRoster }: AdminDjRosterManagerProps) {
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
        item.city,
        item.email,
        item.instagram,
        item.eventTitle,
        item.membershipCardId || ""
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery);
    });
  }, [query, roster]);

  async function toggleMembership(entry: DjRosterRecord, enabled: boolean) {
    setBusyId(entry.id);
    setMessage("");

    try {
      const response = await fetch(`/api/dj-roster/${entry.id}/membership`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled })
      });

      const result = (await response.json()) as { rosterEntry?: DjRosterRecord; error?: string };

      if (!response.ok || !result.rosterEntry) {
        throw new Error(result.error || "Aggiornamento membership non riuscito.");
      }

      setRoster((current) =>
        current.map((item) => (item.id === result.rosterEntry?.id ? result.rosterEntry : item))
      );
      setSelectedDj((current) =>
        current?.id === result.rosterEntry?.id ? (result.rosterEntry ?? null) : current
      );
      setMessage(
        enabled
          ? "Membership card attivata e inviata via email."
          : "Membership card disattivata."
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
            placeholder="Nome, citta, email, evento..."
          />
        </div>
        <p className="mt-4 min-h-6 text-sm text-white/65">{message}</p>
      </div>

      <div className={ui.surface.panel}>
        <div className="mb-4 flex items-center justify-between gap-3">
          <p className="text-sm text-white/65">{filteredRoster.length} DJ nel roster</p>
        </div>

        <div className="grid gap-4">
          {filteredRoster.map((entry) => (
            <article key={entry.id} className={ui.surface.card}>
              <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-start">
                <div className="grid gap-2">
                  <div className="flex flex-wrap items-center gap-2 text-sm text-white/58">
                    <span>{entry.eventTitle}</span>
                    <span>{entry.city}</span>
                    <span>{new Date(entry.approvedAt).toLocaleDateString("it-IT")}</span>
                  </div>
                  <h3 className="text-lg font-semibold text-[#f7f3ee]">{entry.name}</h3>
                  <p className="text-sm text-white/70">{entry.email}</p>
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
                    className={entry.membershipCardEnabled ? ui.action.secondary : ui.action.primary}
                    disabled={busyId === entry.id}
                    onClick={() => toggleMembership(entry, !entry.membershipCardEnabled)}
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
          <div className="absolute inset-0 bg-black/72" onClick={() => setSelectedDj(null)} />
          <div className={`${ui.surface.modal} max-w-3xl`}>
            <div className="mb-5 flex items-start justify-between gap-4">
              <div className="grid gap-2">
                <span className={ui.text.eyebrow}>DJ roster</span>
                <h3 className="text-2xl font-semibold tracking-[-0.03em] text-[#f7f3ee]">
                  {selectedDj.name}
                </h3>
              </div>
              <button type="button" className={ui.action.secondary} onClick={() => setSelectedDj(null)}>
                Chiudi
              </button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <DetailItem label="Evento" value={selectedDj.eventTitle} />
              <DetailItem label="Città" value={selectedDj.city} />
              <DetailItem label="Email" value={selectedDj.email} />
              <DetailItem label="Instagram" value={selectedDj.instagram} />
              <DetailItem label="Link set" value={selectedDj.setLink} />
              <DetailItem
                label="Approvato il"
                value={new Date(selectedDj.approvedAt).toLocaleString("it-IT")}
              />
              <DetailItem
                label="Membership"
                value={selectedDj.membershipCardEnabled ? "Attiva" : "Non attiva"}
              />
              <DetailItem label="Card ID" value={selectedDj.membershipCardId || "Non emessa"} />
              <div className={`${ui.surface.card} md:col-span-2`}>
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
