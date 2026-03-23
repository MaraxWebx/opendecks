"use client";

import { useMemo, useState } from "react";

import { ApplicationRecord } from "@/lib/types";
import { ui } from "@/lib/ui";

type AdminApplicationsManagerProps = {
  initialApplications: ApplicationRecord[];
};

export function AdminApplicationsManager({
  initialApplications
}: AdminApplicationsManagerProps) {
  const [applications, setApplications] = useState(initialApplications);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | ApplicationRecord["status"]>("all");
  const [eventFilter, setEventFilter] = useState("all");
  const [selectedApplication, setSelectedApplication] = useState<ApplicationRecord | null>(null);
  const [savingStatus, setSavingStatus] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [draftStatus, setDraftStatus] = useState<ApplicationRecord["status"]>("new");

  const events = useMemo(
    () => Array.from(new Set(applications.map((item) => item.eventTitle))).sort(),
    [applications]
  );

  const filteredApplications = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return applications.filter((application) => {
      const matchesQuery =
        !normalizedQuery ||
        [
          application.name,
          application.city,
          application.email,
          application.instagram,
          application.eventTitle,
          application.setLink,
          application.bio
        ].some((value) => value.toLowerCase().includes(normalizedQuery));

      const matchesStatus =
        statusFilter === "all" || application.status === statusFilter;

      const matchesEvent =
        eventFilter === "all" || application.eventTitle === eventFilter;

      return matchesQuery && matchesStatus && matchesEvent;
    });
  }, [applications, eventFilter, query, statusFilter]);

  async function changeApplicationStatus(status: ApplicationRecord["status"]) {
    if (!selectedApplication) {
      return;
    }

    setSavingStatus(true);
    setStatusMessage("");

    try {
      const response = await fetch(`/api/applications/${selectedApplication.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });

      if (!response.ok) {
        throw new Error("Aggiornamento stato non riuscito.");
      }

      const result = (await response.json()) as { application: ApplicationRecord };
      setApplications((current) =>
        current.map((item) => (item.id === result.application.id ? result.application : item))
      );
      setSelectedApplication(result.application);
      setDraftStatus(result.application.status);
      setStatusMessage("Stato candidatura aggiornato.");
    } catch (error) {
      setStatusMessage(
        error instanceof Error ? error.message : "Errore aggiornamento stato."
      );
    } finally {
      setSavingStatus(false);
    }
  }

  return (
    <div className="grid gap-4">
      <div className={ui.surface.panel}>
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_repeat(2,minmax(0,0.7fr))]">
          <div className="grid gap-2">
            <label htmlFor="applications-query" className={ui.form.label}>
              Cerca
            </label>
            <input
              id="applications-query"
              className={ui.form.field}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Nome, evento, citta, Instagram..."
            />
          </div>
          <div className="grid gap-2">
            <label htmlFor="applications-status" className={ui.form.label}>
              Stato
            </label>
            <select
              id="applications-status"
              className={ui.form.select}
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value as typeof statusFilter)
              }
            >
              <option value="all">Tutti</option>
              <option value="new">Nuove</option>
              <option value="reviewing">In review</option>
              <option value="selected">Approvate</option>
            </select>
          </div>
          <div className="grid gap-2">
            <label htmlFor="applications-event" className={ui.form.label}>
              Evento
            </label>
            <select
              id="applications-event"
              className={ui.form.select}
              value={eventFilter}
              onChange={(event) => setEventFilter(event.target.value)}
            >
              <option value="all">Tutti</option>
              {events.map((eventTitle) => (
                <option key={eventTitle} value={eventTitle}>
                  {eventTitle}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className={ui.surface.panel}>
        <div className="mb-4 flex items-center justify-between gap-3">
          <p className="text-sm text-white/65">
            {filteredApplications.length} candidature trovate
          </p>
        </div>

        <div className="grid gap-4">
          {filteredApplications.map((application) => (
            <article key={application.id} className={ui.surface.card}>
              <div className="mb-3 flex flex-wrap items-center gap-2 text-sm text-white/58">
                <span>{application.eventTitle}</span>
                <span
                  className={`inline-flex rounded-md px-2 py-1 text-xs uppercase tracking-[0.12em] ${
                    application.status === "selected"
                      ? "bg-emerald-500/15 text-emerald-300"
                      : application.status === "reviewing"
                        ? "bg-amber-500/15 text-amber-200"
                        : "bg-[color:var(--color-brand-12)] text-white"
                  }`}
                >
                  {application.status}
                </span>
                <span>{new Date(application.submittedAt).toLocaleDateString("it-IT")}</span>
              </div>

              <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-start">
                <div className="grid gap-2">
                  <h3 className="text-lg font-semibold text-[#f7f3ee]">
                    {application.name}
                  </h3>
                  <p className={ui.text.body}>
                    {application.city} / {application.instagram}
                  </p>
                  <p className="text-sm text-white/55">{application.email}</p>
                  <p className="line-clamp-2 text-sm leading-7 text-white/68">
                    {application.bio}
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    className={ui.action.secondary}
                    onClick={() => {
                      setSelectedApplication(application);
                      setDraftStatus(application.status);
                      setStatusMessage("");
                    }}
                  >
                    Dettagli
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>

      {selectedApplication ? (
        <div className="fixed inset-0 z-50 grid place-items-center p-4">
          <div
            className="absolute inset-0 bg-black/72"
            onClick={() => setSelectedApplication(null)}
          />
          <div className={`${ui.surface.modal} max-w-3xl`}>
            <div className="mb-5 flex items-start justify-between gap-4">
              <div className="grid gap-2">
                <span className={ui.text.eyebrow}>Candidatura</span>
                <h3 className="text-2xl font-semibold tracking-[-0.03em] text-[#f7f3ee]">
                  {selectedApplication.name}
                </h3>
              </div>
              <button
                type="button"
                className={ui.action.secondary}
                onClick={() => setSelectedApplication(null)}
              >
                Chiudi
              </button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <DetailItem label="Evento" value={selectedApplication.eventTitle} />
              <DetailItem label="Stato attuale" value={formatApplicationStatus(selectedApplication.status)} />
              <DetailItem label="Citta" value={selectedApplication.city} />
              <DetailItem label="Email" value={selectedApplication.email} />
              <DetailItem label="Instagram" value={selectedApplication.instagram} />
              <DetailItem
                label="Data invio"
                value={new Date(selectedApplication.submittedAt).toLocaleString("it-IT")}
              />
              <div className={`${ui.surface.card} md:col-span-2`}>
                <span className={ui.form.label}>Cambia stato</span>
                <div className="mt-3 grid gap-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
                  <div className="grid gap-2">
                    <label htmlFor="application-status-detail" className={ui.form.label}>
                      Nuovo stato
                    </label>
                    <select
                      id="application-status-detail"
                      className={ui.form.select}
                      value={draftStatus}
                      disabled={savingStatus}
                      onChange={(event) =>
                        setDraftStatus(event.target.value as ApplicationRecord["status"])
                      }
                    >
                      <option value="new">Nuova</option>
                      <option value="reviewing">In review</option>
                      <option value="selected">Approvata</option>
                    </select>
                  </div>
                  <button
                    type="button"
                    className={ui.action.primary}
                    disabled={savingStatus || draftStatus === selectedApplication.status}
                    onClick={() => changeApplicationStatus(draftStatus)}
                  >
                    {savingStatus ? "Salvataggio..." : "Salva stato"}
                  </button>
                </div>
                {statusMessage ? (
                  <p className="mt-3 text-sm text-white/70">{statusMessage}</p>
                ) : null}
              </div>
              <div className={`${ui.surface.card} md:col-span-2`}>
                <span className={ui.form.label}>Link set</span>
                <a
                  href={selectedApplication.setLink}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 block break-all text-sm text-[#f7f3ee] underline decoration-[color:var(--color-brand)] underline-offset-4"
                >
                  {selectedApplication.setLink}
                </a>
              </div>
              <div className={`${ui.surface.card} md:col-span-2`}>
                <span className={ui.form.label}>Bio</span>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-white/74">
                  {selectedApplication.bio}
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
      <p className="mt-2 text-sm leading-7 text-[#f7f3ee]">{value}</p>
    </div>
  );
}

function formatApplicationStatus(status: ApplicationRecord["status"]) {
  if (status === "new") {
    return "Nuova";
  }

  if (status === "reviewing") {
    return "In review";
  }

  return "Approvata";
}
